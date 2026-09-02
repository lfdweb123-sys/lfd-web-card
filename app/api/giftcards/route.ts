import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { getGiftcards } from '@/lib/pagocards';

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
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
