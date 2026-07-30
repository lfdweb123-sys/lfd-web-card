import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(100).get();
    return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { userId, action } = await req.json();
    if (!userId || !action)
      return NextResponse.json({ success: false, error: 'userId et action requis' }, { status: 400 });

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
    } else if (action === 'require_kyc') {
      await adminDb.collection('users').doc(userId).update({ kycRequired: true });
      const title = 'Vérification d\'identité requise';
      const message = "Pour la sécurité de votre compte, une vérification d'identité est maintenant nécessaire pour continuer à utiliser votre carte.";
      await adminDb.collection('notifications').add({
        userId, type: 'kyc_required', title, message, read: false, createdAt: new Date().toISOString(),
      });
      await sendPushToUser(userId, { title, body: message, data: { url: '/kyc' } });
    } else if (action === 'unrequire_kyc') {
      await adminDb.collection('users').doc(userId).update({ kycRequired: false });
    }

    await adminDb.collection('logs').add({ type: 'admin_action', action, targetUserId: userId, adminId: admin.uid, createdAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
