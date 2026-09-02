// lib/verzapay.ts — SERVEUR UNIQUEMENT
// Client API VerzaPay — https://www.verzapay.com/api/v1
// Auth : header Authorization: Bearer <clé secrète>.
// Utilisé UNIQUEMENT pour le décaissement (retrait automatique) — jamais pour
// l'encaissement, qui reste géré par la passerelle de paiement LFD existante.
//
// Contrairement à FeexPay, la doc VerzaPay ne documente aucun endpoint de consultation
// du statut d'un décaissement — la seule confirmation possible est asynchrone, via les
// webhooks payout.completed / payout.failed (voir app/api/webhook/verzapay/route.ts).
// La doc ne montre pas non plus d'exemple JSON pour la réponse de /payouts : on ne lit
// donc que les champs indispensables (id, status) en restant défensif sur leur présence.

const BASE = 'https://www.verzapay.com/api/v1';
const SECRET_KEY = () => process.env.VERZAPAY_SECRET_KEY!;

function authHeaders() {
  return { Authorization: `Bearer ${SECRET_KEY()}`, 'Content-Type': 'application/json' };
}

// Devise par pays, déduite du tableau "Pays disponibles" de la doc. Seuls les pays marqués
// "Décaissement : Disponible" apparaissent ici — la France n'a pas de décaissement.
export const VERZAPAY_PAYOUT_COUNTRIES: Record<string, string> = {
  BJ: 'XOF', BF: 'XOF', CM: 'XAF', CI: 'XOF', GA: 'XAF', GH: 'GHS', GN: 'GNF',
  ML: 'XOF', NE: 'XOF', NG: 'NGN', CD: 'CDF', RW: 'RWF', SN: 'XOF', TG: 'XOF',
};

export function isVerzaPayoutCountry(countryCode: string): boolean {
  return countryCode.toUpperCase() in VERZAPAY_PAYOUT_COUNTRIES;
}

export interface VerzaPayoutResponse {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

export async function createVerzaPayout(d: {
  amount: number; // en devise locale (XOF/XAF/etc.), jamais en USD
  currency: string;
  recipientPhone: string; // format international AVEC le "+", ex. +22996000000
  recipientName: string;
}): Promise<VerzaPayoutResponse> {
  const res = await fetch(`${BASE}/payouts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      amount: d.amount,
      currency: d.currency,
      recipient_phone: d.recipientPhone,
      recipient_name: d.recipientName,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string; error?: string }).message
      || (data as { message?: string; error?: string }).error
      || `VerzaPay ${res.status}`;
    throw new Error(msg);
  }
  return data as VerzaPayoutResponse;
}
