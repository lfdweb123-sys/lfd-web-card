// lib/pagocards-4xxbins.ts — SERVEUR UNIQUEMENT
// Client pour la nouvelle API unifiée "4XXBINs" de Pagocards (v1), qui couvre :
//   - us_addon_visa_bin  (400BIN, Visa)
//   - us_493_visa_bin    (493BIN, Visa)
//   - us_493_visa_atm    (493-ATM-BIN, Visa, support retrait DAB)
//   - 536_master         (536BIN, Mastercard)
// Ce fichier est volontairement séparé de lib/pagocards.ts (EURO-MASTER + API
// Visacard classique) : aucun des deux n'est supprimé, ils coexistent. Vous pouvez
// proposer n'importe quel produit à vos utilisateurs.

const BASE = 'https://pagocards.com';
const PUB = () => process.env.PAGOCARDS_PUBLIC_KEY!;
const SEC = () => process.env.PAGOCARDS_SECRET_KEY!;

export type Product4xx = 'us_addon_visa_bin' | 'us_493_visa_bin' | 'us_493_visa_atm' | '536_master';

function authHeaders(extra?: Record<string, string>) {
  return { publickey: PUB(), secretkey: SEC(), ...extra };
}

async function request<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = body
    ? authHeaders({ 'Content-Type': 'application/json' })
    : authHeaders();
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as { status?: string }).status === 'failure') {
    const msg = (data as { message?: string }).message || `Pagocards 4XXBINs ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

const get = <T>(endpoint: string) => request<T>('GET', endpoint);
const post = <T>(endpoint: string, body: Record<string, unknown>, idempotencyKey?: string) =>
  request<T>('POST', endpoint, body, idempotencyKey);

// ---------------------------------------------------------------------------
// Types de réponses
// ---------------------------------------------------------------------------

export interface Card4xxBalance {
  amount: number;        // en plus petite unité (centimes de centimes, cf. exemples doc : 10000000 = $10)
  display_amount: number; // montant lisible, ex. 10 = $10
  currency: string;
}

export interface Card4xxData {
  card_id: string;
  product_code: Product4xx;
  brand: '400BIN' | '493BIN' | '493-ATM-BIN' | '536BIN' | string;
  type: string;
  currency: string;
  status: string;
  name_on_card: string;
  email: string;
  last_four: string;
  expiry_month: string;
  expiry_year: string;
  balance: Card4xxBalance;
  card_number: string | null;
  cvv: string | null;
  created_at: string;
}

export interface Card4xxCreateResponse {
  status: string;
  message: string;
  data: Card4xxData;
}

export interface Card4xxListItem {
  cardid: string;
  useremail: string;
  lastfour: string;
  brand: string;
  type: string;
}

export interface Card4xxFundResult {
  status: string;
  message: string;
  data: {
    card_id: string;
    amount: number;
    display_amount: number;
    currency: string;
    status: string;
    transaction_id: string;
  };
}

export interface Card4xxWithdrawResult {
  status: string;
  message: string;
  data: {
    card_id: string;
    amount: number;
    display_amount: number;
    currency: string;
    status: string;
    transaction_id: string;
    wallet_transaction_id: string;
  };
}

export interface Card4xxSimpleResult {
  status: string;
  message: string;
  data: { card_id: string; status: string };
}

export interface Card4xxTransaction {
  id: string;
  card_id: string;
  type: string;
  status: string;
  amount: number;
  display_amount: number;
  currency: string;
  transCurrencyAmt?: string;
  transCurrency?: string;
  feeAmount?: string;
  feeCurrency?: string;
  merchant_name?: string;
  merchant_mcc?: string;
  reference: string;
  created_at: string;
}

export interface Card4xxTransactionsResult {
  status: string;
  message: string;
  data: {
    transactions: Card4xxTransaction[];
    pagination: { type: string; page_num: number; page_size: number; total: number; has_more: boolean };
  };
}

// ---------------------------------------------------------------------------
// Cartes 4XXBINs
// ---------------------------------------------------------------------------

/**
 * Crée une carte. `initial_load` est optionnel (min $10, max $2500), et n'est
 * jamais envoyé pour le produit us_493_visa_atm (pas de charge initiale possible).
 */
export const createCard4xx = (
  d: { product_code: Product4xx; first_name: string; last_name: string; email: string; initial_load?: number },
  idempotencyKey?: string,
) => {
  const body: Record<string, unknown> = {
    product_code: d.product_code,
    first_name: d.first_name,
    last_name: d.last_name,
    email: d.email,
  };
  if (d.product_code !== 'us_493_visa_atm' && d.initial_load !== undefined) {
    body.initial_load = d.initial_load;
  }
  return post<Card4xxCreateResponse>('/api/v1/cards', body, idempotencyKey);
};

export const getCard4xx = (cardId: string) =>
  get<{ status: string; message: string; data: Card4xxData }>(`/api/v1/cards/${encodeURIComponent(cardId)}`);

/** Réservé au produit us_493_visa_atm — le PIN doit faire exactement 6 chiffres. */
export const setCard4xxPin = (cardId: string, pin: string) =>
  post<{ status: string; message: string }>(`/api/v1/cards/${encodeURIComponent(cardId)}/pin`, { pin });

export const getAllCards4xx = (d: { email: string; product_code: Product4xx }) =>
  post<{ cards: Card4xxListItem[] }>('/api/v1/cards/getallcards', d);

/** Montant en USD, jusqu'à 2 décimales (troncature, pas d'arrondi côté Pagocards). */
export const fundCard4xx = (cardId: string, amount: number, idempotencyKey?: string) =>
  post<Card4xxFundResult>(`/api/v1/cards/${encodeURIComponent(cardId)}/fund`, { amount }, idempotencyKey);

/**
 * Retrait USD depuis une carte 400BIN ou 493BIN. Aucun frais de retrait côté
 * Pagocards (contrairement à EURO-MASTER qui prend $1). L'argent est crédité
 * dans votre wallet 400BIN une fois confirmé par le fournisseur de carte.
 */
export const withdrawCard4xx = (cardId: string, amount: number) =>
  post<Card4xxWithdrawResult>(`/api/v1/cards/${encodeURIComponent(cardId)}/withdraw`, { amount });

/**
 * Terminaison définitive. Retirez le solde AVANT de terminer une carte, sinon
 * le remboursement du solde restant peut prendre jusqu'à 45 jours.
 */
export const terminateCard4xx = (cardId: string) =>
  post<Card4xxSimpleResult>(`/api/v1/cards/${encodeURIComponent(cardId)}/terminate`, {});

export const blockCard4xx = (cardId: string, idempotencyKey?: string) =>
  post<Card4xxSimpleResult>(`/api/v1/cards/${encodeURIComponent(cardId)}/block`, {}, idempotencyKey);

export const unblockCard4xx = (cardId: string, idempotencyKey?: string) =>
  post<Card4xxSimpleResult>(`/api/v1/cards/${encodeURIComponent(cardId)}/unblock`, {}, idempotencyKey);

export const getCard4xxTransactions = (cardId: string, pageNum = 1) =>
  get<Card4xxTransactionsResult>(`/api/v1/cards/${encodeURIComponent(cardId)}/transactions?pageNum=${pageNum}`);

// ---------------------------------------------------------------------------
// Payouts — SEPA (EUR, instantané) — vient compléter l'ACH déjà présent dans
// lib/pagocards.ts (getPayoutQuote / initializePayout, qui restent inchangés)
// ---------------------------------------------------------------------------

export interface SepaFxRates {
  status: string;
  message: string;
  [band: string]: unknown; // ex. "25-2499": "0.9212345678" — bande de montant -> taux
  note?: string;
}

export interface SepaQuote {
  success: boolean;
  quoteId: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
  final_amount: string;
  transferfee: number;
  beneficiary_name: string;
  bank_name: string;
  iban: string;
  bic_swift: string;
  expiresAt: string;
  quoteValiditySeconds: number;
}

export interface SepaTransferResult extends SepaQuote {
  transferId: string;
  payoutRail: string;
}

export interface SepaTransferStatus {
  success: boolean;
  transaction: {
    transferUUID: string;
    beneficiaryName: string;
    status: string;
    sourceAsset: string;
    sourceAmount: number;
    targetCurrency: string;
    final_amount: string;
    destination_currency: string;
    spotRate: number;
    payoutRail: string;
    quoteId: string;
    bankAccountDetails: {
      bank_name: string;
      account_number: string;
      routing_number: string;
      account_holder_name: string;
    };
    destinationCountry: string;
    updated_at: string;
  };
}

/** Ne nécessite PAS les headers publickey/secretkey d'après la doc. */
export const getSepaFxRates = async (): Promise<SepaFxRates> => {
  const res = await fetch(`${BASE}/api/sepa/getFX`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  return res.json();
};

export const getSepaQuote = (
  d: {
    sourceAmount: number; destinationCountry: string; nickname: string;
    bank_name: string; iban: string; bic_swift: string;
    street: string; city: string; state_province: string; postal_code: string;
  },
  idempotencyKey: string,
) => post<SepaQuote>('/api/sepa/getquote', d, idempotencyKey);

export const confirmSepaTransfer = (quoteid: string, idempotencyKey: string) =>
  post<SepaTransferResult>('/api/sepa/transfer', { quoteid }, idempotencyKey);

export const getSepaTransferStatus = (transferUuid: string) =>
  get<SepaTransferStatus>(`/api/sepa/getstatus/${encodeURIComponent(transferUuid)}`);
