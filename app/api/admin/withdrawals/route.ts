import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push';
import { z } from 'zod';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const status = searchParams.get('status') || 'pending_payout';

    const snap = await adminDb.collection('transactions')
      .where('type', '==', 'card_withdrawal')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(page * PAGE_SIZE + 1)
      .get();

    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const hasMore = all.length > page * PAGE_SIZE;
    const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return NextResponse.json({ success: true, data: { items, page, hasMore } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

const PatchSchema = z.object({
  transactionId: z.string().min(1),
  payoutReference: z.string().max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { transactionId, payoutReference } = parsed.data;
    const txRef = adminDb.collection('transactions').doc(transactionId);
    const txDoc = await txRef.get();
    if (!txDoc.exists || txDoc.data()!.type !== 'card_withdrawal')
      return NextResponse.json({ success: false, error: 'Retrait introuvable.' }, { status: 404 });

    const tx = txDoc.data()!;
    await txRef.update({
      status: 'completed',
      paidAt: new Date().toISOString(),
      paidBy: admin.uid,
      payoutReference: payoutReference || null,
    });

    const title = 'Retrait envoyé ✅';
    const message = `Votre retrait de $${tx.amountUSD} (~${tx.amount?.toLocaleString()} FCFA) a été envoyé par Mobile Money.`;
    await adminDb.collection('notifications').add({
      userId: tx.userId, cardId: tx.cardId, type: 'withdrawal_completed',
      title, message, read: false, createdAt: new Date().toISOString(),
    });
    await sendPushToUser(tx.userId, { title, body: message, data: { url: '/dashboard' } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
