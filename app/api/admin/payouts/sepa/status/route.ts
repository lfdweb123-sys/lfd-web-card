import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSepaTransferStatus } from '@/lib/pagocards-4xxbins';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const transferUuid = searchParams.get('transferUuid');
    if (!transferUuid) return NextResponse.json({ success: false, error: 'transferUuid requis.' }, { status: 400 });

    const status = await getSepaTransferStatus(transferUuid);
    return NextResponse.json({ success: true, data: status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
