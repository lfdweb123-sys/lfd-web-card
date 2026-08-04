import { NextRequest, NextResponse } from 'next/server';
import { requireReferrer } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { randomUUID } from 'node:crypto';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    const user = await requireReferrer(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const referrerDoc = await adminDb.collection('referrers').doc(user.uid).get();
    if (!referrerDoc.exists)
      return NextResponse.json({ success: false, error: 'Compte parrain introuvable.' }, { status: 404 });

    // Backfill : les comptes parrain créés avant l'introduction du publicId
    // en reçoivent un à la volée, pour que le lien de parrainage affiché
    // dans le dashboard ne soit jamais `?ref=undefined`.
    let referrerData = referrerDoc.data()!;
    if (!referrerData.publicId) {
      const publicId = randomUUID();
      await referrerDoc.ref.update({ publicId });
      referrerData = { ...referrerData, publicId };
    }

    let earnings: unknown[] = [];
    let hasMore = false;
    try {
      const earningsSnap = await adminDb.collection('referral_earnings')
        .where('referrerId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(page * PAGE_SIZE + 1)
        .get();
      const all = earningsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      hasMore = all.length > page * PAGE_SIZE;
      earnings = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    } catch (indexErr) {
      // Index Firestore composite pas encore déployé — on ne bloque pas tout le
      // dashboard parrain pour autant, on renvoie juste un historique vide pour l'instant.
      console.error('referral_earnings query failed (index manquant ?):', indexErr);
    }

    return NextResponse.json({
      success: true,
      data: { referrer: { id: referrerDoc.id, ...referrerData }, earnings, page, hasMore },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
