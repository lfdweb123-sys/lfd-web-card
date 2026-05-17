// app/api/webhook/pagocards/route.ts
// ================================================================
// WEBHOOK PAGOCARDS
// URL à configurer dans votre dashboard Pagocards :
//   https://votre-domaine.vercel.app/api/webhook/pagocards
//
// Pagocards envoie deux types d'événements :
//
//  1. cardTokenization.deliverActivationCode
//     → Google Pay / Apple Pay : envoyer le code OTP à l'utilisateur
//
//  2. cardAuthentication.created
//     → 3DS : notifier l'utilisateur d'une transaction 3DS en attente
//
// ================================================================

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const OK = () => NextResponse.json({ received: true }, { status: 200 });

// ── Types des payloads Pagocards (selon leur doc officielle) ──────

interface PagoWalletWebhook {
  cardId: string;
  userId: string;
  eventId: string;
  eventName: 'cardTokenization.deliverActivationCode';
  emailAddress: string;
  eventTargetId: string;
  activationCode: string;
  activationMethod: string;       // "email"
  digitalWalletName: string;      // "googlePay" | "applePay"
  consumerFacingEntityName: string; // "GOOGLE" | "APPLE"
}

interface Pago3DSWebhook {
  cardId: string;
  userId: string;
  eventId: string;
  walletId: string;
  eventName: 'cardAuthentication.created';
  maskedPan: string;              // ex: "533867******8498"
  merchantName: string;           // ex: "apple.com/bill"
  eventTargetId: string;          // l'ID 3DS à approuver
  walletAddress?: string;
  merchantAmount: string;         // ex: "3.99"
  merchantCurrency: string;       // ex: "EUR"
}

type PagoWebhookPayload = PagoWalletWebhook | Pago3DSWebhook;

export async function POST(req: NextRequest) {
  let payload: PagoWebhookPayload;

  try {
    payload = await req.json();
  } catch {
    return OK();
  }

  const { eventName, cardId } = payload;

  // Retrouver la carte en Firestore via pagocardsCardId
  const cardSnap = await adminDb
    .collection('cards')
    .where('pagocardsCardId', '==', cardId)
    .limit(1)
    .get();

  const cardDoc = cardSnap.empty ? null : cardSnap.docs[0];
  const card = cardDoc?.data();

  switch (eventName) {

    // ── Cas 1 : Google Pay / Apple Pay ─────────────────────────
    case 'cardTokenization.deliverActivationCode': {
      const p = payload as PagoWalletWebhook;

      // Stocker la notification dans Firestore pour affichage dans le dashboard
      await adminDb.collection('notifications').add({
        userId: card?.userId || null,
        cardId: cardDoc?.id || null,
        pagocardsCardId: cardId,
        type: 'wallet_activation',
        title: `Code ${p.digitalWalletName === 'googlePay' ? 'Google Pay' : 'Apple Pay'}`,
        message: `Votre code d'activation ${p.digitalWalletName === 'googlePay' ? 'Google Pay' : 'Apple Pay'} est : ${p.activationCode}`,
        activationCode: p.activationCode,
        digitalWalletName: p.digitalWalletName,
        eventId: p.eventId,
        eventTargetId: p.eventTargetId,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Log sécurité
      await logEvent('wallet_tokenization', {
        cardId: cardDoc?.id,
        pagocardsCardId: cardId,
        wallet: p.digitalWalletName,
        userId: card?.userId,
      });

      break;
    }

    // ── Cas 2 : Transaction 3DS en attente ──────────────────────
    case 'cardAuthentication.created': {
      const p = payload as Pago3DSWebhook;

      // Stocker la notification 3DS dans Firestore
      await adminDb.collection('notifications').add({
        userId: card?.userId || null,
        cardId: cardDoc?.id || null,
        pagocardsCardId: cardId,
        type: '3ds_required',
        title: 'Validation 3DS requise',
        message: `${p.merchantName} demande ${p.merchantAmount} ${p.merchantCurrency} — Validez depuis votre tableau de bord.`,
        merchantName: p.merchantName,
        merchantAmount: p.merchantAmount,
        merchantCurrency: p.merchantCurrency,
        maskedPan: p.maskedPan,
        eventId: p.eventId,
        eventTargetId: p.eventTargetId, // ID à passer à approve3DS
        read: false,
        requiresAction: true,
        createdAt: new Date().toISOString(),
      });

      // Mettre à jour le statut de la carte pour indiquer une action requise
      if (cardDoc) {
        await cardDoc.ref.update({ pendingAction: '3ds' });
      }

      // Log sécurité
      await logEvent('3ds_event', {
        cardId: cardDoc?.id,
        pagocardsCardId: cardId,
        merchant: p.merchantName,
        amount: `${p.merchantAmount} ${p.merchantCurrency}`,
        userId: card?.userId,
      });

      break;
    }

    default: {
      // Événement inconnu — stocker pour audit
      await logEvent('pagocards_unknown_event', {
        eventName,
        cardId,
        rawPayload: JSON.stringify(payload).slice(0, 500),
      });
    }
  }

  return OK();
}

async function logEvent(type: string, data: Record<string, unknown>) {
  try {
    await adminDb.collection('logs').add({
      type, ...data, createdAt: new Date().toISOString(),
    });
  } catch { /* silent */ }
}
