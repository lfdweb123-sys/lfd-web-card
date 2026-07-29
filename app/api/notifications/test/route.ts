import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { sendPushToUser } from '@/lib/push';

/**
 * Envoie une notification de simulation à l'utilisateur authentifié (à lui-même
 * uniquement — jamais à un autre compte). Utile pour vérifier que la chaîne
 * permission navigateur -> token FCM -> envoi serveur fonctionne bien de bout en bout.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await sendPushToUser(user.uid, {
      title: '🔔 Notification de test',
      body: 'Si vous voyez ceci, les notifications push fonctionnent correctement.',
      data: { url: '/dashboard' },
    });
    return NextResponse.json({ success: true, message: 'Notification de test envoyée (si un appareil est enregistré).' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
