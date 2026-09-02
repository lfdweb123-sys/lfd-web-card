// lib/feexpay.ts — SERVEUR UNIQUEMENT
// Client API FeexPay (Payouts V2) — https://docs.feexpay.me/?section=services-payout&version=v2
// Auth : header Authorization: Bearer <clé API> sur toutes les requêtes.
// Comportement V2 : un payout renvoie immédiatement le statut PENDING ; le statut final
// (SUCCESSFUL/FAILED) doit être confirmé via l'endpoint de statut avant de considérer
// l'opération comme terminée — ne jamais faire confiance au seul statut PENDING initial.

const BASE = 'https://api-v2.feexpay.me';
const API_KEY = () => process.env.FEEXPAY_API_KEY!;
const SHOP_ID = () => process.env.FEEXPAY_SHOP_ID!;

function authHeaders() {
  return { Authorization: `Bearer ${API_KEY()}`, 'Content-Type': 'application/json' };
}

export interface FeexPayPayoutResponse {
  reference: string;
  status: 'PENDING' | string;
  message: string;
  description?: string;
  phone_number: string;
  amount: number;
  callback_info: string | null;
}

export interface FeexPayStatusResponse {
  reference: string;
  amount: number;
  phoneNumber: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'IN PENDING STATE' | string;
  callback_info: string | null;
  responsecode: string;
  responsemsg: string;
  transref: string;
  serviceref: string;
  reason: string;
  description: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Réseaux disponibles — chaque réseau est mappé sur son endpoint FeexPay exact.
// `requiresOtp: true` signifie qu'un code OTP doit être généré manuellement par le
// bénéficiaire (USSD ou appli) avant l'appel — INCOMPATIBLE avec un retrait automatique
// sans intervention humaine, ces réseaux sont donc exclus du payout automatique.
// `minAmountXOF` reprend le minimum documenté (en devise locale, FCFA/XOF ou CFA).
// ---------------------------------------------------------------------------

export type FeexPayNetwork =
  | 'mtn_bj' | 'moov_bj' | 'celtiis_bj'
  | 'mtn_ci' | 'orange_ci' | 'moov_ci' | 'wave_ci'
  | 'togocom_tg' | 'moov_tg'
  | 'orange_sn' | 'free_sn' | 'wave_sn'
  | 'mtn_cg'
  | 'moov_bf' | 'orange_bf' | 'wave_bf'
  | 'orange_ml' | 'mobicash_ml';

interface NetworkConfig {
  country: string; // code pays ISO utilisé côté plateforme (BJ, CI, TG, SN, CG, BF, ML)
  endpoint: string;
  networkParam?: string; // valeur du champ "network" attendue par FeexPay, si applicable
  minAmountXOF: number;
  requiresOtp?: boolean;
  label: string;
}

export const FEEXPAY_NETWORKS: Record<FeexPayNetwork, NetworkConfig> = {
  mtn_bj: { country: 'BJ', endpoint: '/api/payouts/public/transfer/global', networkParam: 'MTN', minAmountXOF: 50, label: 'MTN Mobile Money (Bénin)' },
  moov_bj: { country: 'BJ', endpoint: '/api/payouts/public/transfer/global', networkParam: 'MOOV', minAmountXOF: 50, label: 'Moov Money (Bénin)' },
  celtiis_bj: { country: 'BJ', endpoint: '/api/payouts/public/celtiis_bj', networkParam: 'CELTIIS BJ', minAmountXOF: 50, label: 'Celtiis (Bénin)' },
  mtn_ci: { country: 'CI', endpoint: '/api/payouts/public/mtn_ci', minAmountXOF: 100, label: "MTN Money (Côte d'Ivoire)" },
  orange_ci: { country: 'CI', endpoint: '/api/payouts/public/orange_ci', minAmountXOF: 100, label: "Orange Money (Côte d'Ivoire)" },
  moov_ci: { country: 'CI', endpoint: '/api/payouts/public/moov_ci', minAmountXOF: 100, label: "Moov Money (Côte d'Ivoire)" },
  wave_ci: { country: 'CI', endpoint: '/api/payouts/public/wave_ci', minAmountXOF: 100, label: "Wave (Côte d'Ivoire)" },
  togocom_tg: { country: 'TG', endpoint: '/api/payouts/public/togo', networkParam: 'TOGOCOM TG', minAmountXOF: 100, label: 'Togocom (Togo)' },
  moov_tg: { country: 'TG', endpoint: '/api/payouts/public/togo', networkParam: 'MOOV TG', minAmountXOF: 100, label: 'Moov (Togo)' },
  orange_sn: { country: 'SN', endpoint: '/api/payouts/public/orange_sn', minAmountXOF: 100, label: 'Orange Money (Sénégal)' },
  free_sn: { country: 'SN', endpoint: '/api/payouts/public/free_sn', minAmountXOF: 100, label: 'Free Money (Sénégal)' },
  wave_sn: { country: 'SN', endpoint: '/api/payouts/public/wave_sn', minAmountXOF: 100, label: 'Wave (Sénégal)' },
  mtn_cg: { country: 'CG', endpoint: '/api/payouts/public/mtn_cg', minAmountXOF: 100, label: 'MTN (Congo Brazzaville)' },
  moov_bf: { country: 'BF', endpoint: '/api/payouts/public/moov_bf', minAmountXOF: 100, label: 'Moov (Burkina Faso)' },
  orange_bf: { country: 'BF', endpoint: '/api/payouts/public/orange_bf', minAmountXOF: 100, requiresOtp: true, label: 'Orange (Burkina Faso)' },
  wave_bf: { country: 'BF', endpoint: '/api/payouts/public/wave_bf', minAmountXOF: 100, requiresOtp: true, label: 'Wave (Burkina Faso)' },
  orange_ml: { country: 'ML', endpoint: '/api/payouts/public/orange_ml', minAmountXOF: 100, label: 'Orange (Mali)' },
  mobicash_ml: { country: 'ML', endpoint: '/api/payouts/public/mobicash_ml', minAmountXOF: 100, label: 'Mobicash (Mali)' },
};

/** Réseaux éligibles à un retrait 100% automatique (sans OTP à saisir manuellement). */
export function isAutoPayoutEligible(network: FeexPayNetwork): boolean {
  return !FEEXPAY_NETWORKS[network].requiresOtp;
}

export async function initiateFeexPayout(d: {
  network: FeexPayNetwork;
  phoneNumber: string; // format international sans "+", ex. 2290166000000
  amount: number; // en devise locale (XOF/CFA), jamais en USD
  motif: string; // 30 caractères max, sans caractères spéciaux
  callback_info?: string;
}): Promise<FeexPayPayoutResponse> {
  const cfg = FEEXPAY_NETWORKS[d.network];
  const body: Record<string, unknown> = {
    shop: SHOP_ID(),
    amount: d.amount,
    phoneNumber: d.phoneNumber,
    motif: d.motif.slice(0, 30),
    ...(d.callback_info ? { callback_info: d.callback_info } : {}),
    ...(cfg.networkParam ? { network: cfg.networkParam } : {}),
  };

  const res = await fetch(`${BASE}${cfg.endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message || `FeexPay ${res.status}`;
    throw new Error(msg);
  }
  return data as FeexPayPayoutResponse;
}

export async function getFeexPayoutStatus(reference: string): Promise<FeexPayStatusResponse> {
  const res = await fetch(`${BASE}/api/payouts/status/public/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message || `FeexPay ${res.status}`;
    throw new Error(msg);
  }
  return data as FeexPayStatusResponse;
}

/**
 * Lance un payout puis interroge son statut final quelques fois de suite (le temps
 * qu'une fonction serverless reste vivante) — la doc impose de vérifier le statut final
 * avant de considérer l'opération terminée, un simple PENDING initial n'est jamais
 * suffisant. Si le statut n'est toujours pas tranché à la fin, l'appelant doit basculer
 * en suivi manuel (le retrait n'est ni confirmé ni infirmé).
 */
export async function payoutAndAwaitResult(
  d: Parameters<typeof initiateFeexPayout>[0],
  opts: { attempts?: number; delayMs?: number } = {},
): Promise<{ resolved: boolean; success: boolean; payout: FeexPayPayoutResponse; finalStatus?: FeexPayStatusResponse }> {
  const payout = await initiateFeexPayout(d);
  const attempts = opts.attempts ?? 3;
  const delayMs = opts.delayMs ?? 2000;

  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    try {
      const status = await getFeexPayoutStatus(payout.reference);
      if (status.status === 'SUCCESSFUL') return { resolved: true, success: true, payout, finalStatus: status };
      if (status.status === 'FAILED') return { resolved: true, success: false, payout, finalStatus: status };
    } catch { /* on retente au prochain tour */ }
  }
  return { resolved: false, success: false, payout };
}
