// app/api/cards/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const [cardsSnap, txSnap] = await Promise.all([
      adminDb.collection('cards').where('userId', '==', user.uid).get(),
      adminDb.collection('transactions')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get(),
    ]);

    const cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, data: { cards, transactions } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
