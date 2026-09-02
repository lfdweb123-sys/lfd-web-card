import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { setVisacardSpendControls } from '@/lib/pagocards';
import { z } from 'zod';

// Doc Pagocards : PUT /api/visacard/spendcontrols — réservé à la Visacard classique
// (n'existe pas pour l'EURO-MASTER ni pour la nouvelle gamme 4XXBINs).
const Schema = z.object({
  cardId: z.string().min(1),
  singleTransaction: z.number().min(0).max(50000).optional(),
  daily: z.number().min(0).max(500000).optional(),
  weekly: z.number().min(0).max(2000000).optional(),
  monthly: z.number().min(0).max(5000000).optional(),
  blockGambling: z.boolean().optional(),
  blockAdultContent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!rateLimit(`spend-controls:${user.uid}`, 10, 60000))
      return NextResponse.json({ success: false, error: 'Trop de requêtes.' }, { status: 429 });

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const { cardId, singleTransaction, daily, weekly, monthly, blockGambling, blockAdultContent } = parsed.data;

    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists) return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });
    const card = cardDoc.data()!;
    if (card.userId !== user.uid) return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });
    if (card.apiFamily === '4xxbins' || card.brand !== 'visa')
      return NextResponse.json({ success: false, error: 'Les limites de dépense sont disponibles uniquement pour les cartes Visa classiques.' }, { status: 400 });

    const blockedCategories: string[] = [];
    if (blockGambling) blockedCategories.push('gambling');
    if (blockAdultContent) blockedCategories.push('adult_content');

    const result = await setVisacardSpendControls({
      cardid: card.pagocardsCardId,
      email: card.email,
      ...(singleTransaction !== undefined ? { single_transaction: singleTransaction.toFixed(2) } : {}),
      ...(daily !== undefined ? { daily: daily.toFixed(2) } : {}),
      ...(weekly !== undefined ? { weekly: weekly.toFixed(2) } : {}),
      ...(monthly !== undefined ? { monthly: monthly.toFixed(2) } : {}),
      blocked_categories: blockedCategories,
    });

    await cardDoc.ref.update({
      spendControls: {
        singleTransaction: singleTransaction ?? null,
        daily: daily ?? null,
        weekly: weekly ?? null,
        monthly: monthly ?? null,
        blockedCategories,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
