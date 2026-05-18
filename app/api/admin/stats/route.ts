import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [users, cards, txSuccess] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('cards').get(),
      adminDb.collection('transactions').where('status', '==', 'success').get(),
    ]);
    const recentSnap = await adminDb.collection('transactions').orderBy('createdAt', 'desc').limit(20).get();
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.size,
        totalCards: cards.size,
        activeCards: cards.docs.filter(d => d.data().status === 'active').length,
        totalTransactions: txSuccess.size,
        totalRevenue: txSuccess.docs.reduce((s, d) => s + (d.data().amount || 0), 0),
        recentTransactions: recentSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
