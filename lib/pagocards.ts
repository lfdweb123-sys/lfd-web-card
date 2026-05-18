// lib/pagocards.ts — SERVEUR UNIQUEMENT
// Auth: headers publickey + secretkey (doc officielle pagocards.com)

const BASE = 'https://pagocards.com';
const PUB = () => process.env.PAGOCARDS_PUBLIC_KEY!;
const SEC = () => process.env.PAGOCARDS_SECRET_KEY!;

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', publickey: PUB(), secretkey: SEC() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || `Pagocards ${res.status}`);
  return data as T;
}

export interface PagoCard { success: boolean; cardid: string; cardnumber: string; cvv: string; expiry: string; balance: number; message?: string; }
export interface PagoFund { success: boolean; message: string; balance?: number; }
export type CardBrand = 'mastercard' | 'visa';

// Mastercard
export const createMastercard = (d: { firstname: string; lastname: string; email: string; initialload?: number }) =>
  post<PagoCard>('/api/mastercard/createcard', { ...d, initialload: d.initialload ?? 0 });

export const fundMastercard = (d: { cardid: string; email: string; amount: number }) =>
  post<PagoFund>('/api/mastercard/fundcard', d);

export const blockMastercard = (d: { email: string; cardid: string }) =>
  post<{ success: boolean; message: string }>('/api/mastercard/blockdigital', d);

export const unblockMastercard = (d: { email: string; cardid: string }) =>
  post<{ success: boolean; message: string }>('/api/mastercard/unblockdigital', d);

export const approve3DS = (d: { email: string; cardid: string; eventId: string }) =>
  post<{ success: boolean; message: string }>('/api/mastercard/approve3ds', d);

// Visa
export const createVisacard = (d: { firstname: string; lastname: string; email: string }) =>
  post<PagoCard>('/api/visacard/createcard', d);

export const fundVisacard = (d: { cardid: string; email: string; amount: number }) =>
  post<PagoFund>('/api/visacard/fundcard', d);

export const blockVisacard = (d: { email: string; cardid: string }) =>
  post<{ success: boolean; message: string }>('/api/visacard/blockcard', d);

export const unblockVisacard = (d: { email: string; cardid: string }) =>
  post<{ success: boolean; message: string }>('/api/visacard/unblockcard', d);

// Helpers unifiés
export const createCard = (d: { brand: CardBrand; firstname: string; lastname: string; email: string; initialload?: number }) =>
  d.brand === 'visa' ? createVisacard(d) : createMastercard(d);

export const fundCard = (d: { brand: CardBrand; cardid: string; email: string; amount: number }) =>
  d.brand === 'visa' ? fundVisacard(d) : fundMastercard(d);

export const blockCard = (d: { brand: CardBrand; cardid: string; email: string }) =>
  d.brand === 'visa' ? blockVisacard({ email: d.email, cardid: d.cardid }) : blockMastercard({ email: d.email, cardid: d.cardid });

export const unblockCard = (d: { brand: CardBrand; cardid: string; email: string }) =>
  d.brand === 'visa' ? unblockVisacard({ email: d.email, cardid: d.cardid }) : unblockMastercard({ email: d.email, cardid: d.cardid });
