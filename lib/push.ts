// lib/push.ts — SERVEUR UNIQUEMENT
// Envoie des notifications push (web + mobile) via Firebase Cloud Messaging,
// en s'appuyant sur les tokens FCM enregistrés par chaque utilisateur dans
// la collection `fcm_tokens`. Ne bloque jamais le flux appelant en cas d'échec.

import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export interface PushPayload {
  title: string;
  body: string;
  /** Données additionnelles, utilisées côté client pour router au clic (ex: { url: '/dashboard' }) */
  data?: Record<string, string>;
}

/** Envoie une notification push à tous les appareils enregistrés d'un utilisateur. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!userId) return;
  try {
    const snap = await adminDb.collection('fcm_tokens').where('userId', '==', userId).get();
    if (snap.empty) return;

    const tokens = snap.docs.map(d => d.data().token as string).filter(Boolean);
    if (tokens.length === 0) return;

    const res = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      webpush: {
        notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-96.png' },
        fcmOptions: { link: payload.data?.url || '/dashboard' },
      },
    });

    // Nettoyage des tokens invalides/expirés pour ne pas les re-solliciter inutilement
    const invalid: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          invalid.push(tokens[i]);
        }
      }
    });
    if (invalid.length) {
      const toDelete = snap.docs.filter(d => invalid.includes(d.data().token));
      await Promise.all(toDelete.map(d => d.ref.delete()));
    }
  } catch (err) {
    // Le push ne doit jamais faire échouer le flux métier appelant (achat, recharge, KYC...)
    console.error('sendPushToUser error:', err);
  }
}
