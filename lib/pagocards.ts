// lib/pagocards.ts
// ================================================================
// PAGOCARDS API CLIENT — https://pagocards.com/documentation
// Auth: headers "publickey" + "secretkey" (PAS de Bearer token)
// Base URL: https://pagocards.com
// ⚠️ SERVEUR UNIQUEMENT — jamais exposé côté client
// ================================================================

const PAGOCARDS_BASE = 'https://pagocards.com';
const PUB = () => process.env.PAGOCARDS_PUBLIC_KEY!;
const SEC = () => process.env.PAGOCARDS_SECRET_KEY!;

async function pagoPost<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PAGOCARDS_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'publickey': PUB(),
      'secretkey': SEC(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string; error?: string }).message
      || (data as { error?: string }).error
      || `Pagocards HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

async function pagoGet<T = unknown>(endpoint: string): Promise<T> {
  const res = await fetch(`${PAGOCARDS_BASE}${endpoint}`, {
    method: 'GET',
    headers: { 'publickey': PUB(), 'secretkey': SEC() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || `Pagocards HTTP ${res.status}`);
  return data as T;
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export interface PagoCreateCardResponse {
  success: boolean;
  cardid: string;
  cardnumber: string;
  cvv: string;
  expiry: string;   // "MM/YY"
  balance: number;
  message?: string;
}

export interface PagoCardDetails {
  cardid: string;
  cardnumber: string;
  cvv: string;
  expiry: string;
  balance: number;
  status: string;   // "active" | "blocked"
  brand: string;    // "mastercard" | "visa"
  firstname: string;
  lastname: string;
  email: string;
}

export interface PagoFundResponse {
  success: boolean;
  message: string;
  balance?: number;
}

export type CardBrand = 'mastercard' | 'visa';

// ================================================================
// MASTERCARD — /api/mastercard/*
// ================================================================

/** POST /api/mastercard/createcard — Crée une Mastercard virtuelle */
export async function createMastercard(d: {
  firstname: string; lastname: string; email: string; initialload?: number;
}): Promise<PagoCreateCardResponse> {
  return pagoPost('/api/mastercard/createcard', {
    firstname: d.firstname, lastname: d.lastname, email: d.email,
    initialload: d.initialload ?? 0,
  });
}

/** POST /api/mastercard/fundcard — Recharge une Mastercard (frais: $1 + 1%) */
export async function fundMastercard(d: {
  cardid: string; email: string; amount: number;
}): Promise<PagoFundResponse> {
  return pagoPost('/api/mastercard/fundcard', { cardid: d.cardid, email: d.email, amount: d.amount });
}

/** POST /api/mastercard/getcarddetails — Détails d'une Mastercard */
export async function getMastercardDetails(d: {
  email: string; cardid: string;
}): Promise<PagoCardDetails> {
  return pagoPost('/api/mastercard/getcarddetails', { email: d.email, cardid: d.cardid });
}

/** POST /api/mastercard/getallcards — Toutes les Mastercards d'un email */
export async function getAllMastercards(email: string): Promise<PagoCardDetails[]> {
  return pagoPost('/api/mastercard/getallcards', { email });
}

/** POST /api/mastercard/blockdigital — Bloque une Mastercard */
export async function blockMastercard(d: { email: string; cardid: string }): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/mastercard/blockdigital', { email: d.email, cardid: d.cardid });
}

/** POST /api/mastercard/unblockdigital — Débloque une Mastercard */
export async function unblockMastercard(d: { email: string; cardid: string }): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/mastercard/unblockdigital', { email: d.email, cardid: d.cardid });
}

/** POST /api/mastercard/check3ds — Vérifie les transactions 3DS en attente */
export async function check3DS(d: { email: string; cardid: string }): Promise<unknown> {
  return pagoPost('/api/mastercard/check3ds', { email: d.email, cardid: d.cardid });
}

/** POST /api/mastercard/approve3ds — Approuve une transaction 3DS */
export async function approve3DS(d: { email: string; cardid: string; eventId: string }): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/mastercard/approve3ds', { email: d.email, cardid: d.cardid, eventId: d.eventId });
}

/** POST /api/mastercard/checkwallet — OTP pour Google Pay / Apple Pay */
export async function checkWallet(d: { email: string; cardid: string }): Promise<{ otp: string }> {
  return pagoPost('/api/mastercard/checkwallet', { email: d.email, cardid: d.cardid });
}

/** POST /api/mastercard/spendcontrol — Ajouter un contrôle de dépenses */
export async function setSpendControl(d: {
  email: string; cardid: string; description: string;
  type: 'purchase' | 'blockedMcc'; period: 'daily' | 'monthly' | 'yearly'; limit: number;
}): Promise<{ success: boolean; controlid: string }> {
  return pagoPost('/api/mastercard/spendcontrol', d);
}

/** POST /api/mastercard/deletespendcontrol — Supprimer un contrôle de dépenses */
export async function deleteSpendControl(d: {
  email: string; cardid: string; controlid: string;
}): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/mastercard/deletespendcontrol', d);
}

/** POST /api/mastercard/createaddon — Carte addon liée à une carte principale */
export async function createAddonCard(d: {
  email: string; firstname: string; lastname: string; cardid: string;
}): Promise<PagoCreateCardResponse> {
  return pagoPost('/api/mastercard/createaddon', d);
}

// ================================================================
// VISA — /api/visacard/*
// ⚠️ Initial loading de $3 obligatoire à la création
// ================================================================

/** POST /api/visacard/createcard — Crée une Visacard virtuelle (frais: $3 initial) */
export async function createVisacard(d: {
  firstname: string; lastname: string; email: string;
}): Promise<PagoCreateCardResponse> {
  return pagoPost('/api/visacard/createcard', {
    firstname: d.firstname, lastname: d.lastname, email: d.email,
  });
}

/** POST /api/visacard/fundcard — Recharge une Visacard (frais: $1 + 1%) */
export async function fundVisacard(d: {
  cardid: string; email: string; amount: number;
}): Promise<PagoFundResponse> {
  return pagoPost('/api/visacard/fundcard', { cardid: d.cardid, email: d.email, amount: d.amount });
}

/** POST /api/visacard/getcard — Détails d'une Visacard */
export async function getVisacardDetails(d: { email: string; cardid: string }): Promise<PagoCardDetails> {
  return pagoPost('/api/visacard/getcard', { email: d.email, cardid: d.cardid });
}

/** POST /api/visacard/getallcards — Toutes les Visacards d'un email */
export async function getAllVisacards(email: string): Promise<PagoCardDetails[]> {
  return pagoPost('/api/visacard/getallcards', { email });
}

/** POST /api/visacard/blockcard — Bloque une Visacard */
export async function blockVisacard(d: { email: string; cardid: string }): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/visacard/blockcard', { email: d.email, cardid: d.cardid });
}

/** POST /api/visacard/unblockcard — Débloque une Visacard */
export async function unblockVisacard(d: { email: string; cardid: string }): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/visacard/unblockcard', { email: d.email, cardid: d.cardid });
}

/** POST /api/terminate — Résilie une carte (Visa ou Mastercard) */
export async function terminateCard(d: { cardid: string; email: string }): Promise<{ success: boolean; message: string }> {
  return pagoPost('/api/terminate', { cardid: d.cardid, email: d.email });
}

// ================================================================
// HELPERS UNIFIÉS (pour le webhook LFD)
// ================================================================

/** Créer une carte selon la marque choisie */
export async function createCard(d: {
  brand: CardBrand; firstname: string; lastname: string; email: string; initialload?: number;
}): Promise<PagoCreateCardResponse> {
  return d.brand === 'visa'
    ? createVisacard({ firstname: d.firstname, lastname: d.lastname, email: d.email })
    : createMastercard({ firstname: d.firstname, lastname: d.lastname, email: d.email, initialload: d.initialload ?? 0 });
}

/** Recharger une carte selon la marque */
export async function fundCard(d: {
  brand: CardBrand; cardid: string; email: string; amount: number;
}): Promise<PagoFundResponse> {
  return d.brand === 'visa'
    ? fundVisacard({ cardid: d.cardid, email: d.email, amount: d.amount })
    : fundMastercard({ cardid: d.cardid, email: d.email, amount: d.amount });
}

/** Bloquer une carte selon la marque */
export async function blockCard(d: {
  brand: CardBrand; cardid: string; email: string;
}): Promise<{ success: boolean; message: string }> {
  return d.brand === 'visa'
    ? blockVisacard({ email: d.email, cardid: d.cardid })
    : blockMastercard({ email: d.email, cardid: d.cardid });
}

/** Débloquer une carte selon la marque */
export async function unblockCard(d: {
  brand: CardBrand; cardid: string; email: string;
}): Promise<{ success: boolean; message: string }> {
  return d.brand === 'visa'
    ? unblockVisacard({ email: d.email, cardid: d.cardid })
    : unblockMastercard({ email: d.email, cardid: d.cardid });
}

/** Obtenir les détails d'une carte selon la marque */
export async function getCardDetails(d: {
  brand: CardBrand; cardid: string; email: string;
}): Promise<PagoCardDetails> {
  return d.brand === 'visa'
    ? getVisacardDetails({ email: d.email, cardid: d.cardid })
    : getMastercardDetails({ email: d.email, cardid: d.cardid });
}
