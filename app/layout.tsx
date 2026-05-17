// app/layout.tsx
import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'VCardAfrica — Votre carte virtuelle internationale',
  description: 'Obtenez votre carte virtuelle Visa/Mastercard en quelques minutes. Payez partout dans le monde depuis l\'Afrique.',
  keywords: 'carte virtuelle, visa, mastercard, afrique, benin, paiement en ligne, mobile money',
  openGraph: {
    title: 'VCardAfrica — Carte virtuelle internationale',
    description: 'Payez partout dans le monde avec votre carte virtuelle.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-surface-bg text-text-primary font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
