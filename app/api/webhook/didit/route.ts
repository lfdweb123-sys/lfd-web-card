// app/api/webhook/didit/route.ts
// ================================================================
// WEBHOOK DIDIT KYC — https://docs.didit.me/integration/webhooks
// URL à configurer dans Didit Business Console → API & Webhooks
//   https://card.lfdweb.com/api/webhook/didit
//
// Signature : X-Signature-V3(recommandée par Didit)
// vendor_data = userId Firestore (passé lors de createSession)
// Statuts : Approved | Declined | In Review | In Progress | Abandoned
// ================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

const OK = () => NextResponse.json({ message: 'Webhook event dispatched' });
const WEBHOOK_SECRET = () => process.env.DIDIT_WEBHOOK_SECRET!;

// ── Vérification HMAC X-Signature-V3(recommandée Didit) ─────────
function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)])
    );
  }
  if (typeof data === 'number' && !Number.isInteger(data) && data % 1 === 0) return Math.trunc(data);
  return data;
}

function sortKeysRecursive(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeysRecursive);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as object).sort().reduce((acc, key) => {
      (acc as Record<string, unknown>)[key] = sortKeysRecursive((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

function verifySignatureV3(body: Record<string, unknown>, sig: string, timestamp: string, secret: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false; // 5 min freshness

  const processed = shortenFloats(body);
  const canonical = JSON.stringify(sortKeysRecursive(processed)); // Unicode non-échappé
  const expected = createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'));
  } catch { return false; }
}

function verifySignatureSimple(body: Record<string, unknown>, sig: string, timestamp: string, secret: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const canonical = [
    body.timestamp || '',
    body.session_id || '',
    body.status || '',
    body.webhook_type || '',
  ].join(':');

  const expected = createHmac('sha256', secret).update(canonical).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'));
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return OK(); }

  const sigV3= req.headers.get('x-signature-v3');
  const sigSimple = req.headers.get('x-signature-simple');
  const timestamp = req.headers.get('x-timestamp');
  const secret = WEBHOOK_SECRET();

  // Vérifier la signature (sauf en développement sans secret configuré)
  if (secret && timestamp) {
    const validV3= sigV3 && verifySignatureV3(body, sigV3, timestamp, secret);
    const validSimple = !validV3 && sigSimple && verifySignatureSimple(body, sigSimple, timestamp, secret);
    if (!validV3 && !validSimple) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }
  }

  const { session_id, status, vendor_data, webhook_type } = body as {
    session_id?: string;
    status?: string;
    vendor_data?: string;  // ← userId Firestore
    webhook_type?: string;
  };

  // On traite seulement les changements de statut
  if (webhook_type !== 'status.updated') return OK();
  if (!vendor_data || !session_id || !status) return OK();

  const userId = vendor_data;

  await adminDb.collection('logs').add({
    type: 'didit_webhook', userId, sessionId: session_id, status, createdAt: new Date().toISOString(),
  });

  if (status === 'Approved') {
    await adminDb.collection('kyc').doc(userId).set({
      userId, method: 'didit', status: 'approved',
      diditSessionId: session_id,
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    }, { merge: true });

    await adminDb.collection('users').doc(userId).update({
      kycStatus: 'approved',
      kycApprovedAt: new Date().toISOString(),
    });

    await adminDb.collection('notifications').add({
      userId, type: 'kyc_approved',
      title: '✅ Identité vérifiée',
      message: 'Votre identité a été vérifiée avec succès. Vous pouvez maintenant obtenir votre carte.',
      read: false, createdAt: new Date().toISOString(),
    });

  } else if (status === 'Declined') {
    await adminDb.collection('kyc').doc(userId).set({
      userId, method: 'didit', status: 'rejected',
      diditSessionId: session_id,
      updatedAt: new Date().toISOString(),
      rejectionReason: 'Vérification automatique échouée.',
    }, { merge: true });

    await adminDb.collection('users').doc(userId).update({ kycStatus: 'rejected' });

    await adminDb.collection('notifications').add({
      userId, type: 'kyc_rejected',
      title: '❌ Vérification refusée',
      message: 'Votre vérification automatique n\'a pas abouti. Essayez la vérification manuelle.',
      read: false, createdAt: new Date().toISOString(),
    });

  } else if (status === 'In Review') {
    await adminDb.collection('kyc').doc(userId).set({
      userId, method: 'didit', status: 'in_review',
      diditSessionId: session_id,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

  } else if (status === 'In Progress') {
    await adminDb.collection('kyc').doc(userId).set({
      userId, method: 'didit', status: 'pending',
      diditSessionId: session_id,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  return OK();
}