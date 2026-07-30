/* eslint-disable no-undef */
// public/firebase-messaging-sw.js
// Service worker de notifications push (Firebase Cloud Messaging) ET service worker
// principal de la PWA (installabilité + support hors-ligne).
//
// Stratégie hors-ligne :
// - Les pages publiques/marketing (accueil, connexion, inscription, comparatif, légal)
//   sont pré-mises en cache à l'installation et servies en secours si le réseau échoue.
// - Les pages authentifiées (dashboard, profil, admin, KYC) restent toujours "réseau
//   d'abord" : on ne sert JAMAIS de version en cache de données financières/personnelles
//   pour éviter d'afficher un solde ou des infos périmées ou celles d'un autre compte
//   sur un appareil partagé. Si le réseau échoue sur ces pages, on affiche /offline.
// - Les appels /api/* ne sont jamais mis en cache : ils doivent toujours réussir ou
//   échouer proprement, jamais renvoyer une réponse périmée.

const CACHE_NAME = 'lfd-web-card-v1';
const PRECACHE_URLS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/reset',
  '/comparaison',
  '/legal/terms',
  '/legal/privacy',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // ne bloque jamais l'installation si une URL échoue
      .finally(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // jamais toucher aux POST/PATCH/etc.

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // laisser passer les ressources externes (Firebase, polices, etc.)
  if (url.pathname.startsWith('/api/')) return; // jamais mettre en cache les appels API

  // Navigation (changement de page)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // On ne met en cache que les pages publiques précachées, jamais les pages
          // authentifiées (dashboard/profil/admin/kyc) qui contiennent des données
          // personnelles/financières.
          const isPublicPage = PRECACHE_URLS.includes(url.pathname);
          if (isPublicPage && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline');
          return offline || Response.error();
        })
    );
    return;
  }

  // Assets statiques (JS/CSS/images/_next) : cache d'abord, réseau en secours
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'LFD WEB CARD';
  const body = payload.notification?.body || '';
  const url = payload.fcmOptions?.link || payload.data?.url || '/dashboard';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
