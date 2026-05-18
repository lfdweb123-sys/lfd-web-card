import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const snap = await adminDb.collection('notifications')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20).get();
    return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
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
