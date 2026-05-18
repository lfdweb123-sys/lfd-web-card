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
        .limit(30).get(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cards: cardsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        transactions: txSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
