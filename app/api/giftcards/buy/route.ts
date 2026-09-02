import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { checkGiftcardSkuAvailability, getGiftcardBySku } from '@/lib/pagocards';
import { generatePaymentLink } from '@/lib/payment-gateway';
import { BuyGiftcardSchema } from '@/lib/validations';

const XOF_RATE = 600; // taux interne fixe USD -> XOF, cohérent avec le reste de la plateforme
const FEE_RATE = 0.05; // même frais mobile money que sur les cartes

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!rateLimit(`giftcard-buy:${user.uid}`, 5, 60000))
      return NextResponse.json({ success: false, error: 'Trop de requêtes.' }, { status: 429 });

    const parsed = BuyGiftcardSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const { sku, title, quantity, amountUSD, country } = parsed.data;

    // On ne gère pas encore la conversion FX pour les cartes cadeaux libellées dans une devise
    // autre que USD (la doc Pagocards documente un endpoint getexchangerates dédié à ce cas,
    // qu'on n'a pas encore intégré) — on refuse donc explicitement plutôt que de facturer un
    // montant FCFA calculé sur un mauvais taux.
    const giftcard = await getGiftcardBySku(sku);
    if (giftcard.currency && giftcard.currency.toUpperCase() !== 'USD')
      return NextResponse.json({ success: false, error: 'Cette carte cadeau est libellée dans une devise non prise en charge pour le moment.' }, { status: 400 });

    // Vérifie en direct auprès de Pagocards que cette combinaison sku/quantité/prix est disponible
    // avant d'encaisser le client (catalogue et prix peuvent changer côté fournisseur).
    const availability = await checkGiftcardSkuAvailability(sku, quantity, amountUSD);
    if (!availability.available)
      return NextResponse.json({ success: false, error: 'Cette carte cadeau n\'est plus disponible à ce prix. Actualisez le catalogue.' }, { status: 400 });

    const totalUSD = parseFloat((amountUSD * quantity).toFixed(2));
    const amountXOF = Math.round(totalUSD * XOF_RATE);
    const fee = Math.round(amountXOF * FEE_RATE);
    const total = amountXOF + fee; // montant réel facturé au client via mobile money

    const txRef = await adminDb.collection('transactions').add({
      userId: user.uid, type: 'giftcard_purchase',
      sku, title, quantity, amountUSD, totalUSD,
      amount: amountXOF, fee, total,
      currency: 'XOF', status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const { url, pid } = await generatePaymentLink({
      amount: total,
      description: `Carte cadeau ${title} x${quantity} — LFD WEB CARD`,
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
