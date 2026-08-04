// lib/referral.ts — SERVEUR UNIQUEMENT
// Gère le crédit des commissions de parrainage sur les rechargements des filleuls.

import { adminDb, FieldValue } from '@/lib/firebase-admin';

/**
 * Résout un publicId (UUID exposé dans ?ref=) vers les infos publiques
 * d'un parrain, sans jamais exposer son promoCode interne. Utilisé par
 * la page d'inscription pour afficher "X vous invite sur LFD WEB CARD".
 * Retourne null si le UUID est invalide/inconnu ou le parrain inactif.
 */
export async function resolveReferrerByPublicId(
  publicId: string
): Promise<{ id: string; name: string; promoCode: string } | null> {
  if (!publicId) return null;
  const snap = await adminDb
    .collection('referrers')
    .where('publicId', '==', publicId)
    .where('active', '==', true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return { id: doc.id, name: data.name, promoCode: data.promoCode };
}

/**
 * Crédite la commission du parrain pour un rechargement donné, de façon idempotente :
 * si cette transaction a déjà été créditée (ex : webhook rejoué), on ne recrédite pas.
 * Ne fait jamais échouer le flux de rechargement appelant en cas de problème.
 */
export async function creditReferralCommission(userId: string, transactionId: string): Promise<void> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const referredBy = userDoc.data()?.referredBy as string | undefined;
    if (!referredBy) return;

    const referrerSnap = await adminDb.collection('referrers').where('promoCode', '==', referredBy).limit(1).get();
    if (referrerSnap.empty) return;
    const referrerDoc = referrerSnap.docs[0];
    const referrer = referrerDoc.data();
    if (!referrer.active) return;

    // Idempotence : une entrée par transactionId, jamais deux fois pour le même rechargement.
    const earningRef = adminDb.collection('referral_earnings').doc(transactionId);
    const existing = await earningRef.get();
    if (existing.exists) return;

    const amountXOF = referrer.commissionPerReload || 25;

    await earningRef.set({
      referrerId: referrerDoc.id,
      referredUserId: userId,
      transactionId,
      amountXOF,
      paid: false,
      paidAt: null,
      createdAt: new Date().toISOString(),
    });

    await referrerDoc.ref.update({
      totalEarningsXOF: FieldValue.increment(amountXOF),
      unpaidXOF: FieldValue.increment(amountXOF),
    });
  } catch (err) {
    console.error('creditReferralCommission error:', err);
  }
}

/**
 * Enregistre le filleul auprès de son parrain à l'inscription (une seule fois).
 * Retourne true si le code était valide et a été appliqué.
 */
export async function applyReferralCode(userId: string, promoCode: string): Promise<boolean> {
  try {
    const code = promoCode.trim().toUpperCase();
    if (!code) return false;

    const referrerSnap = await adminDb.collection('referrers').where('promoCode', '==', code).limit(1).get();
    if (referrerSnap.empty) return false;
    const referrerDoc = referrerSnap.docs[0];
    if (!referrerDoc.data().active) return false;

    await adminDb.collection('users').doc(userId).update({ referredBy: code });
    await referrerDoc.ref.update({ totalReferred: FieldValue.increment(1) });
    return true;
  } catch (err) {
    console.error('applyReferralCode error:', err);
    return false;
  }
}
