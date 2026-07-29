'use client';
import { useEffect } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Enregistre le service worker au chargement de l'app (nécessaire pour l'installabilité
 * PWA), indépendamment de la permission de notification qui est demandée séparément
 * via NotificationPrompt. Ne fait rien côté serveur (SSR) ni sur navigateurs incompatibles.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const qs = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
    navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`, { scope: '/' }).catch(() => {
      // Installation silencieuse — on ne bloque jamais le rendu de l'app pour ça.
    });
  }, []);
  return null;
}
