import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { getGiftcards, checkGiftcardSkuAvailability, type PagoGiftcard } from '@/lib/pagocards';
import { getGiftcardPriceRange } from '@/lib/giftcard-utils';

// Sonde jusqu'à N vérifications de disponibilité en parallèle à la fois — Pagocards ne documente
// aucun endpoint de disponibilité "en masse", donc on interroge carte par carte, mais avec une
// concurrence bornée pour ne pas déclencher de limitation de débit côté fournisseur.
const AVAILABILITY_CONCURRENCY = 8;

async function isAvailable(card: PagoGiftcard): Promise<boolean> {
  try {
    const { min } = getGiftcardPriceRange(card);
    const res = await checkGiftcardSkuAvailability(card.sku, 1, min);
    return res.availability?.availability === true;
  } catch {
    // On ne sait pas si c'est réellement disponible — par sécurité on ne l'affiche pas
    // plutôt que de proposer une carte qui échouera à l'achat.
    return false;
  }
}

async function filterAvailable(cards: PagoGiftcard[]): Promise<PagoGiftcard[]> {
  const results: PagoGiftcard[] = [];
  for (let i = 0; i < cards.length; i += AVAILABILITY_CONCURRENCY) {
    const batch = cards.slice(i, i + AVAILABILITY_CONCURRENCY);
    const flags = await Promise.all(batch.map(isAvailable));
    batch.forEach((card, j) => { if (flags[j]) results.push(card); });
  }
  return results;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!rateLimit(`giftcards:${user.uid}`, 30, 60000))
      return NextResponse.json({ success: false, error: 'Trop de requêtes.' }, { status: 429 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const search = searchParams.get('search') || undefined;
    const country = searchParams.get('country') || undefined;
    const currency = searchParams.get('currency') || undefined;

    const result = await getGiftcards({ page, limit, search, country, currency });
    const rawCount = result.data.length;
    const available = await filterAvailable(result.data);

    // La page suivante existe côté Pagocards dès que cette page était pleine — indépendamment
    // du nombre de cartes filtrées ici, sinon le client croirait à tort qu'il n'y a plus rien.
    const hasMore = rawCount >= limit;

    return NextResponse.json({ success: true, data: { ...result, data: available, hasMore } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    console.error('GET /api/giftcards a échoué :', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
