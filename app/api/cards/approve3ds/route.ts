// app/api/cards/approve3ds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { approve3DS } from '@/lib/pagocards';
import { z } from 'zod';

const Schema = z.object({
  cardId: z.string().min(1),
  eventId: z.string().min(1),
  notificationId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { cardId, eventId, notificationId } = parsed.data;

    // Vérifier ownership
    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists || cardDoc.data()!.userId !== user.uid) {
      return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });
    }
    const card = cardDoc.data()!;

    // Appel Pagocards approve3DS (Mastercard uniquement)
    // POST /api/mastercard/approve3ds
    await approve3DS({
      email: card.email as string,
      cardid: card.pagocardsCardId as string,
      eventId,
    });

    // Marquer la notification comme lue et traitée
    await adminDb.collection('notifications').doc(notificationId).update({
      read: true,
      requiresAction: false,
      resolvedAt: new Date().toISOString(),
    });

    // Supprimer le pendingAction sur la carte
    await cardDoc.ref.update({ pendingAction: null });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
