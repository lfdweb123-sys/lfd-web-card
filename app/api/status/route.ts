import { NextResponse } from 'next/server';

const BASE = 'https://pagocards.com';
const PUB = () => process.env.PAGOCARDS_PUBLIC_KEY!;
const SEC = () => process.env.PAGOCARDS_SECRET_KEY!;

interface CheckResult {
  name: string;
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

async function check(name: string, path: string, opts?: RequestInit): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: { publickey: PUB(), secretkey: SEC(), ...(opts?.headers || {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    // On considère "opérationnel" tout code < 500 : une 4xx signifie que
    // l'API a bien répondu (ex. paramètre manquant), donc le service est UP.
    return { name, ok: res.status < 500, latencyMs, detail: `HTTP ${res.status}` };
  } catch (err) {
    return {
      name, ok: false, latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : 'Erreur réseau',
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    check('EURO-MASTER (taux de change)', '/api/getfx'),
    check('API Visacard', '/api/visacard/getallcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'status-check@lfdweb.com' }),
    }),
    check('4XXBINs (400/493/536)', '/api/v1/cards/getallcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'status-check@lfdweb.com', product_code: 'us_493_visa_bin' }),
    }),
    check('Giftcards', '/api/getgiftcards?page=1&limit=1'),
    check('Admin (wallets)', '/api/admin/balance'),
    check('SEPA (taux FX)', '/api/sepa/getFX'),
  ]);

  const allOk = checks.every(c => c.ok);
  const someOk = checks.some(c => c.ok);
  const overall = allOk ? 'operational' : someOk ? 'degraded' : 'outage';

  return NextResponse.json({
    success: true,
    overall,
    checkedAt: new Date().toISOString(),
    checks,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
