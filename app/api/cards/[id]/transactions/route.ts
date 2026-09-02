import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { getMastercardTransactions } from '@/lib/pagocards';
import { getCard4xxTransactions } from '@/lib/pagocards-4xxbins';

export interface CardTransactionItem {
  id: string;
  type: string;
  status: string;
  amountUSD: number;
  currency: string;
  merchant: string | null;
  date: string;
}

// Historique réel des transactions faites AVEC la carte chez des marchands — distinct de
// l'historique "Mes achats/rechargements" (nos propres événements plateforme, stockés dans
// Firestore). La Visacard classique n'a aucun endpoint de transactions documenté par
// Pagocards ; on le signale explicitement plutôt que de renvoyer une liste vide silencieuse.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id: cardId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const cardDoc = await adminDb.collection('cards').doc(cardId).get();
    if (!cardDoc.exists) return NextResponse.json({ success: false, error: 'Carte introuvable.' }, { status: 404 });
    const card = cardDoc.data()!;
    if (card.userId !== user.uid) return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 });

    if (card.apiFamily === '4xxbins') {
      const res = await getCard4xxTransactions(card.pagocardsCardId, page);
      const items: CardTransactionItem[] = res.data.transactions.map(t => ({
        id: t.id, type: t.type, status: t.status, amountUSD: t.display_amount,
        currency: t.currency, merchant: t.merchant_name || null, date: t.created_at,
      }));
      return NextResponse.json({ success: true, data: { items, page, hasMore: res.data.pagination.has_more, supported: true } });
    }

    if (card.brand === 'mastercard') {
      const res = await getMastercardTransactions({ cardid: card.pagocardsCardId, email: card.email, page, limit: 10 });
      const items: CardTransactionItem[] = res.data.transactions.map(t => ({
        id: t.id, type: t.type[0] || 'transaction', status: t.status[0] || 'unknown', amountUSD: t.amount,
        currency: t.currency, merchant: t.merchant || null, date: t.transactionDate,
      }));
      const hasMore = res.data.pagination.page < res.data.pagination.pages;
      return NextResponse.json({ success: true, data: { items, page, hasMore, supported: true } });
    }

    // Visacard classique : aucun endpoint de transactions documenté par Pagocards.
    return NextResponse.json({ success: true, data: { items: [], page: 1, hasMore: false, supported: false } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
