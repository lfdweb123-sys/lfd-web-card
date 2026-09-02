import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { confirmSepaTransfer } from '@/lib/pagocards-4xxbins';
import { z } from 'zod';

const Schema = z.object({ quoteid: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const result = await confirmSepaTransfer(parsed.data.quoteid, crypto.randomUUID());

    await adminDb.collection('logs').add({
      type: 'sepa_payout_confirmed',
      adminUid: admin.uid,
      quoteid: parsed.data.quoteid,
      transferId: result.transferId,
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
