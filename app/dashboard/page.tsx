// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { VirtualCard, Transaction } from '@/types';
import {
  CreditCard, LogOut, Plus, RefreshCw, Eye, EyeOff,
  Snowflake, Sun, ArrowUpRight, ArrowDownLeft,
  Clock, CheckCircle, XCircle, Copy, Check,
  TrendingUp, ShoppingBag, Menu, X
} from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'mtn_money', label: 'MTN Mobile Money' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
];

const COUNTRIES_METHODS: Record<string, string[]> = {
  BJ: ['mtn_money', 'moov_money'],
  CI: ['mtn_money', 'orange_money', 'wave'],
  SN: ['orange_money', 'wave', 'mtn_money'],
  TG: ['mtn_money', 'moov_money'],
  ML: ['orange_money', 'wave', 'moov_money'],
  DEFAULT: ['mtn_money', 'moov_money', 'orange_money', 'wave'],
};

// ---- Virtual Card Display ----
function CardDisplay({ card, onFreeze, onUnfreeze, loading }: {
  card: VirtualCard;
  onFreeze: () => void;
  onUnfreeze: () => void;
  loading: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(`•••• •••• •••• ${card.last4}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardClass = card.status === 'frozen' ? 'virtual-card-frozen' : 'virtual-card';

  return (
    <div className={`${cardClass} card-shine`}>
      {card.status === 'frozen' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
            <Snowflake size={16} className="text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">Carte gelée</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">Solde disponible</div>
          <div className="font-display text-2xl font-bold">
            {showDetails ? `$${card.balance.toFixed(2)}` : '$••.••'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDetails(!showDetails)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
            {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <div className="font-display font-bold tracking-widest text-sm uppercase">{card.brand}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="font-mono text-lg tracking-[0.2em] text-white/80 flex items-center gap-2">
          •••• •••• •••• {card.last4}
          <button onClick={copyNumber}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center transition-colors">
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-white/40 text-xs mb-1">TITULAIRE</div>
          <div className="font-medium text-sm uppercase tracking-wide">{card.cardholderName}</div>
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1">EXPIRE</div>
          <div className="font-medium text-sm">{card.expiryMonth}/{card.expiryYear}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={card.status === 'frozen' ? onUnfreeze : onFreeze}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {card.status === 'frozen' ? <><Sun size={12} /> Dégeler</> : <><Snowflake size={12} /> Geler</>}
          </button>
        </div>
      </div>

      {/* Card pattern overlay */}
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full border border-white/5 translate-x-12 translate-y-12 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full border border-white/5 translate-x-16 translate-y-16 pointer-events-none" />
    </div>
  );
}

// ---- Buy Card Modal ----
function BuyCardModal({ onClose, onSuccess, userCountry }: {
  onClose: () => void;
  onSuccess: () => void;
  userCountry: string;
}) {
  const { getToken } = useAuth();
  const [method, setMethod] = useState('mtn_money');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableMethods = COUNTRIES_METHODS[userCountry] || COUNTRIES_METHODS.DEFAULT;

  const handleBuy = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ country: userCountry || 'bj', method }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      window.location.href = data.data.url;
    } catch {
      setError('Erreur lors de la création du lien.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-xl">Acheter une carte virtuelle</h3>
            <p className="text-text-secondary text-sm">Paiement unique de 5 000 FCFA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="card p-4 mb-6" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a2e)' }}>
          <div className="text-white/40 text-xs mb-1">VOTRE NOUVELLE CARTE</div>
          <div className="font-mono text-white/70 text-lg tracking-widest">•••• •••• •••• ••••</div>
          <div className="flex justify-between mt-4">
            <div className="text-white/40 text-xs">Carte Visa virtuelle</div>
            <div className="font-display font-bold text-white text-sm">VISA</div>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Mode de paiement</label>
          <div className="grid grid-cols-2 gap-2">
            {availableMethods.map(m => {
              const method_info = PAYMENT_METHODS.find(p => p.value === m);
              if (!method_info) return null;
              return (
                <button key={m} onClick={() => setMethod(m)}
                  className={`p-3 rounded-2xl border text-sm font-medium transition-all text-left ${method === m ? 'border-brand-orange bg-brand-orange-light text-brand-orange' : 'border-surface-border hover:border-surface-border bg-surface-muted text-text-secondary'}`}>
                  {method_info.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-muted rounded-2xl p-4 mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Carte virtuelle Visa</span>
            <span className="font-medium">5 000 FCFA</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Frais de service</span>
            <span className="font-medium text-brand-green">Offerts</span>
          </div>
          <div className="border-t border-surface-border pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-brand-orange">5 000 FCFA</span>
          </div>
        </div>

        <button onClick={handleBuy} disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : 'Payer maintenant →'}
        </button>
        <p className="text-center text-xs text-text-muted mt-3">
          Vous serez redirigé vers la page de paiement sécurisé
        </p>
      </div>
    </div>
  );
}

// ---- Reload Card Modal ----
function ReloadModal({ card, onClose, userCountry }: {
  card: VirtualCard;
  onClose: () => void;
  userCountry: string;
}) {
  const { getToken } = useAuth();
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState('mtn_money');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableMethods = COUNTRIES_METHODS[userCountry] || COUNTRIES_METHODS.DEFAULT;
  const amountUSD = Math.floor(amount / 600);

  const handleReload = async () => {
    if (amount < 1000) { setError('Montant minimum : 1 000 FCFA'); return; }
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, amount, country: userCountry || 'bj', method }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      window.location.href = data.data.url;
    } catch {
      setError('Erreur lors du rechargement.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-xl">Recharger la carte</h3>
            <p className="text-text-secondary text-sm">Carte •••• {card.last4}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
            <X size={16} />
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Montant (FCFA)</label>
          <input type="number" min={1000} step={500} value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="input-field text-xl font-bold" />
          <div className="text-text-muted text-xs mt-1">≈ ${amountUSD} USD sur votre carte</div>
        </div>

        <div className="flex gap-2 mb-5">
          {[2000, 5000, 10000, 25000].map(a => (
            <button key={a} onClick={() => setAmount(a)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${amount === a ? 'bg-brand-orange text-white' : 'bg-surface-muted text-text-secondary hover:bg-surface-border'}`}>
              {a.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Mode de paiement</label>
          <div className="grid grid-cols-2 gap-2">
            {availableMethods.map(m => {
              const method_info = PAYMENT_METHODS.find(p => p.value === m);
              if (!method_info) return null;
              return (
                <button key={m} onClick={() => setMethod(m)}
                  className={`p-3 rounded-2xl border text-sm font-medium transition-all text-left ${method === m ? 'border-brand-orange bg-brand-orange-light text-brand-orange' : 'border-surface-border bg-surface-muted text-text-secondary'}`}>
                  {method_info.label}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={handleReload} disabled={loading || amount < 1000} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : `Recharger ${amount.toLocaleString()} FCFA →`}
        </button>
      </div>
    </div>
  );
}

// ---- Transaction Item ----
function TxItem({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'card_reload' || tx.type === 'refund';
  const statusIcon = tx.status === 'success' ? <CheckCircle size={14} className="text-brand-green" />
    : tx.status === 'failed' ? <XCircle size={14} className="text-red-500" />
    : <Clock size={14} className="text-yellow-500" />;

  const typeLabel = {
    card_purchase: 'Achat carte virtuelle',
    card_reload: 'Rechargement carte',
    refund: 'Remboursement',
  }[tx.type] || tx.type;

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-surface-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isCredit ? 'bg-brand-green-light' : 'bg-brand-orange-light'}`}>
          {isCredit ? <ArrowDownLeft size={18} className="text-brand-green" /> : <ArrowUpRight size={18} className="text-brand-orange" />}
        </div>
        <div>
          <div className="font-medium text-sm">{typeLabel}</div>
          <div className="text-text-muted text-xs flex items-center gap-1 mt-0.5">
            {statusIcon}
            {tx.status === 'success' ? 'Confirmé' : tx.status === 'failed' ? 'Échoué' : 'En attente'}
            {' · '}
            {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
      <div className={`font-bold text-sm ${isCredit ? 'text-brand-green' : 'text-text-primary'}`}>
        {isCredit ? '+' : ''}{tx.amount.toLocaleString()} FCFA
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
export default function DashboardPage() {
  const router = useRouter();
  const { appUser, firebaseUser, logout, getToken } = useAuth();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showReload, setShowReload] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setCards(data.data.cards);
        setTransactions(data.data.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (!appUser && !loading) { router.push('/auth/login'); return; }
    if (firebaseUser) fetchData();
  }, [firebaseUser, appUser, loading, router, fetchData]);

  useEffect(() => {
    if (appUser?.role === 'admin') router.push('/admin');
  }, [appUser, router]);

  const handleFreeze = async (card: VirtualCard) => {
    setFreezeLoading(true);
    try {
      const token = await getToken();
      const action = card.status === 'frozen' ? 'unfreeze' : 'freeze';
      await fetch('/api/cards/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, action }),
      });
      await fetchData();
    } finally {
      setFreezeLoading(false);
    }
  };

  const activeCard = cards.find(c => c.status === 'active' || c.status === 'frozen');
  const hasCard = !!activeCard;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <CreditCard size={24} className="text-white" />
          </div>
          <p className="text-text-secondary text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  const successTxs = transactions.filter(t => t.status === 'success');
  const totalSpent = successTxs.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Header */}
      <header className="bg-white border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <span className="font-display font-bold">VCardAfrica</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{appUser?.displayName}</div>
              <div className="text-xs text-text-muted">{appUser?.email}</div>
            </div>
            <button onClick={logout}
              className="w-9 h-9 bg-surface-muted hover:bg-surface-border rounded-xl flex items-center justify-center transition-colors">
              <LogOut size={16} className="text-text-secondary" />
            </button>
          </div>
          <button className="sm:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden bg-white border-t border-surface-border px-4 py-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{appUser?.displayName}</div>
                <div className="text-xs text-text-muted">{appUser?.email}</div>
              </div>
              <button onClick={logout} className="btn-ghost text-sm flex items-center gap-1.5 text-red-500">
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold">
            Bonjour, {appUser?.displayName?.split(' ')[0]} 👋
          </h1>
          <p className="text-text-secondary">Gérez votre carte virtuelle</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Card + Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Card display */}
            {hasCard && activeCard ? (
              <CardDisplay
                card={activeCard}
                onFreeze={() => handleFreeze(activeCard)}
                onUnfreeze={() => handleFreeze(activeCard)}
                loading={freezeLoading}
              />
            ) : (
              <div className="border-2 border-dashed border-surface-border rounded-3xl p-10 text-center">
                <div className="w-16 h-16 bg-brand-orange-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={28} className="text-brand-orange" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Pas encore de carte</h3>
                <p className="text-text-secondary text-sm mb-6">
                  Obtenez votre carte virtuelle Visa internationale pour payer partout dans le monde.
                </p>
                <button onClick={() => setShowBuy(true)} className="btn-primary">
                  <Plus size={16} className="inline mr-2" />
                  Acheter une carte — 5 000 FCFA
                </button>
              </div>
            )}

            {/* Action buttons */}
            {hasCard && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowReload(true)}
                  className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow cursor-pointer text-left">
                  <div className="w-10 h-10 bg-brand-green-light rounded-2xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-brand-green" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Recharger</div>
                    <div className="text-text-muted text-xs">Via Mobile Money</div>
                  </div>
                </button>
                <button onClick={() => fetchData()}
                  className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow cursor-pointer text-left">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <RefreshCw size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Actualiser</div>
                    <div className="text-text-muted text-xs">Sync en temps réel</div>
                  </div>
                </button>
              </div>
            )}

            {/* Card info */}
            {hasCard && activeCard && (
              <div className="card p-5">
                <h3 className="font-medium mb-4">Détails de la carte</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Type</span>
                    <span className="font-medium capitalize">{activeCard.brand} Virtuelle</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Devise</span>
                    <span className="font-medium">{activeCard.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Statut</span>
                    <span className={`badge ${activeCard.status === 'active' ? 'badge-green' : activeCard.status === 'frozen' ? 'badge bg-blue-50 text-blue-600' : 'badge-gray'}`}>
                      {activeCard.status === 'active' ? '● Active' : activeCard.status === 'frozen' ? '❄ Gelée' : activeCard.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Créée le</span>
                    <span className="font-medium">{new Date(activeCard.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats + Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center mb-2">
                  <ShoppingBag size={16} className="text-brand-orange" />
                </div>
                <div className="font-display text-xl font-bold">{successTxs.length}</div>
                <div className="text-text-muted text-xs">Transactions</div>
              </div>
              <div className="card p-4">
                <div className="w-8 h-8 bg-brand-green-light rounded-xl flex items-center justify-center mb-2">
                  <TrendingUp size={16} className="text-brand-green" />
                </div>
                <div className="font-display text-xl font-bold">
                  {(totalSpent / 1000).toFixed(0)}k
                </div>
                <div className="text-text-muted text-xs">FCFA dépensés</div>
              </div>
            </div>

            {/* Transactions */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Historique</h3>
                <span className="text-text-muted text-xs">{transactions.length} transactions</span>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-text-muted text-sm">Aucune transaction</div>
                  <div className="text-text-muted text-xs mt-1">Vos transactions apparaîtront ici</div>
                </div>
              ) : (
                <div>
                  {transactions.map(tx => <TxItem key={tx.id} tx={tx} />)}
                </div>
              )}
            </div>

            {/* Help card */}
            <div className="card p-5 bg-brand-orange border-brand-orange/20" style={{ background: 'linear-gradient(135deg, #fff7ed, #fff0e0)' }}>
              <h3 className="font-medium text-brand-orange mb-2">Besoin d'aide ?</h3>
              <p className="text-text-secondary text-xs leading-relaxed mb-3">
                Pour toute question sur votre carte ou vos paiements, contactez notre support.
              </p>
              <a href="mailto:support@vcardafrica.com"
                className="text-brand-orange text-xs font-medium hover:underline">
                support@vcardafrica.com →
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showBuy && (
        <BuyCardModal
          onClose={() => setShowBuy(false)}
          onSuccess={fetchData}
          userCountry={appUser?.country || 'BJ'}
        />
      )}
      {showReload && activeCard && (
        <ReloadModal
          card={activeCard}
          onClose={() => setShowReload(false)}
          userCountry={appUser?.country || 'BJ'}
        />
      )}
    </div>
  );
}
