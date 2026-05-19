import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { generatePaymentLink } from '@/lib/payment-gateway';
import { ReloadCardSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!rateLimit(`reload:${user.uid}`, 5, 60000))
      return NextResponse.json({ success: false, error: 'Trop de requêtes.' }, { status: 429 });

    const body = await req.json();
    const parsed = ReloadCardSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { cardId, amount, country } = parsed.data;

    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists) return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });
    const card = cardDoc.data()!;
    if (card.userId !== user.uid) return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });
    if (card.status !== 'active') return NextResponse.json({ success: false, error: 'Carte non active.' }, { status: 400 });

    const txRef = await adminDb.collection('transactions').add({
      userId: user.uid, cardId, type: 'card_reload', amount,
      currency: 'XOF', status: 'pending', createdAt: new Date().toISOString(),
    });

    const { url, pid } = await generatePaymentLink({
      amount,
      description: `Rechargement carte *${card.last4}`,
      transactionId: txRef.id,
      userId: user.uid,
      country,
    });

    await txRef.update({ pid });
    return NextResponse.json({ success: true, data: { url, transactionId: txRef.id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}