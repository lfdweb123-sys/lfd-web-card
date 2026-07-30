import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { applyReferralCode } from '@/lib/referral';
import { z } from 'zod';

const Schema = z.object({ promoCode: z.string().min(1).max(30) });

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    if (userDoc.data()?.referredBy) {
      return NextResponse.json({ success: false, error: 'Un code parrain a déjà été renseigné sur ce compte.' }, { status: 400 });
    }

    const applied = await applyReferralCode(user.uid, parsed.data.promoCode);
    if (!applied)
      return NextResponse.json({ success: false, error: 'Code parrain invalide ou inactif.' }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
