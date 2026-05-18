import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { blockCard, unblockCard, type CardBrand } from '@/lib/pagocards';
import { FreezeCardSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = FreezeCardSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { cardId, action } = parsed.data;
    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists || cardDoc.data()!.userId !== user.uid)
      return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });

    const card = cardDoc.data()!;
    const brand = (card.brand as CardBrand) || 'mastercard';

    if (action === 'freeze') await blockCard({ brand, cardid: card.pagocardsCardId, email: card.email });
    else await unblockCard({ brand, cardid: card.pagocardsCardId, email: card.email });

    const newStatus = action === 'freeze' ? 'frozen' : 'active';
    await adminDb.collection('cards').doc(cardId).update({ status: newStatus });

    await adminDb.collection('logs').add({
      type: action === 'freeze' ? 'card_frozen' : 'card_unfrozen',
      userId: user.uid, cardId, createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: { status: newStatus } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
