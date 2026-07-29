import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

// NOTE: la documentation officielle Pagocards ne liste aucun endpoint d'approbation
// manuelle du 3DS (pas de /api/.../approve3ds). Le webhook Pagocards livre déjà la
// décision (APPROVED / DECLINED / PENDING) sur l'événement "3ds". Cette route se
// contente donc d'accuser réception côté app (marquer la notif comme traitée).
// À réévaluer avec le support Pagocards si un déclenchement actif est nécessaire.

const Schema = z.object({ cardId: z.string().min(1), eventId: z.string().min(1), notificationId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { cardId, eventId, notificationId } = parsed.data;
    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists || cardDoc.data()!.userId !== user.uid)
      return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });

    void eventId; // conservé pour traçabilité, pas envoyé à Pagocards (endpoint non documenté)
    await adminDb.collection('notifications').doc(notificationId).update({ read: true, requiresAction: false, resolvedAt: new Date().toISOString() });
    await cardDoc.ref.update({ pendingAction: null });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
