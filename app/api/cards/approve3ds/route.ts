import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { approve3DS } from '@/lib/pagocards';
import { z } from 'zod';

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

    const card = cardDoc.data()!;
    await approve3DS({ email: card.email, cardid: card.pagocardsCardId, eventId });
    await adminDb.collection('notifications').doc(notificationId).update({ read: true, requiresAction: false, resolvedAt: new Date().toISOString() });
    await cardDoc.ref.update({ pendingAction: null });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
