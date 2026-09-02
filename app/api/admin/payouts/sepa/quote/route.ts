import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSepaQuote } from '@/lib/pagocards-4xxbins';
import { z } from 'zod';

const Schema = z.object({
  sourceAmount: z.number().positive(),
  destinationCountry: z.string().min(2),
  nickname: z.string().min(1),
  bank_name: z.string().min(1),
  iban: z.string().min(1),
  bic_swift: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state_province: z.string().min(1),
  postal_code: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const quote = await getSepaQuote(parsed.data, randomUUID());
    return NextResponse.json({ success: true, data: quote });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
