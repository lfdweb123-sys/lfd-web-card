import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const snap = await adminDb.collection('referrers').orderBy('createdAt', 'desc').limit(page * PAGE_SIZE + 1).get();
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

const CreateSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8),
  promoCode: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/i, 'Lettres, chiffres, tirets uniquement'),
  commissionPerReload: z.number().min(1).max(10000).default(25),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { name, email, password, promoCode, commissionPerReload } = parsed.data;
    const code = promoCode.toUpperCase();

    const existing = await adminDb.collection('referrers').where('promoCode', '==', code).limit(1).get();
    if (!existing.empty)
      return NextResponse.json({ success: false, error: 'Ce code parrain est déjà utilisé.' }, { status: 400 });

    const userRecord = await adminAuth.createUser({ email, password, displayName: name });
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'referrer' });

    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid, email, displayName: name,
      role: 'referrer', country: '', status: 'active',
      createdAt: new Date().toISOString(),
    });

    await adminDb.collection('referrers').doc(userRecord.uid).set({
      name, email, promoCode: code, commissionPerReload,
      totalReferred: 0, totalEarningsXOF: 0, unpaidXOF: 0, active: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: { id: userRecord.uid } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    if (msg.includes('email-already-exists') || msg.includes('EMAIL_EXISTS'))
      return NextResponse.json({ success: false, error: 'Cet email est déjà utilisé.' }, { status: 400 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(60).optional(),
  commissionPerReload: z.number().min(1).max(10000).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { id, ...updates } = parsed.data;
    const ref = adminDb.collection('referrers').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ success: false, error: 'Parrain introuvable.' }, { status: 404 });

    await ref.update(updates);
    if (updates.name) await adminAuth.updateUser(id, { displayName: updates.name }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

const DeleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const parsed = DeleteSchema.safeParse({ id: searchParams.get('id') });
    if (!parsed.success)
      return NextResponse.json({ success: false, error: 'ID manquant.' }, { status: 400 });

    // On désactive plutôt que supprimer réellement : l'historique des gains reste
    // intact et rien n'est perdu, conformément à la demande de ne rien supprimer.
    await adminDb.collection('referrers').doc(parsed.data.id).update({ active: false });
    await adminAuth.updateUser(parsed.data.id, { disabled: true }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
