'use client';
// lib/messaging.ts — CLIENT UNIQUEMENT
// Gère l'activation des notifications push : permission navigateur, enregistrement
// du service worker, récupération et sauvegarde du token FCM, écoute des messages
// reçus au premier plan (app ouverte).

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import app from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function registerSw(): Promise<ServiceWorkerRegistration> {
  const qs = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
  // On (ré)enregistre systématiquement pour garder la config embarquée dans l'URL à jour.
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`, { scope: '/' });
}

let messagingInstance: Messaging | null = null;
function getMessagingInstance(): Messaging {
  if (!messagingInstance) messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Demande la permission de notification à l'utilisateur, enregistre le service worker,
 * récupère le token FCM et le sauvegarde côté serveur pour son compte.
 * Retourne le token si tout s'est bien passé, sinon null.
 */
export async function enablePushNotifications(idToken: string): Promise<string | null> {
  if (!isPushSupported() || !VAPID_KEY) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await registerSw();
  const token = await getToken(getMessagingInstance(), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) return null;

  await fetch('/api/notifications/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ token, platform: 'web' }),
  });

  return token;
}

/** Écoute les notifications reçues pendant que l'app est ouverte au premier plan. */
export function listenForegroundMessages(onMessageReceived: (title: string, body: string, url?: string) => void) {
  if (!isPushSupported()) return () => {};
  try {
    const unsubscribe = onMessage(getMessagingInstance(), (payload) => {
      onMessageReceived(
        payload.notification?.title || 'LFD WEB CARD',
        payload.notification?.body || '',
        payload.data?.url,
      );
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}
