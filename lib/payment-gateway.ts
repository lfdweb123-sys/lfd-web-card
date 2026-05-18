const GW = process.env.GATEWAY_BASE_URL || 'https://paymentgateway.lfdweb.com';
const KEY = () => process.env.GATEWAY_API_KEY!;

export async function generatePaymentLink(d: {
  amount: number; description: string; transactionId: string;
  userId: string; country?: string; method?: string;
}) {
  const res = await fetch(`${GW}/api/gateway/generate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY() },
    body: JSON.stringify({
      amount: d.amount, description: d.description,
      country: d.country || 'bj', method: d.method || 'mtn_money',
      metadata: { transactionId: d.transactionId, userId: d.userId },
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Payment link failed');
  return { url: data.url as string, pid: data.pid as string };
}

export async function verifyPayment(id: string) {
  const res = await fetch(`${GW}/api/gateway/verify/${id}`, { headers: { 'x-api-key': KEY() } });
  return res.json();
}
