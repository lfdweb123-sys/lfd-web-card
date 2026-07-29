// lib/card-themes.ts
// Thèmes de personnalisation pour le fond des cartes virtuelles.
// Utilisé côté client (aperçu + sélection) et côté serveur (validation).

export interface CardTheme {
  id: string;
  name: string;
  gradient: string;
}

export const CARD_THEMES: CardTheme[] = [
  { id: 'midnight', name: 'Minuit', gradient: 'linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #0f2744 100%)' },
  { id: 'graphite', name: 'Graphite', gradient: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)' },
  { id: 'royal', name: 'Royal', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 65%, #1e1b4b 100%)' },
  { id: 'emerald', name: 'Émeraude', gradient: 'linear-gradient(135deg, #022c22 0%, #059669 65%, #022c22 100%)' },
  { id: 'sunset', name: 'Coucher de soleil', gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 65%, #7c2d12 100%)' },
  { id: 'rose', name: 'Rose', gradient: 'linear-gradient(135deg, #500724 0%, #be185d 65%, #500724 100%)' },
  { id: 'ocean', name: 'Océan', gradient: 'linear-gradient(135deg, #082f49 0%, #0284c7 65%, #082f49 100%)' },
  { id: 'noir', name: 'Noir', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #262626 100%)' },
];

export const DEFAULT_CARD_THEME = 'midnight';
export const CARD_THEME_IDS = CARD_THEMES.map(t => t.id);

export function getCardTheme(id?: string): CardTheme {
  return CARD_THEMES.find(t => t.id === id) || CARD_THEMES[0];
}
