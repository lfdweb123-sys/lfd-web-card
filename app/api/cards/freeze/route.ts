// app/api/cards/freeze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { blockCard, unblockCard, type CardBrand } from '@/lib/pagocards';
import { FreezeCardSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = await req.json();
    const parsed = FreezeCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { cardId, action } = parsed.data;

    // Vérifier ownership
    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists) {
      return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });
    }
    const card = cardDoc.data()!;
    if (card.userId !== user.uid) {
      return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });
    }

    const brand = (card.brand as CardBrand) || 'mastercard';
    const email = card.email as string;
    const pagoCardId = card.pagocardsCardId as string;

    // Appels Pagocards selon la marque et l'action
    // Mastercard : /api/mastercard/blockdigital ou /api/mastercard/unblockdigital
    // Visa       : /api/visacard/blockcard ou /api/visacard/unblockcard
    if (action === 'freeze') {
      await blockCard({ brand, cardid: pagoCardId, email });
    } else {
      await unblockCard({ brand, cardid: pagoCardId, email });
    }

    const newStatus = action === 'freeze' ? 'frozen' : 'active';
    await adminDb.collection('cards').doc(cardId).update({
      status: newStatus,
      ...(action === 'unfreeze' ? { pendingAction: null } : {}),
    });

    // Log
    await adminDb.collection('logs').add({
      type: action === 'freeze' ? 'card_frozen' : 'card_unfrozen',
      userId: user.uid,
      cardId,
      pagocardsCardId: pagoCardId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: { status: newStatus } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
