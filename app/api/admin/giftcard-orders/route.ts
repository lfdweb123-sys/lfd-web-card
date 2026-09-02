import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const status = searchParams.get('status') || 'all';

    let query = adminDb.collection('giftcard_orders') as FirebaseFirestore.Query;
    if (status !== 'all') query = query.where('status', '==', status);
    query = query.orderBy('createdAt', 'desc');

    const snap = await query.limit(page * PAGE_SIZE + 1).get();
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
