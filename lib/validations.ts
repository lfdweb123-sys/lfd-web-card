import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  displayName: z.string().min(2).max(50),
  country: z.string().min(2).max(3),
  phone: z.string().optional(),
  promoCode: z.string().max(30).optional(),
});

export const BuyCardSchema = z.object({
  country: z.string().min(2).max(3),
  brand: z.enum(['mastercard', 'visa']).default('visa'),
  initialLoad: z.number().min(30000).max(500000).optional(),
});

export const ReloadCardSchema = z.object({
  cardId: z.string().min(1),
  amount: z.number().min(30000).max(500000),
  country: z.string().min(2).max(3),
});

export const FreezeCardSchema = z.object({
  cardId: z.string().min(1),
  action: z.enum(['freeze', 'unfreeze']),
});

export const BuyGiftcardSchema = z.object({
  // Le catalogue Pagocards renvoie parfois le sku comme un nombre JSON (ex. 4402)
  // et non une chaîne comme le documente son propre schéma — on l'accepte dans
  // les deux formats et on le normalise en chaîne pour le reste du flux.
  sku: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1)),
  // Le catalogue Pagocards renvoie parfois des titres avec des espaces/tabulations
  // parasites en tête (ex. "\tTJ Maxx") — on les nettoie avant stockage/affichage.
  title: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(10),
  amountUSD: z.number().min(1).max(500), // prix unitaire en USD
  country: z.string().min(2).max(3),
});