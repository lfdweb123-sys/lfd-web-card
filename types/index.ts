export type UserRole = 'user' | 'admin' | 'referrer';
export type CardStatus = 'pending' | 'active' | 'frozen' | 'terminated';
export type TransactionType = 'card_purchase' | 'card_reload' | 'card_withdrawal' | 'giftcard_purchase' | 'refund';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'error' | 'pending_payout' | 'completed';
export type CardBrand = 'mastercard' | 'visa';
export type CardApiFamily = 'classic' | '4xxbins';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  country: string;
  status: 'active' | 'suspended';
  createdAt: string;
  referredBy?: string;
  kycRequired?: boolean;
}

export interface VirtualCard {
  id: string;
  userId: string;
  pagocardsCardId: string;
  last4: string;
  brand: CardBrand;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  email: string;
  currency: string;
  balance: number;
  status: CardStatus;
  createdAt: string;
  theme?: string;
  apiFamily?: CardApiFamily; // 'classic' = EURO-MASTER/Visacard historique, '4xxbins' = nouvelle gamme (493BIN/536BIN)
  productCode?: string; // ex. 'us_493_visa_bin' | '536_master', uniquement si apiFamily === '4xxbins'
  spendControls?: { // Visacard classique uniquement
    singleTransaction?: number | null;
    daily?: number | null;
    weekly?: number | null;
    monthly?: number | null;
    blockedCategories?: string[];
    updatedAt?: string;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  cardId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  pid?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'wallet_activation' | '3ds_required' | 'card_created' | 'card_reloaded'
    | 'payment_failed' | 'kyc_approved' | 'kyc_rejected'
    | 'withdrawal_initiated' | 'withdrawal_completed' | 'giftcard_ready' | string;
  title: string;
  message: string;
  read: boolean;
  requiresAction?: boolean;
  eventId?: string;
  eventTargetId?: string;
  cardId?: string;
  createdAt: string;
}

export interface Referrer {
  id: string; // = Firebase Auth uid
  name: string;
  email: string;
  promoCode: string; // usage interne (saisie manuelle, dashboard) — jamais exposé dans une URL
  publicId?: string; // UUID public exposé dans les liens de parrainage (?ref=uuid)
  commissionPerReload: number; // en FCFA
  totalReferred: number;
  totalEarningsXOF: number;
  unpaidXOF: number;
  active: boolean;
  createdAt: string;
}

export interface ReferralEarning {
  id: string;
  referrerId: string;
  referredUserId: string;
  transactionId: string;
  amountXOF: number;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
}

export interface GiftcardOrder {
  id: string;
  userId: string;
  transactionId: string;
  sku: string;
  title: string;
  quantity: number;
  amountUSD: number; // prix unitaire
  totalUSD: number;
  amountXOF: number;
  status: 'pending' | 'success' | 'failed';
  referenceCode?: string;
  shareLink?: string; // lien de révélation du code cadeau, fourni par Pagocards
  createdAt: string;
}
