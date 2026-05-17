// lib/payment-gateway.ts
// ================================================================
// LFD PAYMENT GATEWAY CLIENT
// https://paymentgateway.lfdweb.com
// Tous les appels sont SERVEUR UNIQUEMENT
// ================================================================

const GATEWAY_BASE_URL = process.env.GATEWAY_BASE_URL || 'https://paymentgateway.lfdweb.com';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY!;

// ----------------------------------------------------------------
// Générer un lien de paiement
// ----------------------------------------------------------------
export async function generatePaymentLink(data: {
  amount: number;
  description: string;
  transactionId: string;
  userId: string;
  country?: string;
  method?: string;
}) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/gateway/generate-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': GATEWAY_API_KEY,
    },
    body: JSON.stringify({
      amount: data.amount,
      description: data.description,
      country: data.country || 'bj',
      method: data.method || 'mtn_money',
      metadata: {
        transactionId: data.transactionId, // ✅ Clé fiable pour le webhook
        userId: data.userId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Payment link generation failed');

  return { url: result.url as string, pid: result.pid as string };
}

// ----------------------------------------------------------------
// Vérifier le statut d'un paiement
// ----------------------------------------------------------------
export async function verifyPayment(transactionId: string) {
  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/gateway/verify/${transactionId}`,
    { headers: { 'x-api-key': GATEWAY_API_KEY } }
  );
  if (!response.ok) throw new Error('Verification failed');
  return response.json();
}
