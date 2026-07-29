export type UserRole = 'user' | 'admin';
export type CardStatus = 'pending' | 'active' | 'frozen' | 'terminated';
export type TransactionType = 'card_purchase' | 'card_reload' | 'refund';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'error';
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
  type: 'wallet_activation' | '3ds_required' | 'card_created' | 'card_reloaded';
  title: string;
  message: string;
  read: boolean;
  requiresAction?: boolean;
  eventId?: string;
  eventTargetId?: string;
  cardId?: string;
  createdAt: string;
}
