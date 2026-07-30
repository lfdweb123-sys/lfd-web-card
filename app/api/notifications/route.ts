import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const filter = searchParams.get('filter') || 'all'; // all | unread

    let query = adminDb.collection('notifications').where('userId', '==', user.uid) as FirebaseFirestore.Query;
    if (filter === 'unread') query = query.where('read', '==', false);
    query = query.orderBy('createdAt', 'desc');

    const snap = await query.limit(page * PAGE_SIZE + 1).get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const hasMore = all.length > page * PAGE_SIZE;
    const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return NextResponse.json({ success: true, data: items, page, hasMore });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { notificationId } = await req.json();
    const doc = await adminDb.collection('notifications').doc(notificationId).get();
    if (!doc.exists || doc.data()!.userId !== user.uid)
      return NextResponse.json({ success: false, error: 'Introuvable.' }, { status: 404 });
    await doc.ref.update({ read: true });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
