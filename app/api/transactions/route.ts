import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const type = searchParams.get('type') || 'all'; // all | card_purchase | card_reload
    const status = searchParams.get('status') || 'all'; // all | success | pending | failed

    let query = adminDb.collection('transactions').where('userId', '==', user.uid) as FirebaseFirestore.Query;
    if (type !== 'all') query = query.where('type', '==', type);
    if (status !== 'all') query = query.where('status', '==', status);
    query = query.orderBy('createdAt', 'desc');

    // On charge une page de plus que nécessaire pour savoir s'il y a une suite,
    // sans avoir à faire de requête d'agrégation séparée (moins coûteux).
    const snap = await query.limit(page * PAGE_SIZE + 1).get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const hasMore = all.length > page * PAGE_SIZE;
    const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = hasMore ? page + 1 : page;

    return NextResponse.json({ success: true, data: { items, page, totalPages, hasMore } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
