import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { RegisterSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/auth-middleware';
import { applyReferralCode } from '@/lib/referral';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`register:${ip}`, 5, 60000))
    return NextResponse.json({ success: false, error: 'Trop de tentatives. Réessayez dans 1 minute.' }, { status: 429 });

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { email, password, displayName, country, phone, promoCode } = parsed.data;
    const userRecord = await adminAuth.createUser({ email, password, displayName });
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'user' });
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid, email, displayName,
      role: 'user', phone: phone || '', country,
      status: 'active', createdAt: new Date().toISOString(),
    });

    // Code parrain (optionnel) — appliqué une seule fois, à l'inscription.
    if (promoCode) await applyReferralCode(userRecord.uid, promoCode);

    return NextResponse.json({ success: true, data: { uid: userRecord.uid } });
} catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    const code = (err as any)?.code || '';
    console.error('REGISTER ERROR:', { msg, code, err });
    
    if (msg.includes('email-already-exists') || msg.includes('EMAIL_EXISTS'))
      return NextResponse.json({ success: false, error: 'Email déjà utilisé.' }, { status: 400 });
    
    return NextResponse.json({ success: false, error: msg, code }, { status: 500 });
  }
}
