import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { initializePayout } from '@/lib/pagocards';
import { z } from 'zod';

const Schema = z.object({
  quoteId: z.string().min(1),
  account_type: z.enum(['checking', 'savings']),
  account_number: z.string().min(1),
  routing_number: z.string().min(1),
  bank_name: z.string().min(1),
  bank_address: z.string().min(1),
  post_code: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  beneficiary: z.object({
    type: z.enum(['individual', 'business']),
    account_name: z.string().min(1),
    state: z.string().min(1),
    city: z.string().min(1),
    address: z.string().min(1),
    post_code: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const { quoteId, ...bankDetails } = parsed.data;

    const result = await initializePayout(quoteId, bankDetails, randomUUID());

    await adminDb.collection('logs').add({
      type: 'ach_payout_confirmed',
      adminUid: admin.uid,
      quoteId,
      result,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
