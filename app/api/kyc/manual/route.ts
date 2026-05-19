// app/api/kyc/manual/route.ts
// Soumet une vérification manuelle (recto, verso, selfie en base64)
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

// Taille max par image : 1.5 MB en base64 (≈ 2MB fichier original)
const MAX_BASE64_SIZE = 1.5 * 1024 * 1024; // 1.5MB

const Schema = z.object({
  idFront: z.string().min(100, 'Image recto manquante'),
  idBack: z.string().min(100, 'Image verso manquante'),
  selfie: z.string().min(100, 'Selfie manquant'),
});

function base64Size(b64: string): number {
  // Retirer le header data:image/...;base64,
  const data = b64.includes(',') ? b64.split(',')[1] : b64;
  return Math.round((data.length * 3) / 4);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!rateLimit(`kyc-manual:${user.uid}`, 2, 300000)) { // 2 essais par 5 min
      return NextResponse.json({ success: false, error: 'Trop de tentatives. Attendez 5 minutes.' }, { status: 429 });
    }

    // Vérifier qu'il n'a pas déjà un KYC approuvé
    const existing = await adminDb.collection('kyc').doc(user.uid).get();
    if (existing.exists && existing.data()?.status === 'approved') {
      return NextResponse.json({ success: false, error: 'Identité déjà vérifiée.' }, { status: 400 });
    }

    // Vérifier si une soumission manuelle est déjà en attente
    if (existing.exists && existing.data()?.method === 'manual' && existing.data()?.status === 'pending') {
      return NextResponse.json({ success: false, error: 'Votre dossier est déjà en cours d\'examen.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { idFront, idBack, selfie } = parsed.data;

    // Vérification des tailles
    for (const [name, img] of [['Recto', idFront], ['Verso', idBack], ['Selfie', selfie]]) {
      if (base64Size(img) > MAX_BASE64_SIZE) {
        return NextResponse.json({
          success: false,
          error: `${name} trop volumineux. Maximum 1.5 MB par image.`,
        }, { status: 400 });
      }
    }

    // S'assurer que les images sont en base64 pur (sans header)
    const cleanBase64 = (b64: string) => b64.includes(',') ? b64.split(',')[1] : b64;

    await adminDb.collection('kyc').doc(user.uid).set({
      userId: user.uid,
      method: 'manual',
      status: 'pending',
      images: {
        idFront: cleanBase64(idFront),
        idBack: cleanBase64(idBack),
        selfie: cleanBase64(selfie),
      },
      rejectionReason: null,
      createdAt: existing.exists ? existing.data()?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    });

    // Notification admin
    await adminDb.collection('notifications_admin').add({
      type: 'kyc_manual_submitted',
      userId: user.uid,
      message: `Nouvelle vérification manuelle soumise par ${user.uid}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}