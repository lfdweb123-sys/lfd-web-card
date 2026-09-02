// app/api/webhook/verzapay/route.ts
// Webhook VerzaPay — événements payout.completed / payout.failed uniquement (le
// décaissement est le seul usage de VerzaPay sur cette plateforme, voir lib/verzapay.ts).
// URL à configurer dans l'espace Développeur VerzaPay : https://card.lfdweb.com/api/webhook/verzapay
//
// ⚠️ La doc VerzaPay ne documente aucune signature de webhook ni endpoint de consultation
// de statut — impossible de revérifier un événement de façon indépendante comme on le fait
// pour le paiement principal (verifyPayment). On limite le risque en ne matchant JAMAIS par
// montant ou heuristique : uniquement par verzapayPayoutId, un identifiant que seul VerzaPay
// nous a fourni au moment du décaissement et qu'un attaquant ne peut pas deviner. Au pire, un
// événement forgé retarderait un paiement déjà en file manuelle (aucune perte de fonds
// possible : l'argent n'est jamais crédité par ce webhook, seulement marqué comme envoyé).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push';

const OK = () => NextResponse.json({ received: true });

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return OK(); }

  const type = body.type as string | undefined;
  if (type !== 'payout.completed' && type !== 'payout.failed') return OK();

  const data = body.data as Record<string, unknown> | undefined;
  const payoutId = (data?.id || body.id || data?.payout_id || body.payout_id
    || (body.payout as Record<string, unknown> | undefined)?.id) as string | undefined;
  if (!payoutId) return OK();

  const snap = await adminDb.collection('transactions')
    .where('verzapayPayoutId', '==', payoutId)
    .limit(1).get();
  if (snap.empty) return OK();

  const txDoc = snap.docs[0];
  const tx = txDoc.data();
  if (tx.status === 'completed') return OK();

  if (type === 'payout.completed') {
    await txDoc.ref.update({
      status: 'completed', payoutAutoResult: 'sent', completedAt: new Date().toISOString(),
    });
    const title = 'Retrait reçu ✅';
    const message = `${(tx.amount as number)?.toLocaleString()} FCFA ont été envoyés automatiquement sur votre Mobile Money.`;
    await adminDb.collection('notifications').add({
      userId: tx.userId, cardId: tx.cardId, type: 'withdrawal_completed',
      title, message, read: false, createdAt: new Date().toISOString(),
    });
    await sendPushToUser(tx.userId as string, { title, body: message, data: { url: '/dashboard' } });
  } else {
    // payout.failed : reste en pending_payout pour traitement manuel côté admin.
    await txDoc.ref.update({ payoutAutoResult: 'failed_fallback', payoutNote: 'Décaissement VerzaPay échoué.' });
  }

  return OK();
}
