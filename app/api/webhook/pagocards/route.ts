import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push';

const OK = () => NextResponse.json({ received: true });

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return OK(); }

  const { eventName, cardId } = payload as { eventName?: string; cardId?: string };

  const cardSnap = cardId
    ? await adminDb.collection('cards').where('pagocardsCardId', '==', cardId).limit(1).get()
    : null;
  const cardDoc = cardSnap && !cardSnap.empty ? cardSnap.docs[0] : null;
  const card = cardDoc?.data();

  if (eventName === 'cardTokenization.deliverActivationCode') {
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

  } else if (eventName === 'cardAuthentication.created') {
    const p = payload as Record<string, string>;
    const securityMessage = `${p.merchantName} demande ${p.merchantAmount} ${p.merchantCurrency} — Validez depuis votre espace.`;
    await adminDb.collection('notifications').add({
      userId: card?.userId || null,
      cardId: cardDoc?.id || null,
      pagocardsCardId: cardId,
      type: '3ds_required',
      title: 'Validation 3DS requise',
      message: securityMessage,
      merchantName: p.merchantName,
      merchantAmount: p.merchantAmount,
      merchantCurrency: p.merchantCurrency,
      maskedPan: p.maskedPan,
      eventId: p.eventId,
      eventTargetId: p.eventTargetId,
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
  }

  await adminDb.collection('logs').add({
    type: 'pagocards_webhook',
    eventName,
    cardId,
    createdAt: new Date().toISOString(),
  });

  return OK();
}