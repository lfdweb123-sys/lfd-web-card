import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { UpdateProfileSchema } from '@/lib/validations';

// Les règles Firestore interdisent toute écriture directe depuis le client sur /users
// (allow write: if false — Admin SDK uniquement) : la mise à jour du profil doit donc
// passer par cette route plutôt que par un updateDoc() côté client.
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = UpdateProfileSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { displayName, phone, country } = parsed.data;
    await adminDb.collection('users').doc(user.uid).update({ displayName, phone, country });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    console.error('PATCH /api/profile/update a échoué :', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
