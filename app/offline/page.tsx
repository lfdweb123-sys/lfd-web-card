'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function OfflinePage() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="min-h-screen stripes-light flex flex-col items-center justify-center px-5 text-center">
      <div className="mb-8"><Logo /></div>
      <div className="w-16 h-16 bg-surface-muted rounded-3xl flex items-center justify-center mb-6">
        <WifiOff size={26} className="text-ink-secondary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Vous êtes hors ligne</h1>
      <p className="text-ink-secondary text-sm max-w-sm mb-8 leading-relaxed">
        Cette page nécessite une connexion internet. Vérifiez votre connexion Wi-Fi ou vos données mobiles, puis réessayez.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary py-3 px-6"
      >
        <RefreshCw size={16} /> Réessayer
      </button>
      <Link href="/" className="text-ink-muted text-sm mt-5 hover:text-ink-primary transition-colors">
        Retour à l'accueil
      </Link>
      {online && (
        <p className="text-brand-green text-xs mt-6">Connexion rétablie — rechargez la page.</p>
      )}
    </div>
  );
}
