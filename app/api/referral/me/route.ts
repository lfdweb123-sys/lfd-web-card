import { NextRequest, NextResponse } from 'next/server';
import { requireReferrer } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    const user = await requireReferrer(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const referrerDoc = await adminDb.collection('referrers').doc(user.uid).get();
    if (!referrerDoc.exists)
      return NextResponse.json({ success: false, error: 'Compte parrain introuvable.' }, { status: 404 });

    const earningsSnap = await adminDb.collection('referral_earnings')
      .where('referrerId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(page * PAGE_SIZE + 1)
      .get();
    const all = earningsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const hasMore = all.length > page * PAGE_SIZE;
    const earnings = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return NextResponse.json({
      success: true,
      data: { referrer: { id: referrerDoc.id, ...referrerDoc.data() }, earnings, page, hasMore },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
