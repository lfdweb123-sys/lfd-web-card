// lib/pagocards.ts — SERVEUR UNIQUEMENT
// Client API Pagocards — aligné strictement sur https://pagocards.com/documentation
// Auth : headers `publickey` + `secretkey` sur toutes les requêtes.

const BASE = 'https://pagocards.com';
const PUB = () => process.env.PAGOCARDS_PUBLIC_KEY!;
const SEC = () => process.env.PAGOCARDS_SECRET_KEY!;

function authHeaders(extra?: Record<string, string>) {
  return { publickey: PUB(), secretkey: SEC(), ...extra };
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  endpoint: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<T> {
  const headers = body ? authHeaders({ 'Content-Type': 'application/json' }) : authHeaders();
  if (idempotencyKey) (headers as Record<string, string>)['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string; error?: string }).message
      || (data as { message?: string; error?: string }).error
      || `Pagocards ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

const get = <T>(endpoint: string) => request<T>('GET', endpoint);
// Idempotency-Key : optionnelle d'après la doc, mais recommandée sur les endpoints qui
// déplacent réellement de l'argent (payouts ACH/SEPA notamment).
const post = <T>(endpoint: string, body: Record<string, unknown>, idempotencyKey?: string) =>
  request<T>('POST', endpoint, body, idempotencyKey);
const put = <T>(endpoint: string, body: Record<string, unknown>) => request<T>('PUT', endpoint, body);

export type CardBrand = 'mastercard' | 'visa';

// ---------------------------------------------------------------------------
// Types de réponses
// ---------------------------------------------------------------------------

export interface PagoCardCreated {
  cardid: string;
  useremail: string;
  nameoncard: string;
  message?: string;
}

export interface PagoCardDetails {
  cardid: string;
  useremail: string;
  nameoncard: string;
  brand: string;
  type: string;
  currency: string;
  status: string;
  balance: number;
}

export interface PagoCardListItem {
  cardid: string;
  useremail: string;
  lastfour: string;
  brand: string;
  type: string;
  status?: string;
}

export interface PagoFundResult {
  status: string;
  reference?: string;
  transaction_id?: string;
  amount: number;
  amount_eur?: number;
  fee?: number;
  code?: number;
}

export interface PagoWithdrawResult {
  status: string;
  cardid: string;
  useremail: string;
  euro_amount: number;
  usdc_amount: number;
  transactionId: string;
}

export interface PagoSensitiveResult {
  cardid: string;
  useremail: string;
  cardnumber: string;
  cvc: string;
  month: string;
  url: string;
  message?: string;
}

export interface PagoTransaction {
  id: string;
  amount: number;
  currency: string;
  settledAmount: number;
  merchant: string;
  mcc: string;
  type: string[];
  status: string[];
  transactionDate: string;
  clearingTransactionDate?: string;
  declineReason: string | null;
}

export interface PagoTransactionsResult {
  status: string;
  data: {
    transactions: PagoTransaction[];
    pagination: { page: number; limit: number; pages: number; total: number };
  };
}

export interface PagoFxResult {
  status: string;
  fx: { rate: number; comission: number; value: number };
}

export interface PagoSimpleResult { status?: string; success?: boolean; message?: string; }

export interface PagoSpendControlsResult {
  status: string;
  message: string;
  code: number;
  data: {
    card_id: string;
    operation: string;
    spending_limits: Record<string, unknown>;
    updated_at: string;
  };
}

export interface PagoGiftcard {
  sku: string;
  title: string;
  currency: string;
  region?: string;
  country?: string;
  // Champs confirmés visuellement sur l'interface "Buy Giftcards" de Pagocards (colonnes
  // IMAGE/MIN PRICE/MAX PRICE/REGIONS) — nom exact non documenté en JSON, voir
  // lib/giftcard-utils.ts qui lit plusieurs variantes de casse par sécurité.
  minPrice?: number;
  maxPrice?: number;
  image?: string;
  regions?: string | string[];
  [key: string]: unknown;
}

export interface PagoGiftcardsList {
  data: PagoGiftcard[];
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export interface PagoGiftcardOrder {
  referencecode: string;
  sku: string;
  quantity: number;
  amount: number;
  shareLink?: string;
  [key: string]: unknown;
}

export interface PagoPayoutQuote {
  quoteId: string;
  to_currency: string;
  country: string;
  amount: string;
  [key: string]: unknown;
}

export interface PagoAdminBalance {
  status: string;
  master_wallet_balance: number;
  visa_wallet_balance: number;
  giftcard_wallet_balance: number;
  sepa_wallet_balance?: number;
}

export interface PagoAdminTransactions {
  status: string;
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  transactions: { uuid: string; description: string; amount: string }[];
}

export interface PagoAdminDeposits {
  status: string;
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  deposits: { amount: string; status: string }[];
}

export interface PagoAdminCards {
  status: string;
  message: string;
  code: number;
  data: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    cards: { cardid: string; useremail: string; lastfour: string; brand: string; type: string; status: string }[];
  };
}

// ---------------------------------------------------------------------------
// EURO-MASTER API — cartes Mastercard virtuelles EUR
// ---------------------------------------------------------------------------

export const createMastercard = (d: { firstname: string; lastname: string; email: string }) =>
  post<PagoCardCreated>('/api/createcard', { firstName: d.firstname, lastName: d.lastname, email: d.email });

export const getMastercard = (d: { cardid: string; email: string }) =>
  post<PagoCardDetails>('/api/getcard', d);

export const getAllMastercards = (d: { email: string }) =>
  post<{ cards: PagoCardListItem[] }>('/api/getallcards', d);

export const getMastercardFx = () => get<PagoFxResult>('/api/getfx');

export const getMastercardSensitive = (d: { cardid: string; email: string }) =>
  post<PagoSensitiveResult>('/api/getcardsensitive', d);

/** amount = montant en USDC, minimum 3 */
export const fundMastercard = (d: { cardid: string; email: string; amount: number }) =>
  post<PagoFundResult>('/api/fundcard', d);

/** amount = montant en USDC à retirer, doit être > 1. $1 de frais. */
export const withdrawMastercard = (d: { cardid: string; email: string; amount: number }) =>
  post<PagoWithdrawResult>('/api/withdraw', d);

export const getMastercardTransactions = (d: {
  cardid: string; email: string; page?: number; limit?: number;
  dateFrom?: string; dateTo?: string; types?: string; dateSort?: string;
}) => post<PagoTransactionsResult>('/api/gettransactions', d);

export const blockMastercard = (d: { cardid: string; email: string }) =>
  post<PagoSimpleResult>('/api/blockcard', d);

export const unblockMastercard = (d: { cardid: string; email: string }) =>
  post<PagoSimpleResult>('/api/unblockcard', d);

/** Terminaison définitive. $1 de frais. */
export const terminateMastercard = (d: { cardid: string; email: string }) =>
  post<PagoSimpleResult>('/api/terminatecard', d);

// ---------------------------------------------------------------------------
// Visacard API — cartes Visa virtuelles USD
// ---------------------------------------------------------------------------

/** $3 de chargement initial obligatoire, débité du wallet Visa Pagocards */
export const createVisacard = (d: { firstname: string; lastname: string; email: string }) =>
  post<PagoCardCreated>('/api/visacard/createcard', d);

export const fundVisacard = (d: { cardid: string; email: string; amount: number }) =>
  post<PagoFundResult>('/api/visacard/fundcard', d);

export const getVisacard = (d: { cardid: string; email: string }) =>
  post<PagoCardDetails>('/api/visacard/getcard', d);

export const getAllVisacards = (d: { email: string }) =>
  post<{ cards: PagoCardListItem[] }>('/api/visacard/getallcards', d);

export const blockVisacard = (d: { cardid: string; email: string }) =>
  post<PagoSimpleResult>('/api/visacard/blockcard', d);

export const unblockVisacard = (d: { cardid: string; email: string }) =>
  post<PagoSimpleResult>('/api/visacard/unblockcard', d);

export const setVisacardSpendControls = (d: {
  cardid: string; email: string;
  single_transaction?: string; daily?: string; weekly?: string; monthly?: string;
  allowed_categories?: string[]; blocked_categories?: string[];
  allowed_merchants?: string[]; blocked_merchants?: string[];
}) => put<PagoSpendControlsResult>('/api/visacard/spendcontrols', d);

/** Terminaison Visa — endpoint plat, PAS sous /visacard/ */
export const terminateVisacard = (d: { cardid: string; email: string }) =>
  post<PagoSimpleResult>('/api/terminate', d);

// ---------------------------------------------------------------------------
// Helpers unifiés multi-marque (utilisés par les routes API internes)
// ---------------------------------------------------------------------------

export const createCard = (d: { brand: CardBrand; firstname: string; lastname: string; email: string }) => {
  const p = d.brand === 'visa' ? createVisacard(d) : createMastercard(d);
  return p.then((r) => ({
    success: true,
    cardid: r.cardid,
    cardnumber: '',
    cvv: '',
    expiry: '',
    balance: 0,
    message: r.message,
  }));
};

export const fundCard = (d: { brand: CardBrand; cardid: string; email: string; amount: number }) => {
  const p = d.brand === 'visa' ? fundVisacard(d) : fundMastercard(d);
  return p.then((r) => ({ success: r.status === 'success' || !!r.status, message: r.status || '', balance: undefined as number | undefined }));
};

export const blockCard = (d: { brand: CardBrand; cardid: string; email: string }) =>
  d.brand === 'visa' ? blockVisacard(d) : blockMastercard(d);

export const unblockCard = (d: { brand: CardBrand; cardid: string; email: string }) =>
  d.brand === 'visa' ? unblockVisacard(d) : unblockMastercard(d);

export const terminateCard = (d: { brand: CardBrand; cardid: string; email: string }) =>
  d.brand === 'visa' ? terminateVisacard(d) : terminateMastercard(d);

export const getCard = (d: { brand: CardBrand; cardid: string; email: string }) =>
  d.brand === 'visa' ? getVisacard(d) : getMastercard(d);

export const getAllCards = (d: { brand: CardBrand; email: string }) =>
  d.brand === 'visa' ? getAllVisacards(d) : getAllMastercards(d);

// NOTE: la validation 3DS n'est pas documentée publiquement par Pagocards
// (aucun endpoint /approve3ds dans la doc officielle). Le webhook "3ds" fournit
// un statut APPROVED/DECLINED/PENDING — à confirmer avec le support Pagocards
// si une action manuelle de validation est réellement nécessaire côté marchand.

// ---------------------------------------------------------------------------
// Giftcards API
// ---------------------------------------------------------------------------

export const getGiftcards = (params?: { page?: number; limit?: number; search?: string; country?: string; currency?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);
  if (params?.country) qs.set('country', params.country);
  if (params?.currency) qs.set('currency', params.currency);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<PagoGiftcardsList>(`/api/getgiftcards${suffix}`);
};

export const getGiftcardBySku = (sku: string) => get<PagoGiftcard>(`/api/getgiftcard/${encodeURIComponent(sku)}`);

export const getGiftcardExchangeRates = () => get<Record<string, unknown>>('/api/getexchangerates');

// Réponse réelle observée en prod : { success, availability: { availability, detail, delivery_type, ... } }
// — imbriquée sous "availability", pas un booléen "available" à plat comme on l'avait supposé.
export interface PagoSkuAvailability {
  success?: boolean;
  availability?: { availability: boolean; detail?: string; delivery_type?: number; delivery_type_text?: string };
  [key: string]: unknown;
}

export const checkGiftcardSkuAvailability = (sku: string, itemCount: number, price: number) =>
  get<PagoSkuAvailability>(
    `/api/checkskuavailability/${encodeURIComponent(sku)}?item_count=${itemCount}&price=${price}`,
  );

/** La doc officielle envoie publickey/secretkey dans le body pour cet endpoint (en plus des headers). */
export const purchaseGiftcard = (d: { sku: string; quantity: number; amount: number }) =>
  post<PagoGiftcardOrder>('/api/purchasegiftcard', {
    ...d,
    publickey: PUB(),
    secretkey: SEC(),
  });

export const getGiftcardOrder = (referenceCode: string) =>
  get<PagoGiftcardOrder>(`/api/getgiftcardorder/${encodeURIComponent(referenceCode)}`);

export const getGiftcardOrderHistory = (params?: { page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<{ orders: PagoGiftcardOrder[]; [key: string]: unknown }>(`/api/getgiftcardorderhistory${suffix}`);
};

// ---------------------------------------------------------------------------
// Payouts API — USD ACH vers banques US uniquement pour le moment
// ---------------------------------------------------------------------------

export const getPayoutQuote = (d: { to_currency: string; country: string; amount: string }, idempotencyKey?: string) =>
  post<PagoPayoutQuote>('/api/payouts/getpayoutquote', d, idempotencyKey);

export const initializePayout = (
  quoteId: string,
  d: {
    account_type: 'checking' | 'savings';
    account_number: string;
    routing_number: string;
    bank_name: string;
    bank_address: string;
    post_code: string;
    city: string;
    state: string;
    country: string;
    beneficiary: {
      type: 'individual' | 'business';
      account_name: string;
      state: string;
      city: string;
      address: string;
      post_code: string;
    };
  },
  idempotencyKey?: string,
) => post<{ status: string; [key: string]: unknown }>(`/api/payouts/${encodeURIComponent(quoteId)}/initialize`, d, idempotencyKey);

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export const getAdminBalance = () => get<PagoAdminBalance>('/api/admin/balance');

export const getAdminTransactions = (params?: { page_number?: number; per_page?: number; uuid?: string; searchterm?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page_number) qs.set('page_number', String(params.page_number));
  if (params?.per_page) qs.set('per_page', String(params.per_page));
  if (params?.uuid) qs.set('uuid', params.uuid);
  if (params?.searchterm) qs.set('searchterm', params.searchterm);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<PagoAdminTransactions>(`/api/admin/transactions${suffix}`);
};

export const getAdminDeposits = (params?: { page_number?: number; per_page?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page_number) qs.set('page_number', String(params.page_number));
  if (params?.per_page) qs.set('per_page', String(params.per_page));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<PagoAdminDeposits>(`/api/admin/deposits${suffix}`);
};

export const getAllAdminCards = (d?: { brand?: 'visa' | 'master'; per_page?: number }) =>
  post<PagoAdminCards>('/api/admin/allcards', d || {});
