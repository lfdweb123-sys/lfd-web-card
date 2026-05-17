// app/api/webhook/payment/route.ts
// ================================================================
// WEBHOOK LFD PAYMENT GATEWAY
// URL à configurer dans votre dashboard LFD :
//   https://votre-domaine.vercel.app/api/webhook/payment
//
// Ce webhook reçoit les confirmations de paiement et :
//  — type=card_purchase  → crée la carte Pagocards automatiquement
//  — type=card_reload    → recharge la carte Pagocards
//
// Flux :
//  LFD Gateway → POST /api/webhook/payment
//     ↓
//  Retrouve la transaction Firestore via metadata.transactionId
//     ↓
//  Appelle Pagocards (createCard ou fundCard)
//     ↓
//  Met à jour Firestore + log
// ================================================================

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { createCard, fundCard, type CardBrand } from '@/lib/pagocards';

// Toujours répondre 200 même en erreur interne (évite les retentatives infinies)
const OK = () => NextResponse.json({ received: true }, { status: 200 });

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return OK(); // Corps invalide → ignorer
  }

  const { event, transaction } = body as {
    event?: string;
    transaction?: Record<string, unknown>;
  };

  // ── 1. Déterminer le statut ──────────────────────────────────
  const rawStatus = (
    (transaction?.status as string) || event || ''
  ).toLowerCase();

  const isSuccess = [
    'successful', 'success', 'completed', 'paid', 'payment.completed',
  ].includes(rawStatus);

  const isFailed = [
    'failed', 'failure', 'cancelled', 'rejected', 'payment.failed',
  ].includes(rawStatus);

  if (!isSuccess && !isFailed) return OK(); // pending ou inconnu → ignorer

  // ── 2. Retrouver la transaction Firestore ───────────────────
  let txDoc: FirebaseFirestore.DocumentSnapshot | null = null;

  // Méthode 1 — metadata.transactionId (fiable, votre ID Firestore)
  const meta = transaction?.metadata as Record<string, string> | undefined;
  const txId = meta?.transactionId;

  if (txId) {
    const doc = await adminDb.collection('transactions').doc(txId).get();
    if (doc.exists) txDoc = doc;
  }

  // Méthode 2 — pid stocké lors du generate-link
  if (!txDoc) {
    const ref = (transaction?.reference as string) || (transaction?.id as string);
    if (ref) {
      const snap = await adminDb
        .collection('transactions')
        .where('pid', '==', ref)
        .limit(1)
        .get();
      if (!snap.empty) txDoc = snap.docs[0];
    }
  }

  // Méthode 3 — dernière transaction pending du même montant
  if (!txDoc && transaction?.amount) {
    const snap = await adminDb
      .collection('transactions')
      .where('status', '==', 'pending')
      .where('amount', '==', transaction.amount as number)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (!snap.empty) txDoc = snap.docs[0];
  }

  if (!txDoc) return OK(); // Transaction introuvable → ignorer

  const tx = txDoc.data()!;

  // ── 3. Anti double-traitement ────────────────────────────────
  if (tx.status === 'success') return OK();

  // ── 4. Paiement échoué ───────────────────────────────────────
  if (isFailed) {
    await txDoc.ref.update({
      status: 'failed',
      completedAt: new Date().toISOString(),
    });
    await logEvent('payment_failed', { userId: tx.userId, amount: tx.amount, txId: txDoc.id });
    return OK();
  }

  // ── 5. Paiement réussi — router selon le type ────────────────
  try {
    if (tx.type === 'card_purchase') {
      await handleCardPurchase(txDoc, tx);
    } else if (tx.type === 'card_reload') {
      await handleCardReload(txDoc, tx);
    }
  } catch (err) {
    // Marquer la transaction en erreur sans bloquer la réponse
    await txDoc.ref.update({
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      completedAt: new Date().toISOString(),
    });
    await logEvent('webhook_error', {
      userId: tx.userId,
      txId: txDoc.id,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }

  return OK();
}

// ================================================================
// Handler : Achat de carte
// Pagocards : POST /api/mastercard/createcard  ou  /api/visacard/createcard
// ================================================================
async function handleCardPurchase(
  txDoc: FirebaseFirestore.DocumentSnapshot,
  tx: FirebaseFirestore.DocumentData,
) {
  // Récupérer le profil utilisateur
  const userDoc = await adminDb.collection('users').doc(tx.userId as string).get();
  if (!userDoc.exists) throw new Error(`User ${tx.userId} not found`);
  const user = userDoc.data()!;

  // Découper le nom
  const parts = ((user.displayName as string) || 'User Name').trim().split(/\s+/);
  const firstname = parts[0] || 'User';
  const lastname = parts.slice(1).join(' ') || 'Account';

  // Choisir la marque de carte (mastercard par défaut)
  // Vous pouvez stocker tx.cardBrand lors du generate-link pour laisser le choix à l'utilisateur
  const brand: CardBrand = (tx.cardBrand as CardBrand) || 'mastercard';

  // ⚠️ Coût Pagocards :
  //   - Mastercard : frais de création (à vérifier dashboard)
  //   - Visa       : $3 d'initial load obligatoire
  // Ces frais sont PRÉLEVÉS sur votre wallet Pagocards, pas sur le client.
  // Assurez-vous d'avoir un solde suffisant dans votre dashboard Pagocards.

  const pagoRes = await createCard({
    brand,
    firstname,
    lastname,
    email: user.email as string,
    initialload: 0, // Pour Mastercard uniquement — Visa impose $3 côté Pagocards
  });

  if (!pagoRes.success) {
    throw new Error(pagoRes.message || 'Pagocards card creation failed');
  }

  // Parser l'expiry "MM/YY" → mois + année
  const [expiryMonth, expiryYear] = (pagoRes.expiry || '12/28').split('/');

  // Enregistrer la carte dans Firestore
  const cardRef = await adminDb.collection('cards').add({
    userId: tx.userId,
    pagocardsCardId: pagoRes.cardid,
    // ⚠️ Ne jamais stocker le numéro complet ni le CVV en clair en production.
    // Ici on stocke uniquement les 4 derniers chiffres pour l'affichage.
    last4: pagoRes.cardnumber?.slice(-4) || '****',
    brand,
    expiryMonth: expiryMonth || '12',
    expiryYear: expiryYear || '28',
    cardholderName: `${firstname} ${lastname}`.toUpperCase(),
    email: user.email,        // Nécessaire pour les appels Pagocards suivants (fund, block...)
    currency: 'USD',
    balance: pagoRes.balance ?? 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  // Marquer la transaction réussie
  await txDoc.ref.update({
    status: 'success',
    cardId: cardRef.id,
    pagocardsCardId: pagoRes.cardid,
    completedAt: new Date().toISOString(),
  });

  await logEvent('card_created', {
    userId: tx.userId,
    cardId: cardRef.id,
    pagocardsCardId: pagoRes.cardid,
    brand,
    amountXOF: tx.amount,
  });
}

// ================================================================
// Handler : Rechargement de carte
// Pagocards : POST /api/mastercard/fundcard  ou  /api/visacard/fundcard
// Frais Pagocards : $1 + 1% du montant USD
// ================================================================
async function handleCardReload(
  txDoc: FirebaseFirestore.DocumentSnapshot,
  tx: FirebaseFirestore.DocumentData,
) {
  const cardDoc = await adminDb.collection('cards').doc(tx.cardId as string).get();
  if (!cardDoc.exists) throw new Error(`Card ${tx.cardId} not found`);
  const card = cardDoc.data()!;

  // Conversion XOF → USD
  // Taux indicatif : 1 USD ≈ 600 XOF
  // ⚠️ En production, utilisez une API de taux temps réel (ex: exchangerate-api.com)
  const XOF_TO_USD = 600;
  const amountUSD = parseFloat((tx.amount / XOF_TO_USD).toFixed(2));

  if (amountUSD < 1) {
    throw new Error(`Amount too small after conversion: $${amountUSD}`);
  }

  const brand: CardBrand = (card.brand as CardBrand) || 'mastercard';

  const pagoRes = await fundCard({
    brand,
    cardid: card.pagocardsCardId as string,
    email: card.email as string,   // email utilisé à la création de la carte
    amount: amountUSD,
  });

  if (!pagoRes.success) {
    throw new Error(pagoRes.message || 'Pagocards fund failed');
  }

  // Mettre à jour le solde dans Firestore
  // Si Pagocards retourne le nouveau solde, on l'utilise directement
  if (pagoRes.balance !== undefined) {
    await cardDoc.ref.update({ balance: pagoRes.balance });
  } else {
    await cardDoc.ref.update({ balance: FieldValue.increment(amountUSD) });
  }

  // Marquer la transaction réussie
  await txDoc.ref.update({
    status: 'success',
    amountUSD,
    pagocardsResponse: pagoRes.message || 'funded',
    completedAt: new Date().toISOString(),
  });

  await logEvent('card_reloaded', {
    userId: tx.userId,
    cardId: tx.cardId,
    pagocardsCardId: card.pagocardsCardId,
    amountXOF: tx.amount,
    amountUSD,
  });
}

// ================================================================
// Logging sécurité
// ================================================================
async function logEvent(type: string, data: Record<string, unknown>) {
  try {
    await adminDb.collection('logs').add({
      type,
      ...data,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Ne pas faire échouer le webhook pour un log raté
  }
}
