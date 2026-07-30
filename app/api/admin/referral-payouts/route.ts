import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { sendCustomEmail } from '@/lib/brevo';
import { z } from 'zod';

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const onlyUnpaid = searchParams.get('onlyUnpaid') !== 'false';

    const query = adminDb.collection('referrers').orderBy('unpaidXOF', 'desc') as FirebaseFirestore.Query;
    const snap = await query.limit(page * PAGE_SIZE + 1).get();
    let all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (onlyUnpaid) all = all.filter((r) => ((r as { unpaidXOF?: number }).unpaidXOF || 0) > 0);
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

const Schema = z.object({
  referrerId: z.string().min(1),
  payoutReference: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { referrerId, payoutReference } = parsed.data;
    const referrerRef = adminDb.collection('referrers').doc(referrerId);
    const referrerDoc = await referrerRef.get();
    if (!referrerDoc.exists)
      return NextResponse.json({ success: false, error: 'Parrain introuvable.' }, { status: 404 });

    const referrer = referrerDoc.data()!;
    const unpaidXOF = referrer.unpaidXOF || 0;
    if (unpaidXOF <= 0)
      return NextResponse.json({ success: false, error: "Aucun montant en attente pour ce parrain." }, { status: 400 });

    // Marque tous les gains non payés de ce parrain comme payés.
    const unpaidEarnings = await adminDb.collection('referral_earnings')
      .where('referrerId', '==', referrerId)
      .where('paid', '==', false)
      .get();

    const now = new Date().toISOString();
    const batch = adminDb.batch();
    let sum = 0;
    unpaidEarnings.docs.forEach(doc => {
      const amount = doc.data().amountXOF || 0;
      sum += amount;
      batch.update(doc.ref, { paid: true, paidAt: now, payoutReference: payoutReference || null });
    });
    batch.update(referrerRef, { unpaidXOF: 0 });
    await batch.commit();

    // Email de confirmation au parrain (pas de push : les comptes parrain n'activent
    // pas les notifications navigateur comme les clients).
    if (referrer.email) {
      await sendCustomEmail({
        email: referrer.email,
        name: referrer.name || referrer.email,
        subject: 'Paiement de vos gains de parrainage — LFD WEB CARD',
        bodyHtml: `Bonjour ${referrer.name || ''},\n\nVotre paiement de ${sum.toLocaleString()} FCFA a été envoyé par Mobile Money.${payoutReference ? `\n\nRéférence : ${payoutReference}` : ''}\n\nMerci pour votre parrainage !`,
      });
    }

    return NextResponse.json({ success: true, data: { amountPaidXOF: sum } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
