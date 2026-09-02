import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { getFeexPayoutStatus } from '@/lib/feexpay';
import { sendPushToUser } from '@/lib/push';
import { z } from 'zod';

const Schema = z.object({ transactionId: z.string().min(1) });

// Revérifie un retrait dont le payout automatique FeexPay n'a pas pu être confirmé au
// moment du retrait (statut resté PENDING après les tentatives). Ne JAMAIS considérer un
// tel retrait comme "à payer manuellement" sans repasser par ici : FeexPay peut très bien
// avoir fini par confirmer le virement entre-temps, et un envoi manuel doublerait le paiement.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const txRef = adminDb.collection('transactions').doc(parsed.data.transactionId);
    const txDoc = await txRef.get();
    if (!txDoc.exists || txDoc.data()!.type !== 'card_withdrawal')
      return NextResponse.json({ success: false, error: 'Retrait introuvable.' }, { status: 404 });
    const tx = txDoc.data()!;
    if (!tx.feexpayReference)
      return NextResponse.json({ success: false, error: "Ce retrait n'a jamais été envoyé à FeexPay." }, { status: 400 });

    const status = await getFeexPayoutStatus(tx.feexpayReference as string);

    if (status.status === 'SUCCESSFUL') {
      await txRef.update({
        status: 'completed', payoutAutoResult: 'sent', completedAt: new Date().toISOString(), verifiedBy: admin.uid,
      });
      const title = 'Retrait reçu ✅';
      const message = `${(tx.amount as number).toLocaleString()} FCFA ont été envoyés automatiquement sur votre Mobile Money.`;
      await adminDb.collection('notifications').add({
        userId: tx.userId, cardId: tx.cardId, type: 'withdrawal_completed',
        title, message, read: false, createdAt: new Date().toISOString(),
      });
      await sendPushToUser(tx.userId as string, { title, body: message, data: { url: '/dashboard' } });
    } else if (status.status === 'FAILED') {
      await txRef.update({ payoutAutoResult: 'failed_fallback', payoutNote: status.reason || status.responsemsg });
    }

    return NextResponse.json({ success: true, data: { status: status.status, reason: status.reason } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
