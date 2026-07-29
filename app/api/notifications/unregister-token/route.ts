import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const Schema = z.object({ token: z.string().min(20) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const ref = adminDb.collection('fcm_tokens').doc(parsed.data.token);
    const doc = await ref.get();
    if (doc.exists && doc.data()!.userId === user.uid) await ref.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message || 'Erreur serveur.' }, { status: 500 });
  }
}
