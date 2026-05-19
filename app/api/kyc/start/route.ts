// app/api/kyc/start/route.ts
// Crée une session Didit et retourne l'URL de vérification
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { createDiditSession } from '@/lib/didit';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!rateLimit(`kyc-start:${user.uid}`, 3, 60000)) {
      return NextResponse.json({ success: false, error: 'Trop de tentatives.' }, { status: 429 });
    }

    // Vérifier qu'il n'a pas déjà un KYC approuvé
    const existing = await adminDb.collection('kyc').doc(user.uid).get();
    if (existing.exists && existing.data()?.status === 'approved') {
      return NextResponse.json({ success: false, error: 'Identité déjà vérifiée.' }, { status: 400 });
    }

    // Créer la session Didit
    const session = await createDiditSession(user.uid);

    // Stocker la session en Firestore
    await adminDb.collection('kyc').doc(user.uid).set({
      userId: user.uid,
      method: 'didit',
      status: 'pending',
      diditSessionId: session.session_id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true, data: { url: session.url, sessionId: session.session_id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}