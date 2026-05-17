// types/index.ts

export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  country: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

export type CardStatus = 'pending' | 'active' | 'frozen' | 'terminated';

export interface VirtualCard {
  id: string;
  userId: string;
  pagocardsCardId: string;
  last4: string;
  brand: 'visa' | 'mastercard';
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  currency: string;
  balance: number;
  status: CardStatus;
  createdAt: string;
}

export type TransactionType = 'card_purchase' | 'card_reload' | 'refund';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  cardId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  pid?: string;
  pagocardsRef?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  completedAt?: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaymentLinkResponse {
  url: string;
  pid: string;
  transactionId: string;
}
