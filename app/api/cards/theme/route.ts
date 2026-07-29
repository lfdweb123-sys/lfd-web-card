import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { CARD_THEME_IDS } from '@/lib/card-themes';
import { z } from 'zod';

const Schema = z.object({
  cardId: z.string().min(1),
  theme: z.enum(CARD_THEME_IDS as [string, ...string[]]),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { cardId, theme } = parsed.data;
    const cardRef = adminDb.collection('cards').doc(cardId);
    const cardDoc = await cardRef.get();
    if (!cardDoc.exists || cardDoc.data()!.userId !== user.uid)
      return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });

    await cardRef.update({ theme });
    return NextResponse.json({ success: true, data: { theme } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
