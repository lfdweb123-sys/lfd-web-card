import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { createCard, fundCard, getCard, getMastercardSensitive, type CardBrand } from '@/lib/pagocards';
import { sendReloadSuccessEmail, sendReloadFailedEmail } from '@/lib/brevo';
import { sendPushToUser } from '@/lib/push';

const OK = () => NextResponse.json({ received: true });

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

  const pagoRes = await createCard({ brand, firstname, lastname, email: user.email as string });
  if (!pagoRes.success) throw new Error(pagoRes.message || 'Card creation failed');

  // La réponse de création (doc Pagocards) ne renvoie que cardid/useremail/nameoncard.
  // On complète avec getcard (solde/devise/statut) et, pour l'EURO-MASTER, getcardsensitive
  // (numéro/CVC/mois d'expiration via une URL d'embed signée).
  let last4 = '****';
  let expiryMonth = '12';
  let expiryYear = String(new Date().getFullYear() + 3).slice(-2);
  let balance = 0;
  let currency = brand === 'visa' ? 'USD' : 'EUR';

  try {
    const details = await getCard({ brand, cardid: pagoRes.cardid, email: user.email as string });
    balance = details.balance ?? 0;
    currency = details.currency || currency;
  } catch { /* détails non bloquants pour la création */ }

  if (brand === 'mastercard') {
    try {
      const sensitive = await getMastercardSensitive({ cardid: pagoRes.cardid, email: user.email as string });
      if (sensitive.cardnumber) last4 = sensitive.cardnumber.slice(-4);
      if (sensitive.month) expiryMonth = sensitive.month.padStart(2, '0');
    } catch { /* non bloquant, dispo plus tard via /api/getcardsensitive */ }
  }

  const cardRef = await adminDb.collection('cards').add({
    userId: tx.userId,
    pagocardsCardId: pagoRes.cardid,
    last4,
    brand,
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
    pagocardsCardId: pagoRes.cardid,
    completedAt: new Date().toISOString(),
  });

  // Frais mobile money de 5% sur l'achat de carte → revenu plateforme
  if (tx.fee) {
    await adminDb.collection('platform_revenue').add({
      type: 'purchase_fee',
      userId: tx.userId,
      cardId: cardRef.id,
      amountXOF: tx.amount,
      totalXOF: tx.total,
      feeXOF: tx.fee,
      rate: 0.05,
      brand,
      createdAt: new Date().toISOString(),
    });
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
  const amountUSD = parseFloat((tx.amount / 600).toFixed(2));
  if (amountUSD < 1) throw new Error('Amount too small');

  const brand: CardBrand = (card.brand as CardBrand) || 'visa';

  // On envoie UNIQUEMENT tx.amount à Pagocards, jamais tx.fee ni tx.total
  const pagoRes = await fundCard({
    brand,
    cardid: card.pagocardsCardId as string,
    email: card.email as string,
    amount: amountUSD,
  });
  if (!pagoRes.success) throw new Error(pagoRes.message || 'Fund failed');

  // Mise à jour solde carte
  if (pagoRes.balance !== undefined) {
    await cardDoc.ref.update({ balance: pagoRes.balance });
  } else {
    await cardDoc.ref.update({ balance: FieldValue.increment(amountUSD) });
  }

  const feeXOF = (tx.fee as number) ?? 0;
  const feeUSD = parseFloat((feeXOF / 600).toFixed(2));

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
    rate: 0.12,
    createdAt: new Date().toISOString(),
  });

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