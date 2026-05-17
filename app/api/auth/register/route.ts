// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { RegisterSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  if (!rateLimit(`register:${ip}`, 5, 60_000)) {
    return NextResponse.json({ success: false, error: 'Trop de tentatives. Réessayez dans 1 minute.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, displayName, country, phone } = parsed.data;

    // Créer dans Firebase Auth
    const userRecord = await adminAuth.createUser({ email, password, displayName });

    // Définir le rôle
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'user' });

    // Créer le profil Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: 'user',
      phone: phone || '',
      country,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: { uid: userRecord.uid } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    if (message.includes('EMAIL_EXISTS') || message.includes('email-already-exists')) {
      return NextResponse.json({ success: false, error: 'Email déjà utilisé.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
