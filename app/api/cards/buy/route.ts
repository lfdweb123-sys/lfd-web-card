import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { generatePaymentLink } from '@/lib/payment-gateway';

const CARD_PRICE = Number(process.env.CARD_CREATION_PRICE) || 5000;
const PURCHASE_FEE_RATE = 0.05; // frais mobile money 5% sur chaque achat de carte

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!rateLimit(`buy:${user.uid}`, 3, 60000))
      return NextResponse.json({ success: false, error: 'Trop de requêtes.' }, { status: 429 });

    const body = await req.json();

    // Validation manuelle — plus besoin de BuyCardSchema qui exigeait "method"
    const country = (body.country as string)?.toUpperCase() || 'BJ';
    const brand: 'visa' | 'mastercard' = body.brand === 'mastercard' ? 'mastercard' : 'visa';

    if (!country) {
      return NextResponse.json({ success: false, error: 'Pays requis.' }, { status: 400 });
    }

    const existing = await adminDb.collection('cards')
      .where('userId', '==', user.uid)
      .where('status', 'in', ['active', 'pending', 'frozen'])
      .limit(1).get();
    if (!existing.empty)
      return NextResponse.json({ success: false, error: 'Vous avez déjà une carte active.' }, { status: 400 });

    // ✅ Séparation prix de la carte / frais mobile money (5%)
    const fee = Math.round(CARD_PRICE * PURCHASE_FEE_RATE);
    const total = CARD_PRICE + fee; // montant réel facturé au client via mobile money

    const txRef = await adminDb.collection('transactions').add({
      userId: user.uid, type: 'card_purchase', amount: CARD_PRICE,
      fee, total,
      currency: 'XOF', status: 'pending', brand,
      createdAt: new Date().toISOString(),
    });

    // La passerelle encaisse le total (prix carte + frais mobile money 5%)
    const { url, pid } = await generatePaymentLink({
      amount: total,
      description: `Achat carte ${brand === 'visa' ? 'Visa' : 'Mastercard'} virtuelle LFD WEB CARD`,
      transactionId: txRef.id,
      userId: user.uid,
      country,
      brand,
    });

    await txRef.update({ pid });
    return NextResponse.json({ success: true, data: { url, transactionId: txRef.id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}