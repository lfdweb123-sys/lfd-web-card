// lib/validations.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  displayName: z.string().min(2, 'Nom trop court').max(50),
  country: z.string().min(2).max(3),
  phone: z.string().optional(),
});

export const BuyCardSchema = z.object({
  country: z.string().min(2).max(3),
  method: z.string().min(3),
});

export const ReloadCardSchema = z.object({
  cardId: z.string().min(1),
  amount: z.number()
    .min(Number(process.env.CARD_RELOAD_MIN) || 1000, 'Montant minimum non atteint')
    .max(Number(process.env.CARD_RELOAD_MAX) || 500000, 'Montant maximum dépassé'),
  country: z.string().min(2).max(3),
  method: z.string().min(3),
});

export const FreezeCardSchema = z.object({
  cardId: z.string().min(1),
  action: z.enum(['freeze', 'unfreeze']),
});
