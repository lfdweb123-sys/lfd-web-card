// lib/payment-gateway.ts — SERVEUR UNIQUEMENT
const GW = process.env.GATEWAY_BASE_URL || 'https://paymentgateway.lfdweb.com';
const KEY = () => process.env.GATEWAY_API_KEY!;
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://card.lfdweb.com';

export async function generatePaymentLink(d: {
  amount: number;
  description: string;
  transactionId: string;
  userId: string;
  country?: string;
  brand?: 'visa' | 'mastercard';
}) {
  const res = await fetch(`${GW}/api/gateway/generate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY() },
    body: JSON.stringify({
      amount: d.amount,
      description: d.description,
      country: (d.country || 'bj').toLowerCase(),
      origin: ORIGIN,           // ✅ OBLIGATOIRE pour recevoir les webhooks
      sendWebhook: true,        // ✅ OBLIGATOIRE pour recevoir les webhooks
      metadata: {
        transactionId: d.transactionId,   // ✅ Retourné dans le webhook
        uid: d.userId,
        brand: d.brand || 'visa',
        origin: ORIGIN,                   // backup dans metadata
        sendWebhook: true,                // backup dans metadata
      },
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Payment link failed');
  return { url: data.url as string, pid: data.pid as string };
}

export async function verifyPayment(id: string) {
  const res = await fetch(`${GW}/api/gateway/verify/${id}`, {
    headers: { 'x-api-key': KEY() },
  });
  return res.json();
}