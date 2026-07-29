import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const Schema = z.object({
  token: z.string().min(20),
  platform: z.enum(['web', 'android', 'ios']).default('web'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { token, platform } = parsed.data;

    // Un token FCM est unique par navigateur/appareil : on l'utilise comme clé de document
    // pour éviter les doublons si l'utilisateur active la notification plusieurs fois.
    await adminDb.collection('fcm_tokens').doc(token).set({
      userId: user.uid,
      token,
      platform,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message || 'Erreur serveur.' }, { status: 500 });
  }
}
