// lib/giftcard-utils.ts — partagé client/serveur, aucune dépendance à des secrets.
// La doc Pagocards ne publie aucun exemple JSON pour la réponse du catalogue (getgiftcards) —
// on a confirmé la forme réelle via une capture d'écran de leur propre interface "Buy Giftcards"
// (colonnes IMAGE / TITLE / MIN PRICE / MAX PRICE / CURRENCY / REGIONS). On lit donc plusieurs
// variantes plausibles de nom de champ (camelCase / snake_case) pour rester robuste si l'API
// utilise une casse différente de ce que montre l'UI.

export interface GiftcardLike {
  sku: string;
  title: string;
  currency: string;
  [key: string]: unknown;
}

function firstNumber(card: GiftcardLike, keys: string[]): number | null {
  for (const k of keys) {
    const v = card[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export function getGiftcardPriceRange(card: GiftcardLike): { min: number; max: number } {
  const min = firstNumber(card, ['minPrice', 'min_price', 'minprice', 'min']);
  const max = firstNumber(card, ['maxPrice', 'max_price', 'maxprice', 'max']);
  // Repli raisonnable si le catalogue ne renvoie ni min ni max pour ce SKU.
  return { min: min ?? 1, max: max ?? (max === null && min !== null ? min! : 500) };
}

export function getGiftcardImage(card: GiftcardLike): string | null {
  const raw = (card.image || card.imageUrl || card.image_url || card.logo || card.thumbnail) as string | undefined;
  if (!raw || raw.trim() === '' || raw.trim().toUpperCase() === 'N/A') return null;
  return raw;
}

export function getGiftcardRegion(card: GiftcardLike): string {
  const regions = card.regions;
  if (Array.isArray(regions)) return regions.join(', ');
  if (typeof regions === 'string' && regions) return regions;
  if (typeof card.region === 'string' && card.region) return card.region;
  if (typeof card.country === 'string' && card.country) return card.country;
  return '';
}
