import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { createCard, fundCard, getCard, getAllCards, purchaseGiftcard, type CardBrand } from '@/lib/pagocards';
import { createCard4xx, fundCard4xx, type Product4xx } from '@/lib/pagocards-4xxbins';
import { sendReloadSuccessEmail, sendReloadFailedEmail } from '@/lib/brevo';
import { sendPushToUser } from '@/lib/push';
import { creditReferralCommission } from '@/lib/referral';

const OK = () => NextResponse.json({ received: true });

// Pagocards tronque les montants à 2 décimales SANS arrondir (doc : "55.175678 is
// processed as 55.17") — Math.floor plutôt que toFixed(2), qui arrondirait au centime
// supérieur et pourrait légèrement décaler notre comptabilité interne du solde réel.
const truncate2 = (n: number) => Math.floor(n * 100) / 100;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return OK(); }

  const { event, transaction } = body as { event?: string; transaction?: Record<string, unknown> };
  const raw = ((transaction?.status as string) || event || '').toLowerCase();
  const isSuccess = ['successful', 'success', 'completed', 'paid', 'payment.completed'].includes(raw);
  const isFailed = ['failed', 'failure', 'cancelled', 'rejected', 'payment.failed'].includes(raw);
  if (!isSuccess && !isFailed) return OK();

  // Retrouver la transaction
  let txDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  const meta = transaction?.metadata as Record<string, string> | undefined;
  const txId = meta?.transactionId;

  if (txId) {
    const d = await adminDb.collection('transactions').doc(txId).get();
    if (d.exists) txDoc = d;
  }
  if (!txDoc) {
    const ref = (transaction?.reference as string) || (transaction?.id as string);
    if (ref) {
      const s = await adminDb.collection('transactions').where('pid', '==', ref).limit(1).get();
      if (!s.empty) txDoc = s.docs[0];
    }
  }
  // Fallback sur tx.total (montant client) et non tx.amount (montant carte)
  if (!txDoc && transaction?.amount) {
    const s = await adminDb.collection('transactions')
      .where('status', '==', 'pending')
      .where('total', '==', transaction.amount as number)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (!s.empty) txDoc = s.docs[0];
  }
  if (!txDoc) return OK();

  const tx = txDoc.data()!;
  if (tx.status === 'success') return OK();

  if (isFailed) {
    await txDoc.ref.update({ status: 'failed', completedAt: new Date().toISOString() });
    const failTitle = 'Paiement échoué ❌';
    const failMessage = `Votre paiement de ${(tx.total ?? tx.amount)?.toLocaleString()} FCFA n'a pas abouti. Veuillez réessayer.`;
    await adminDb.collection('notifications').add({
      userId: tx.userId,
      type: 'payment_failed',
      title: failTitle,
      message: failMessage,
      read: false,
      createdAt: new Date().toISOString(),
    });
    await sendPushToUser(tx.userId, { title: failTitle, body: failMessage, data: { url: '/dashboard' } });

    // Email échec si c'est un rechargement
    if (tx.type === 'card_reload' && tx.cardId) {
      const cardDoc = await adminDb.collection('cards').doc(tx.cardId as string).get();
      const card = cardDoc.data();
      const userDoc = await adminDb.collection('users').doc(tx.userId as string).get();
      const user = userDoc.data();
      if (user?.email && card?.last4) {
        await sendReloadFailedEmail({
          email: user.email as string,
          name: (user.displayName as string) || 'Client',
          amountXOF: tx.amount as number,
          last4: card.last4 as string,
          date: new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }),
        });
      }
    }

    return OK();
  }

  try {
    if (tx.type === 'card_purchase') await handlePurchase(txDoc, tx, meta);
    else if (tx.type === 'card_reload') await handleReload(txDoc, tx);
    else if (tx.type === 'giftcard_purchase') await handleGiftcardPurchase(txDoc, tx);
  } catch (err) {
    await txDoc.ref.update({
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Unknown',
      completedAt: new Date().toISOString(),
    });
  }
  return OK();
}

async function handlePurchase(
  txDoc: FirebaseFirestore.DocumentSnapshot,
  tx: FirebaseFirestore.DocumentData,
  meta?: Record<string, string>,
) {
  const userDoc = await adminDb.collection('users').doc(tx.userId).get();
  if (!userDoc.exists) throw new Error('User not found');
  const user = userDoc.data()!;

  const parts = ((user.displayName as string) || 'User Name').trim().split(/\s+/);
  const firstname = parts[0] || 'User';
  const lastname = parts.slice(1).join(' ') || 'Account';

  const brand: CardBrand = (tx.brand as CardBrand) || (meta?.brand as CardBrand) || 'visa';
  const apiFamily: 'classic' | '4xxbins' = tx.apiFamily === '4xxbins' ? '4xxbins' : 'classic';

  let pagocardsCardId: string;
  let last4 = '****';
  let expiryMonth = '12';
  let expiryYear = String(new Date().getFullYear() + 3).slice(-2);
  let balance = 0;
  let currency = brand === 'visa' ? 'USD' : 'EUR';

  if (apiFamily === '4xxbins') {
    // Nouvelle gamme 4XXBINs (493BIN/536BIN) : une seule requête renvoie déjà tous les
    // détails de la carte (numéro, solde, devise) — pas besoin d'un second appel getcard.
    const productCode = ((tx.productCode as Product4xx) || (brand === 'mastercard' ? '536_master' : 'us_493_visa_bin'));
    const initialLoadUSD = tx.initialLoad ? truncate2((tx.initialLoad as number) / 600) : undefined;
    const res = await createCard4xx({ product_code: productCode, first_name: firstname, last_name: lastname, email: user.email as string, initial_load: initialLoadUSD });
    const d = res.data;
    pagocardsCardId = d.card_id;
    last4 = d.last_four || last4;
    expiryMonth = d.expiry_month ? d.expiry_month.padStart(2, '0') : expiryMonth;
    expiryYear = (d.expiry_year || expiryYear).slice(-2);
    currency = d.currency || currency;
    balance = d.balance?.display_amount ?? 0;
  } else {
    const pagoRes = await createCard({ brand, firstname, lastname, email: user.email as string });
    if (!pagoRes.success) throw new Error(pagoRes.message || 'Card creation failed');
    pagocardsCardId = pagoRes.cardid;

    // La réponse de création (doc Pagocards) ne renvoie que cardid/useremail/nameoncard.
    // On complète avec getcard pour le solde/devise/statut.
    try {
      const details = await getCard({ brand, cardid: pagoRes.cardid, email: user.email as string });
      balance = details.balance ?? 0;
      currency = details.currency || currency;
    } catch { /* détails non bloquants pour la création */ }

    // getcardsensitive ne renvoie PAS le vrai numéro côté serveur : sa réponse documentée
    // a cardnumber/cvc vides, le numéro n'étant affichable que côté client via l'URL d'embed
    // signée qu'elle fournit. Pour les 4 derniers chiffres, on utilise plutôt getallcards
    // (lastfour), qui les renvoie directement pour Visa comme pour Mastercard.
    // L'expiry réelle n'est disponible nulle part côté serveur pour l'EURO-MASTER/Visacard —
    // expiryMonth/expiryYear restent une estimation par défaut tant que l'embed n'est pas intégré.
    try {
      const list = await getAllCards({ brand, email: user.email as string });
      const match = list.cards.find(c => c.cardid === pagoRes.cardid);
      if (match?.lastfour) last4 = match.lastfour.slice(-4);
    } catch { /* non bloquant */ }
  }

  const cardRef = await adminDb.collection('cards').add({
    userId: tx.userId,
    pagocardsCardId,
    last4,
    brand,
    apiFamily,
    ...(apiFamily === '4xxbins' ? { productCode: tx.productCode } : {}),
    expiryMonth,
    expiryYear,
    cardholderName: `${firstname} ${lastname}`.toUpperCase(),
    email: user.email,
    currency,
    balance,
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await txDoc.ref.update({
    status: 'success',
    cardId: cardRef.id,
    pagocardsCardId,
    completedAt: new Date().toISOString(),
  });

  // Frais mobile money de 5% sur l'achat de carte → revenu plateforme
  const cardFee = (tx.cardFee as number | undefined) ?? tx.fee;
  if (cardFee) {
    await adminDb.collection('platform_revenue').add({
      type: 'purchase_fee',
      userId: tx.userId,
      cardId: cardRef.id,
      amountXOF: tx.amount,
      totalXOF: tx.total,
      feeXOF: cardFee,
      rate: 0.05,
      brand,
      apiFamily,
      createdAt: new Date().toISOString(),
    });
  }

  // Rechargement optionnel demandé au moment de l'achat.
  // 4xxbins : déjà inclus dans l'appel de création ci-dessus (initial_load) — on ne fait
  // que loguer le revenu. classic : nécessite un second appel fundCard séparé.
  if (tx.initialLoad) {
    const loadFeeXOF = (tx.loadFee as number | undefined) ?? 0;
    if (apiFamily === '4xxbins') {
      await adminDb.collection('platform_revenue').add({
        type: 'reload_fee',
        userId: tx.userId,
        cardId: cardRef.id,
        amountXOF: tx.initialLoad,
        feeXOF: loadFeeXOF,
        rate: 0.05,
        createdAt: new Date().toISOString(),
      });
    } else {
      try {
        const loadAmountUSD = truncate2((tx.initialLoad as number) / 600);
        const fundRes = await fundCard({ brand, cardid: pagocardsCardId, email: user.email as string, amount: loadAmountUSD });
        if (fundRes.success) {
          // La doc Pagocards ne renvoie jamais le solde dans la réponse de fundcard, et pour
          // l'EURO-MASTER le montant réellement crédité sur la carte (en EUR) diffère du
          // montant USDC envoyé (conversion FX + frais) — on relit donc le solde exact.
          try {
            const fresh = await getCard({ brand, cardid: pagocardsCardId, email: user.email as string });
            await cardRef.update({ balance: fresh.balance ?? loadAmountUSD });
          } catch {
            await cardRef.update({ balance: loadAmountUSD });
          }
          await adminDb.collection('platform_revenue').add({
            type: 'reload_fee',
            userId: tx.userId,
            cardId: cardRef.id,
            amountXOF: tx.initialLoad,
            feeXOF: loadFeeXOF,
            rate: 0.05,
            createdAt: new Date().toISOString(),
          });
        }
      } catch { /* la carte reste créée même si le rechargement initial échoue — rechargeable ensuite depuis le dashboard */ }
    }
  }

  await adminDb.collection('notifications').add({
    userId: tx.userId, cardId: cardRef.id, type: 'card_created',
    title: 'Votre carte est prête ! 🎉',
    message: `Votre carte virtuelle ${brand === 'visa' ? 'Visa' : 'Mastercard'} *${last4} a été créée avec succès.`,
    read: false, createdAt: new Date().toISOString(),
  });
  await sendPushToUser(tx.userId, {
    title: 'Votre carte est prête ! 🎉',
    body: `Votre carte virtuelle ${brand === 'visa' ? 'Visa' : 'Mastercard'} *${last4} a été créée avec succès.`,
    data: { url: '/dashboard' },
  });

  await adminDb.collection('logs').add({
    type: 'card_created', userId: tx.userId, cardId: cardRef.id, brand,
    createdAt: new Date().toISOString(),
  });
}

async function handleReload(
  txDoc: FirebaseFirestore.DocumentSnapshot,
  tx: FirebaseFirestore.DocumentData,
) {
  const cardDoc = await adminDb.collection('cards').doc(tx.cardId as string).get();
  if (!cardDoc.exists) throw new Error('Card not found');
  const card = cardDoc.data()!;

  // tx.amount = montant carte uniquement (sans les frais)
  // tx.fee    = frais plateforme (jamais envoyés à Pagocards)
  // tx.total  = ce que le client a payé (amount + fee)
  const amountUSD = truncate2(tx.amount / 600);
  if (amountUSD < 1) throw new Error('Amount too small');

  const brand: CardBrand = (card.brand as CardBrand) || 'visa';

  // On envoie UNIQUEMENT tx.amount à Pagocards, jamais tx.fee ni tx.total
  if (card.apiFamily === '4xxbins') {
    const res = await fundCard4xx(card.pagocardsCardId as string, amountUSD);
    await cardDoc.ref.update({ balance: res.data.display_amount ?? FieldValue.increment(amountUSD) });
  } else {
    const pagoRes = await fundCard({
      brand,
      cardid: card.pagocardsCardId as string,
      email: card.email as string,
      amount: amountUSD,
    });
    if (!pagoRes.success) throw new Error(pagoRes.message || 'Fund failed');

    // La doc Pagocards ne renvoie jamais le solde dans la réponse de fundcard. Pour
    // l'EURO-MASTER en particulier, le montant réellement crédité (en EUR) diffère du
    // montant USDC envoyé (conversion FX + frais) — on relit donc le solde exact plutôt
    // que de deviner en incrémentant localement.
    try {
      const fresh = await getCard({ brand, cardid: card.pagocardsCardId as string, email: card.email as string });
      await cardDoc.ref.update({ balance: fresh.balance ?? FieldValue.increment(amountUSD) });
    } catch {
      await cardDoc.ref.update({ balance: FieldValue.increment(amountUSD) });
    }
  }

  const feeXOF = (tx.fee as number) ?? 0;
  const feeUSD = truncate2(feeXOF / 600);

  await txDoc.ref.update({
    status: 'success',
    amountUSD,
    feeXOF,
    feeUSD,
    completedAt: new Date().toISOString(),
  });

  // Log revenu plateforme
  await adminDb.collection('platform_revenue').add({
    type: 'reload_fee',
    userId: tx.userId,
    cardId: tx.cardId,
    amountXOF: tx.amount,
    totalXOF: tx.total,
    feeXOF,
    feeUSD,
    rate: 0.05,
    createdAt: new Date().toISOString(),
  });

  // Commission de parrainage (idempotente — une seule fois par transaction de rechargement)
  await creditReferralCommission(tx.userId as string, txDoc.id);

  // Notif in-app
  const reloadTitle = 'Carte rechargée avec succès ✅';
  const reloadMessage = `${tx.amount.toLocaleString()} FCFA (~$${amountUSD}) ont été ajoutés à votre carte *${card.last4}.`;
  await adminDb.collection('notifications').add({
    userId: tx.userId, cardId: tx.cardId, type: 'card_reloaded',
    title: reloadTitle,
    message: reloadMessage,
    read: false, createdAt: new Date().toISOString(),
  });
  await sendPushToUser(tx.userId, { title: reloadTitle, body: reloadMessage, data: { url: '/dashboard' } });

  // Email succès rechargement
  const userDoc = await adminDb.collection('users').doc(tx.userId as string).get();
  const user = userDoc.data();
  if (user?.email) {
    await sendReloadSuccessEmail({
      email: user.email as string,
      name: (user.displayName as string) || 'Client',
      amountXOF: tx.amount as number,
      amountUSD,
      last4: card.last4 as string,
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }),
    });
  }

  await adminDb.collection('logs').add({
    type: 'card_reloaded',
    userId: tx.userId,
    cardId: tx.cardId,
    amountXOF: tx.amount,
    amountUSD,
    feeXOF,
    feeUSD,
    totalXOF: tx.total,
    createdAt: new Date().toISOString(),
  });
}

async function handleGiftcardPurchase(
  txDoc: FirebaseFirestore.DocumentSnapshot,
  tx: FirebaseFirestore.DocumentData,
) {
  const sku = tx.sku as string;
  const quantity = tx.quantity as number;
  const amountUSD = tx.amountUSD as number;
  const totalUSD = tx.totalUSD as number;
  const title = tx.title as string;

  const order = await purchaseGiftcard({ sku, quantity, amount: amountUSD });

  const orderRef = await adminDb.collection('giftcard_orders').add({
    userId: tx.userId,
    transactionId: txDoc.id,
    sku,
    title,
    quantity,
    amountUSD,
    totalUSD,
    amountXOF: tx.amount,
    status: 'success',
    referenceCode: order.referencecode,
    shareLink: order.shareLink || null,
    createdAt: new Date().toISOString(),
  });

  await txDoc.ref.update({
    status: 'success',
    giftcardOrderId: orderRef.id,
    completedAt: new Date().toISOString(),
  });

  // Frais mobile money de 5% → revenu plateforme
  if (tx.fee) {
    await adminDb.collection('platform_revenue').add({
      type: 'giftcard_fee',
      userId: tx.userId,
      giftcardOrderId: orderRef.id,
      amountXOF: tx.amount,
      totalXOF: tx.total,
      feeXOF: tx.fee,
      rate: 0.05,
      createdAt: new Date().toISOString(),
    });
  }

  const title2 = 'Carte cadeau prête ! 🎁';
  const message = order.shareLink
    ? `Votre carte cadeau ${title} x${quantity} est prête. Consultez "Mes cartes cadeaux" pour récupérer le code.`
    : `Votre carte cadeau ${title} x${quantity} a été commandée avec succès.`;
  await adminDb.collection('notifications').add({
    userId: tx.userId, type: 'giftcard_ready',
    title: title2, message, read: false, createdAt: new Date().toISOString(),
  });
  await sendPushToUser(tx.userId, { title: title2, body: message, data: { url: '/giftcards' } });

  await adminDb.collection('logs').add({
    type: 'giftcard_purchased', userId: tx.userId, giftcardOrderId: orderRef.id, sku, quantity,
    createdAt: new Date().toISOString(),
  });
}