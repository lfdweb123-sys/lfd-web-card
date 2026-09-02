import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    let orders: unknown[] = [];
    try {
      const snap = await adminDb.collection('giftcard_orders')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (indexErr) {
      // Index Firestore composite (userId + createdAt) pas encore déployé sur ce projet —
      // on ne casse pas la page pour autant : on refait la requête sans orderBy (pas
      // besoin d'index composite pour une simple égalité) puis on trie côté serveur.
      console.error('giftcard_orders query (avec index) a échoué, fallback sans index :', indexErr);
      const fallbackSnap = await adminDb.collection('giftcard_orders')
        .where('userId', '==', user.uid)
        .limit(50)
        .get();
      orders = fallbackSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as { createdAt?: string }))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    return NextResponse.json({ success: true, data: { orders } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    console.error('GET /api/giftcards/orders a échoué :', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
