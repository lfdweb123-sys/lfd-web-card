// app/api/kyc/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const doc = await adminDb.collection('kyc').doc(user.uid).get();

    if (!doc.exists) {
      return NextResponse.json({ success: true, data: null });
    }

    const data = doc.data()!;
    // Ne jamais retourner les images base64 au client
    const { images: _images, ...safeData } = data;
    void _images;

    return NextResponse.json({ success: true, data: safeData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}