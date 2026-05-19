// lib/didit.ts
// ================================================================
// DIDIT KYC API CLIENT — https://docs.didit.me
// Auth: header x-api-key (SERVEUR UNIQUEMENT)
// Session: POST https://verification.didit.me/v3/session/
// vendor_data = userId Firestore → retourné dans le webhook
// ================================================================

const DIDIT_API_KEY = () => process.env.DIDIT_API_KEY!;
const DIDIT_WORKFLOW_ID = () => process.env.DIDIT_WORKFLOW_ID!;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://card.lfdweb.com';

export interface DiditSession {
  session_id: string;
  url: string;
  status: string;
}

/**
 * Crée une session de vérification Didit pour un utilisateur.
 * vendor_data = userId pour retrouver l'utilisateur dans le webhook.
 * callback = URL de retour après vérification.
 */
export async function createDiditSession(userId: string): Promise<DiditSession> {
  const res = await fetch('https://verification.didit.me/v3/session/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': DIDIT_API_KEY(),
    },
    body: JSON.stringify({
      workflow_id: DIDIT_WORKFLOW_ID(),
      vendor_data: userId,                        // ✅ Retourné tel quel dans le webhook
      callback: `${APP_URL()}/dashboard`,         // Redirection après vérification
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `Didit HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Récupère les détails d'une session Didit.
 */
export async function getDiditSession(sessionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://verification.didit.me/v3/session/${sessionId}/`, {
    headers: { 'x-api-key': DIDIT_API_KEY() },
  });
  if (!res.ok) throw new Error(`Didit GET session HTTP ${res.status}`);
  return res.json();
}

// Statuts Didit possibles
export type DiditStatus = 'Approved' | 'Declined' | 'In Review' | 'In Progress' | 'Abandoned';

export function isApproved(status: string): boolean {
  return status === 'Approved';
}

export function isDeclined(status: string): boolean {
  return status === 'Declined';
}