import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { createCard, fundCard, type CardBrand } from '@/lib/pagocards';

const OK = () => NextResponse.json({ received: true });

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return OK(); }

  const { event, transaction } = body as { event?: string; transaction?: Record<string, unknown> };
  const raw = ((transaction?.status as string) || event || '').toLowerCase();
  const isSuccess = ['successful','success','completed','paid','payment.completed'].includes(raw);
  const isFailed = ['failed','failure','cancelled','rejected','payment.failed'].includes(raw);
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
  if (!txDoc && transaction?.amount) {
    const s = await adminDb.collection('transactions')
      .where('status', '==', 'pending').where('amount', '==', transaction.amount as number)
      .orderBy('createdAt', 'desc').limit(1).get();
    if (!s.empty) txDoc = s.docs[0];
  }
  if (!txDoc) return OK();

  const tx = txDoc.data()!;
  if (tx.status === 'success') return OK();

  if (isFailed) {
    await txDoc.ref.update({ status: 'failed', completedAt: new Date().toISOString() });
    return OK();
  }

  try {
    if (tx.type === 'card_purchase') await handlePurchase(txDoc, tx);
    else if (tx.type === 'card_reload') await handleReload(txDoc, tx);
  } catch (err) {
    await txDoc.ref.update({ status: 'error', errorMessage: err instanceof Error ? err.message : 'Unknown', completedAt: new Date().toISOString() });
  }
  return OK();
}

async function handlePurchase(txDoc: FirebaseFirestore.DocumentSnapshot, tx: FirebaseFirestore.DocumentData) {
  const userDoc = await adminDb.collection('users').doc(tx.userId).get();
  if (!userDoc.exists) throw new Error('User not found');
  const user = userDoc.data()!;

  const parts = ((user.displayName as string) || 'User Name').trim().split(/\s+/);
  const firstname = parts[0] || 'User';
  const lastname = parts.slice(1).join(' ') || 'Account';
  const brand: CardBrand = (tx.cardBrand as CardBrand) || 'mastercard';

  const pagoRes = await createCard({ brand, firstname, lastname, email: user.email as string, initialload: 0 });
  if (!pagoRes.success) throw new Error(pagoRes.message || 'Card creation failed');

  const [expiryMonth, expiryYear] = (pagoRes.expiry || '12/28').split('/');

  const cardRef = await adminDb.collection('cards').add({
    userId: tx.userId,
    pagocardsCardId: pagoRes.cardid,
    last4: pagoRes.cardnumber?.slice(-4) || '****',
    brand, expiryMonth: expiryMonth || '12', expiryYear: expiryYear || '28',
    cardholderName: `${firstname} ${lastname}`.toUpperCase(),
    email: user.email, currency: 'USD',
    balance: pagoRes.balance ?? 0, status: 'active',
    createdAt: new Date().toISOString(),
  });

  await txDoc.ref.update({ status: 'success', cardId: cardRef.id, pagocardsCardId: pagoRes.cardid, completedAt: new Date().toISOString() });

  await adminDb.collection('notifications').add({
    userId: tx.userId, cardId: cardRef.id, type: 'card_created',
    title: 'Votre carte est prête !',
    message: `Votre carte virtuelle ${brand} *${pagoRes.cardnumber?.slice(-4)} a été créée avec succès.`,
    read: false, createdAt: new Date().toISOString(),
  });

  await adminDb.collection('logs').add({ type: 'card_created', userId: tx.userId, cardId: cardRef.id, brand, createdAt: new Date().toISOString() });
}

async function handleReload(txDoc: FirebaseFirestore.DocumentSnapshot, tx: FirebaseFirestore.DocumentData) {
  const cardDoc = await adminDb.collection('cards').doc(tx.cardId as string).get();
  if (!cardDoc.exists) throw new Error('Card not found');
  const card = cardDoc.data()!;

  const amountUSD = parseFloat((tx.amount / 600).toFixed(2));
  if (amountUSD < 1) throw new Error('Amount too small');

  const brand: CardBrand = (card.brand as CardBrand) || 'mastercard';
  const pagoRes = await fundCard({ brand, cardid: card.pagocardsCardId as string, email: card.email as string, amount: amountUSD });
  if (!pagoRes.success) throw new Error(pagoRes.message || 'Fund failed');

  if (pagoRes.balance !== undefined) await cardDoc.ref.update({ balance: pagoRes.balance });
  else await cardDoc.ref.update({ balance: FieldValue.increment(amountUSD) });

  await txDoc.ref.update({ status: 'success', amountUSD, completedAt: new Date().toISOString() });

  await adminDb.collection('notifications').add({
    userId: tx.userId, cardId: tx.cardId, type: 'card_reloaded',
    title: 'Carte rechargée avec succès',
    message: `${tx.amount.toLocaleString()} FCFA (~$${amountUSD}) ont été ajoutés à votre carte *${card.last4}.`,
    read: false, createdAt: new Date().toISOString(),
  });

  await adminDb.collection('logs').add({ type: 'card_reloaded', userId: tx.userId, cardId: tx.cardId, amountXOF: tx.amount, amountUSD, createdAt: new Date().toISOString() });
}
