import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const snap = await adminDb.collection('giftcard_orders')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return NextResponse.json({
      success: true,
      data: { orders: snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
