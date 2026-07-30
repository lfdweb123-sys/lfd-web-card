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

    // ✅ Séparation montant carte / frais plateforme
    const fee = Math.round(amount * 0.05);  // frais 5% → ton wallet
    const total = amount + fee;             // montant réel facturé au client

    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists)
      return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });
    const card = cardDoc.data()!;
    if (card.userId !== user.uid)
      return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });
    if (card.status !== 'active')
      return NextResponse.json({ success: false, error: 'Carte non active.' }, { status: 400 });

    // ✅ amount = montant carte (→ Pagocards via webhook)
    // ✅ fee    = frais plateforme (→ loggés dans platform_revenue via webhook)
    // ✅ total  = ce que la passerelle encaisse réellement
    const txRef = await adminDb.collection('transactions').add({
      userId: user.uid,
      cardId,
      type: 'card_reload',
      amount,   // montant carte uniquement
      fee,      // frais plateforme 5%
      total,    // total client (amount + fee)
      currency: 'XOF',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // La passerelle encaisse le total (amount + fee)
    const { url, pid } = await generatePaymentLink({
      amount: total,
      description: `Rechargement carte *${card.last4}`,
      transactionId: txRef.id,
      userId: user.uid,
      country,
    });

    await txRef.update({ pid });
    return NextResponse.json({ success: true, data: { url, transactionId: txRef.id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED')
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}