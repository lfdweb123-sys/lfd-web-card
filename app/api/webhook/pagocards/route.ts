import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push';

const OK = () => NextResponse.json({ received: true });

// Pagocards utilise 3 formats de webhook différents selon le produit — jamais eventName/cardId :
//   - EURO-MASTER            : { type: "3ds"|"transaction"|"card-state"|..., data: {...} }
//   - 4XXBINs (hors 3DS)     : { event: "virtualcard...", event_id, cardid }
//   - 4XXBINs 3DS            : { eventType: "3ds", cardid, merchantName, transactionAmount, transactionCurrency, ... }
// On accepte les trois pour ne dépendre d'aucune supposition sur le produit d'origine.
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return OK(); }

  const p = payload as Record<string, unknown>;
  const eventName = (p.eventName || p.event) as string | undefined;
  const is3ds = p.type === '3ds' || p.eventType === '3ds';

  // Card id : 4xxbins (cardid top-level) ou EURO-MASTER 3DS (data.card.cardId) ou legacy (cardId)
  const nestedData = p.data as Record<string, unknown> | undefined;
  const nestedCard = nestedData?.card as Record<string, unknown> | undefined;
  const cardId = (p.cardid || p.cardId || nestedCard?.cardId || nestedData?.cardId) as string | undefined;

  const cardSnap = cardId
    ? await adminDb.collection('cards').where('pagocardsCardId', '==', cardId).limit(1).get()
    : null;
  const cardDoc = cardSnap && !cardSnap.empty ? cardSnap.docs[0] : null;
  const card = cardDoc?.data();

  if (is3ds) {
    // 4xxbins shape : merchantName/transactionAmount/transactionCurrency au niveau racine.
    // EURO-MASTER shape : data.merchant.name / data.amount.{amount,currency}, data.status.
    const merchantName = (p.merchantName as string)
      || ((nestedData?.merchant as Record<string, unknown>)?.name as string)
      || 'un marchand';
    const amountData = nestedData?.amount as Record<string, unknown> | undefined;
    const amount = (p.transactionAmount as string) || (amountData?.amount as number)?.toString();
    const currency = (p.transactionCurrency as string) || (amountData?.currency as string) || '';
    const securityMessage = amount
      ? `${merchantName} demande ${amount} ${currency} — Validez depuis votre espace.`
      : `${merchantName} demande une validation 3DS — Validez depuis votre espace.`;

    await adminDb.collection('notifications').add({
      userId: card?.userId || null,
      cardId: cardDoc?.id || null,
      pagocardsCardId: cardId || null,
      type: '3ds_required',
      title: 'Validation 3DS requise',
      message: securityMessage,
      merchantName,
      read: false,
      requiresAction: true,
      createdAt: new Date().toISOString(),
    });
    if (cardDoc) await cardDoc.ref.update({ pendingAction: '3ds' });
    if (card?.userId) {
      await sendPushToUser(card.userId as string, {
        title: '🔐 Alerte sécurité — Validation requise',
        body: securityMessage,
        data: { url: '/dashboard' },
      });
    }
  } else if (eventName === 'cardTokenization.deliverActivationCode') {
    const p = payload as Record<string, string>;
    const walletName = p.digitalWalletName === 'googlePay' ? 'Google Pay' : 'Apple Pay';
    await adminDb.collection('notifications').add({
      userId: card?.userId || null,
      cardId: cardDoc?.id || null,
      pagocardsCardId: cardId,
      type: 'wallet_activation',
      title: `Code ${walletName}`,
      message: `Votre code d'activation : ${p.activationCode}`,
      activationCode: p.activationCode,
      digitalWalletName: p.digitalWalletName,
      eventId: p.eventId,
      eventTargetId: p.eventTargetId,
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (card?.userId) {
      await sendPushToUser(card.userId as string, {
        title: `🔐 Code ${walletName}`,
        body: `Votre code d'activation : ${p.activationCode}`,
        data: { url: '/dashboard' },
      });
    }
  }

  await adminDb.collection('logs').add({
    type: 'pagocards_webhook',
    eventName,
    cardId,
    createdAt: new Date().toISOString(),
  });

  return OK();
}