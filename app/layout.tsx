import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: 'LFD WEB CARD — Carte virtuelle internationale',
  description: "Obtenez votre carte virtuelle Visa/Mastercard en quelques minutes. Payez partout dans le monde depuis l'Afrique.",
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}