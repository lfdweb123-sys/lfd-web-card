// app/api/admin/kyc/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { sendPushToUser } from '@/lib/push';
import { z } from 'zod';

// GET - liste toutes les vérifications KYC
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const PAGE_SIZE = 15;

    const snap = await adminDb.collection('kyc')
      .where('status', '==', status)
      .orderBy('updatedAt', 'desc')
      .limit(page * PAGE_SIZE + 1)
      .get();

    // Ne jamais retourner les images au listing
    const all = snap.docs.map(d => {
      const { images: _images, ...safe } = d.data();
      void _images;
      return { id: d.id, ...safe };
    });
    const hasMore = all.length > page * PAGE_SIZE;
    const list = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return NextResponse.json({ success: true, data: list, page, hasMore });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

const ActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

// PATCH - approuver ou rejeter
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId, action, reason } = parsed.data;

    if (action === 'reject' && !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'La raison du refus est obligatoire.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await adminDb.collection('kyc').doc(userId).update({
      status: newStatus,
      rejectionReason: action === 'reject' ? reason : null,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Si approuvé, mettre à jour le profil utilisateur
    if (action === 'approve') {
      await adminDb.collection('users').doc(userId).update({
        kycStatus: 'approved',
        kycApprovedAt: new Date().toISOString(),
      });
    } else {
      await adminDb.collection('users').doc(userId).update({
        kycStatus: 'rejected',
      });
    }

    // Notification pour l'utilisateur
    const kycTitle = action === 'approve' ? '✅ Identité vérifiée' : '❌ Vérification refusée';
    const kycMessage = action === 'approve'
      ? 'Votre identité a été vérifiée avec succès. Vous pouvez maintenant obtenir votre carte.'
      : `Votre vérification a été refusée. Raison : ${reason}`;
    await adminDb.collection('notifications').add({
      userId,
      type: action === 'approve' ? 'kyc_approved' : 'kyc_rejected',
      title: kycTitle,
      message: kycMessage,
      read: false,
      createdAt: new Date().toISOString(),
    });
    await sendPushToUser(userId, { title: kycTitle, body: kycMessage, data: { url: action === 'approve' ? '/dashboard' : '/kyc' } });

    // Log admin
    await adminDb.collection('logs').add({
      type: `kyc_${action}d`,
      targetUserId: userId,
      reason: reason || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// GET images d'un dossier (admin seulement)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'userId requis' }, { status: 400 });

    const doc = await adminDb.collection('kyc').doc(userId).get();
    if (!doc.exists) return NextResponse.json({ success: false, error: 'Dossier introuvable' }, { status: 404 });

    const data = doc.data()!;
    return NextResponse.json({ success: true, data: { images: data.images || null, method: data.method } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}