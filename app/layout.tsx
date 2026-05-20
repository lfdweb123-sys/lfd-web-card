import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  // ── Basics ──────────────────────────────────────────────────────
  title: {
    default: 'LFD WEB CARD — Carte virtuelle internationale',
    template: '%s | LFD WEB CARD',
  },
  description:
    "Obtenez votre carte virtuelle Visa ou Mastercard en quelques minutes. Payez partout dans le monde depuis l'Afrique avec LFD WEB CARD.",
  keywords: [
    'carte virtuelle',
    'carte virtuelle Afrique',
    'carte Visa virtuelle',
    'carte Mastercard virtuelle',
    'paiement international Afrique',
    'carte virtuelle Bénin',
    'carte virtuelle FCFA',
    'Mobile Money carte virtuelle',
    'LFD WEB CARD',
    'payer en ligne Afrique',
  ],
  authors: [{ name: 'LFD WEB CARD', url: 'https://card.lfdweb.com' }],
  creator: 'LFD WEB CARD',
  publisher: 'LFD WEB CARD',
  category: 'finance',

  // ── Canonical & robots ──────────────────────────────────────────
  metadataBase: new URL('https://card.lfdweb.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph ──────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://card.lfdweb.com',
    siteName: 'LFD WEB CARD',
    title: 'LFD WEB CARD — Carte virtuelle internationale',
    description:
      "Obtenez votre carte virtuelle Visa ou Mastercard en quelques minutes. Payez partout dans le monde depuis l'Afrique.",
  },

  // ── Twitter / X ─────────────────────────────────────────────────
  twitter: {
    card: 'summary',
    title: 'LFD WEB CARD — Carte virtuelle internationale',
    description:
      "Obtenez votre carte virtuelle Visa ou Mastercard en quelques minutes depuis l'Afrique.",
  },

  // ── Icons ────────────────────────────────────────────────────────
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    shortcut: '/favicon.svg',
  },

  // ── Web app ──────────────────────────────────────────────────────
  applicationName: 'LFD WEB CARD',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LFD WEB CARD',
  },

  // ── Thème ────────────────────────────────────────────────────────
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F97316' },
    { media: '(prefers-color-scheme: dark)',  color: '#F97316' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}