// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [usersSnap, cardsSnap, txSnap] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('cards').get(),
      adminDb.collection('transactions').where('status', '==', 'success').get(),
    ]);

    const totalRevenue = txSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
    const activeCards = cardsSnap.docs.filter(d => d.data().status === 'active').length;

    // Dernières transactions
    const recentTxSnap = await adminDb.collection('transactions')
      .orderBy('createdAt', 'desc').limit(10).get();
    const recentTransactions = recentTxSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: usersSnap.size,
        totalCards: cardsSnap.size,
        activeCards,
        totalTransactions: txSnap.size,
        totalRevenue,
        recentTransactions,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
