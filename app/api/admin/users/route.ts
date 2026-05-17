// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// GET - Liste des utilisateurs
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

    const snap = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(limit).get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, data: users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH - Suspendre / Réactiver / Changer rôle
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'userId et action requis' }, { status: 400 });
    }

    if (action === 'suspend') {
      await adminDb.collection('users').doc(userId).update({ status: 'suspended' });
      await adminAuth.updateUser(userId, { disabled: true });
    } else if (action === 'activate') {
      await adminDb.collection('users').doc(userId).update({ status: 'active' });
      await adminAuth.updateUser(userId, { disabled: false });
    } else if (action === 'make_admin') {
      await adminDb.collection('users').doc(userId).update({ role: 'admin' });
      await adminAuth.setCustomUserClaims(userId, { role: 'admin' });
    } else if (action === 'make_user') {
      await adminDb.collection('users').doc(userId).update({ role: 'user' });
      await adminAuth.setCustomUserClaims(userId, { role: 'user' });
    }

    await adminDb.collection('logs').add({
      type: 'admin_action',
      action,
      targetUserId: userId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
