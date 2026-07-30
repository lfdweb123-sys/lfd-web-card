export type UserRole = 'user' | 'admin' | 'referrer';
export type CardStatus = 'pending' | 'active' | 'frozen' | 'terminated';
export type TransactionType = 'card_purchase' | 'card_reload' | 'card_withdrawal' | 'refund';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'error' | 'pending_payout' | 'completed';
export type CardBrand = 'mastercard' | 'visa';

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
    | 'withdrawal_initiated' | 'withdrawal_completed' | string;
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
  promoCode: string;
  commissionPerReload: number; // en FCFA
  totalReferred: number;
  totalEarningsXOF: number;
  active: boolean;
  createdAt: string;
}

export interface ReferralEarning {
  id: string;
  referrerId: string;
  referredUserId: string;
  transactionId: string;
  amountXOF: number;
  createdAt: string;
}
