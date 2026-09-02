import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { getMastercard, withdrawMastercard } from '@/lib/pagocards';
import { getCard4xx, withdrawCard4xx } from '@/lib/pagocards-4xxbins';
import { sendPushToUser } from '@/lib/push';
import { FEEXPAY_NETWORKS, isAutoPayoutEligible, payoutAndAwaitResult, type FeexPayNetwork } from '@/lib/feexpay';
import { createVerzaPayout, isVerzaPayoutCountry, VERZAPAY_PAYOUT_COUNTRIES } from '@/lib/verzapay';
import { z } from 'zod';

const XOF_RATE = 600; // taux interne fixe USD -> XOF, cohérent avec le rechargement
const FEEXPAY_NETWORK_IDS = Object.keys(FEEXPAY_NETWORKS) as FeexPayNetwork[];

const Schema = z.object({
  cardId: z.string().min(1),
  amount: z.number().min(2).max(2000), // USD — Pagocards exige > 1, on prend une marge de sécurité
  network: z.enum(FEEXPAY_NETWORK_IDS as [FeexPayNetwork, ...FeexPayNetwork[]]).optional(),
  phoneNumber: z.string().min(8).max(15).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!rateLimit(`withdraw:${user.uid}`, 5, 60000))
      return NextResponse.json({ success: false, error: 'Trop de requêtes.' }, { status: 429 });

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const { cardId, amount, network, phoneNumber } = parsed.data;

    const cardRef = adminDb.collection('cards').doc(cardId);
    const cardDoc = await cardRef.get();
    if (!cardDoc.exists) return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });
    const card = cardDoc.data()!;
    if (card.userId !== user.uid) return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });

    // Doc Pagocards : le retrait 4XXBINs n'est documenté QUE pour les cartes 400BIN/493BIN
    // (Visa) — pas pour 536_master (Mastercard). L'EURO-MASTER classique reste disponible.
    const isClassicMastercard = card.apiFamily !== '4xxbins' && card.brand === 'mastercard';
    const is4xxbins = card.apiFamily === '4xxbins' && card.productCode !== '536_master';
    if (!isClassicMastercard && !is4xxbins)
      return NextResponse.json({ success: false, error: 'Le retrait est disponible uniquement pour les cartes Mastercard (EURO-MASTER) ou Visa nouvelle génération.' }, { status: 400 });
    if (card.status !== 'active')
      return NextResponse.json({ success: false, error: 'Carte non active.' }, { status: 400 });

    // Solde vérifié en direct auprès de l'émetteur pour éviter tout écart avec la valeur locale.
    let liveBalance: number;
    if (is4xxbins) {
      const liveCard = await getCard4xx(card.pagocardsCardId);
      liveBalance = liveCard.data.balance?.display_amount ?? 0;
    } else {
      const liveCard = await getMastercard({ cardid: card.pagocardsCardId, email: card.email });
      liveBalance = liveCard.balance ?? 0;
    }
    if (liveBalance < amount)
      return NextResponse.json({ success: false, error: 'Solde insuffisant sur la carte.' }, { status: 400 });

    // Montant net réellement crédité au wallet Pagocards, celui qu'on peut effectivement
    // reverser au client par Mobile Money :
    //   - EURO-MASTER : la doc facture $1 de frais sur le retrait, déjà déduit dans
    //     usdc_amount (ex. amount=10 -> usdc_amount=9). On ne peut pas reverser plus que ça.
    //   - 4XXBINs (400/493BIN) : aucun frais de retrait documenté, display_amount == amount.
    let netAmountUSD: string | number;
    let pagocardsTransactionId: string;
    if (is4xxbins) {
      const res = await withdrawCard4xx(card.pagocardsCardId, amount);
      netAmountUSD = res.data.display_amount ?? amount;
      pagocardsTransactionId = res.data.transaction_id;
    } else {
      const res = await withdrawMastercard({ cardid: card.pagocardsCardId, email: card.email, amount });
      netAmountUSD = res.usdc_amount ?? amount;
      pagocardsTransactionId = res.transactionId;
    }

    const amountXOF = Math.round(Number(netAmountUSD) * XOF_RATE);
    const withdrawalFeeUSD = parseFloat((amount - Number(netAmountUSD)).toFixed(2));
    const txRef = await adminDb.collection('transactions').add({
      userId: user.uid,
      cardId,
      type: 'card_withdrawal',
      amountUSD: netAmountUSD, // montant net réellement reversable (frais Pagocards déjà déduits)
      requestedAmountUSD: amount,
      withdrawalFeeUSD,
      amount: amountXOF, // équivalent FCFA, montant réellement envoyé/à envoyer par Mobile Money
      currency: 'USD',
      status: 'pending_payout', // valeur par défaut, ajustée juste après selon le résultat du payout auto
      pagocardsTransactionId,
      createdAt: new Date().toISOString(),
    });

    // La doc ne garantit pas que le montant déduit de la carte corresponde exactement au
    // montant USD demandé (conversion EUR pour l'EURO-MASTER) — on relit le vrai solde.
    try {
      const fresh = is4xxbins
        ? (await getCard4xx(card.pagocardsCardId)).data.balance?.display_amount
        : (await getMastercard({ cardid: card.pagocardsCardId, email: card.email })).balance;
      await cardRef.update({ balance: fresh ?? Math.max(0, liveBalance - amount) });
    } catch {
      await cardRef.update({ balance: Math.max(0, liveBalance - amount) });
    }

    // ── Tentative de virement automatique : FeexPay d'abord, VerzaPay en secours ──
    // Si aucun réseau/numéro n'est fourni, si le réseau exige un OTP (impossible à
    // automatiser sans intervention du bénéficiaire), ou si le montant est sous le minimum,
    // FeexPay est sauté. S'il échoue (ex. solde FeexPay insuffisant) ou est sauté, on tente
    // VerzaPay avec le même numéro si le pays du client supporte son décaissement. Si les
    // deux échouent ou sont inéligibles, on retombe en file manuelle — comportement inchangé.
    let autoResult: 'sent' | 'failed_fallback' | 'pending_fallback' | 'error_fallback' | 'skipped' = 'skipped';
    let payoutProvider: 'feexpay' | 'verzapay' | null = null;
    let feexpayReference: string | undefined;
    let verzapayPayoutId: string | undefined;
    let payoutNote: string | undefined;

    const networkCfg = network ? FEEXPAY_NETWORKS[network] : undefined;
    const feexpayEligible = network && phoneNumber && networkCfg && isAutoPayoutEligible(network) && amountXOF >= networkCfg.minAmountXOF;

    if (feexpayEligible) {
      payoutProvider = 'feexpay';
      try {
        const result = await payoutAndAwaitResult({
          network, phoneNumber: phoneNumber!, amount: amountXOF,
          motif: 'LFD WEB CARD', callback_info: txRef.id,
        });
        feexpayReference = result.payout.reference;
        if (result.resolved && result.success) {
          autoResult = 'sent';
        } else if (result.resolved && !result.success) {
          autoResult = 'failed_fallback';
          payoutNote = result.finalStatus?.reason || result.finalStatus?.responsemsg;
        } else {
          autoResult = 'pending_fallback'; // toujours PENDING après les tentatives de vérification
        }
      } catch (err) {
        autoResult = 'error_fallback'; // ex. solde FeexPay insuffisant, erreur réseau, etc.
        payoutNote = err instanceof Error ? err.message : 'Erreur FeexPay';
      }
    }

    // Secours VerzaPay : uniquement si FeexPay n'a pas déjà réussi ou n'est pas en attente
    // de confirmation (jamais deux tentatives en parallèle sur le même retrait).
    if (autoResult !== 'sent' && autoResult !== 'pending_fallback' && phoneNumber) {
      const userDoc = await adminDb.collection('users').doc(user.uid).get();
      const userCountry = (userDoc.data()?.country as string) || '';
      if (isVerzaPayoutCountry(userCountry)) {
        try {
          const intlPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
          const payout = await createVerzaPayout({
            amount: amountXOF,
            currency: VERZAPAY_PAYOUT_COUNTRIES[userCountry.toUpperCase()],
            recipientPhone: intlPhone,
            recipientName: (card.cardholderName as string) || 'Client LFD WEB CARD',
          });
          if (payout.id) {
            payoutProvider = 'verzapay';
            verzapayPayoutId = payout.id;
            // Aucune consultation de statut disponible côté VerzaPay — seul le webhook
            // payout.completed/payout.failed confirmera le résultat final.
            autoResult = 'pending_fallback';
            payoutNote = undefined;
          }
        } catch (err) {
          if (payoutProvider !== 'feexpay') payoutProvider = 'verzapay';
          autoResult = 'error_fallback';
          payoutNote = err instanceof Error ? err.message : 'Erreur VerzaPay';
        }
      }
    }

    const finalStatus = autoResult === 'sent' ? 'completed' : 'pending_payout';
    await txRef.update({
      status: finalStatus,
      payoutProvider,
      payoutAutoResult: autoResult,
      ...(feexpayReference ? { feexpayReference } : {}),
      ...(verzapayPayoutId ? { verzapayPayoutId } : {}),
      ...(payoutNote ? { payoutNote } : {}),
      ...(finalStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}),
    });

    const title = finalStatus === 'completed' ? 'Retrait reçu ✅' : 'Retrait initié 💸';
    const message = finalStatus === 'completed'
      ? `${amountXOF.toLocaleString()} FCFA ont été envoyés automatiquement sur votre Mobile Money.`
      : withdrawalFeeUSD > 0
        ? `Retrait de $${amount} (dont $${withdrawalFeeUSD} de frais) en cours de traitement. Vous recevrez l'équivalent (~${amountXOF.toLocaleString()} FCFA) par Mobile Money sous 24 à 48h.`
        : `Retrait de $${amount} en cours de traitement. Vous recevrez l'équivalent (~${amountXOF.toLocaleString()} FCFA) par Mobile Money sous 24 à 48h.`;
    await adminDb.collection('notifications').add({
      userId: user.uid, cardId, type: 'withdrawal_initiated',
      title, message, read: false, createdAt: new Date().toISOString(),
    });
    await sendPushToUser(user.uid, { title, body: message, data: { url: '/dashboard' } });

    return NextResponse.json({ success: true, data: { transactionId: txRef.id, amountXOF, auto: finalStatus === 'completed' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
