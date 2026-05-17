// app/api/cards/buy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { generatePaymentLink } from '@/lib/payment-gateway';
import { BuyCardSchema } from '@/lib/validations';

const CARD_PRICE = Number(process.env.CARD_CREATION_PRICE) || 5000;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Rate limit: 3 tentatives par minute
    if (!rateLimit(`buy-card:${user.uid}`, 3, 60_000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Attendez 1 minute.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = BuyCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { country, method } = parsed.data;

    // Vérifier que l'utilisateur n'a pas déjà une carte active
    const existingCard = await adminDb.collection('cards')
      .where('userId', '==', user.uid)
      .where('status', 'in', ['active', 'pending', 'frozen'])
      .limit(1)
      .get();

    if (!existingCard.empty) {
      return NextResponse.json({ success: false, error: 'Vous avez déjà une carte active.' }, { status: 400 });
    }

    // Étape 1: Créer la transaction en base AVANT le lien de paiement
    const txRef = await adminDb.collection('transactions').add({
      userId: user.uid,
      type: 'card_purchase',
      amount: CARD_PRICE,
      currency: 'XOF',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Étape 2: Générer le lien avec metadata.transactionId
    const { url, pid } = await generatePaymentLink({
      amount: CARD_PRICE,
      description: 'Achat carte virtuelle',
      transactionId: txRef.id,
      userId: user.uid,
      country,
      method,
    });

    // Étape 3: Stocker le pid
    await txRef.update({ pid });

    return NextResponse.json({ success: true, data: { url, transactionId: txRef.id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
