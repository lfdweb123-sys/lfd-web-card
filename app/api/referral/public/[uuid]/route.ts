import { NextRequest, NextResponse } from 'next/server';
import { resolveReferrerByPublicId } from '@/lib/referral';
import { rateLimit } from '@/lib/auth-middleware';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Résolution publique d'un lien de parrainage (?ref=uuid).
 * Ne renvoie jamais le promoCode interne du parrain ni ses gains —
 * uniquement son prénom, pour le message d'invitation. Un UUID
 * invalide ou inconnu renvoie simplement { success: false }.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`referral-public:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  const { uuid } = await params;
  if (!uuid || !UUID_RE.test(uuid)) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  const referrer = await resolveReferrerByPublicId(uuid).catch(() => null);
  if (!referrer) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  return NextResponse.json({ success: true, name: referrer.name });
}
