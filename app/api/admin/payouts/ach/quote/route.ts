import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/auth-middleware';
import { getPayoutQuote } from '@/lib/pagocards';
import { z } from 'zod';

// Payout ACH — virement du wallet USD de la plateforme vers un compte bancaire US.
// Fonctionnalité opérationnelle réservée à l'admin (aucun utilisateur final n'y a accès).
const Schema = z.object({
  amount: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const quote = await getPayoutQuote({ to_currency: 'USD', country: 'US', amount: parsed.data.amount }, randomUUID());
    return NextResponse.json({ success: true, data: quote });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
