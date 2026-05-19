'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { VirtualCard, Transaction, Notification } from '@/types';
import {
  CreditCard, LogOut, Plus, RefreshCw, Eye, EyeOff,
  Snowflake, Sun, ArrowUpRight, ArrowDownLeft,
  Clock, CheckCircle, XCircle, Copy, Check,
  TrendingUp, Bell, Home, X, ChevronRight, AlertCircle, Menu,
  Shield, ArrowRight, Loader2
} from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  mtn_money: 'MTN Mobile Money', moov_money: 'Moov Money',
  orange_money: 'Orange Money', wave: 'Wave',
};

// ── KYC status types ──────────────────────────────────────────────
type KycStatus = 'approved' | 'rejected' | 'pending' | 'in_review' | null;

interface KycData {
  status: KycStatus;
  method?: 'didit' | 'manual' | null;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
}

// ── KYC Gate ──────────────────────────────────────────────────────
/**
 * Shown when the user's KYC is not yet approved.
 * - pending / in_review → waiting state
 * - rejected            → invite to retry
 * - null                → first-time, invite to start
 */
function KycGate({ kyc, onVerify }: { kyc: KycData | null; onVerify: () => void }) {
  const router = useRouter();

  const isPending = kyc?.status === 'pending' || kyc?.status === 'in_review';
  const isRejected = kyc?.status === 'rejected';
  const isNew = !kyc || !kyc.status;

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-5 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
          <CreditCard size={16} className="text-white" />
        </div>
        <span className="font-semibold tracking-wide">LFD WEB CARD</span>
      </div>

      <div className="w-full max-w-md">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg
          ${isPending ? 'bg-yellow-400' : isRejected ? 'bg-red-500' : 'bg-brand-orange'}`}>
          {isPending
            ? <Clock size={34} className="text-white" />
            : isRejected
              ? <XCircle size={34} className="text-white" />
              : <Shield size={34} className="text-white" />
          }
        </div>

        {/* Title & description */}
        {isPending && (
          <>
            <h1 className="text-2xl font-bold text-center mb-3">Vérification en cours</h1>
            <p className="text-ink-secondary text-center text-sm leading-relaxed mb-2">
              {kyc?.method === 'manual'
                ? 'Votre dossier est en cours d\'examen par notre équipe. Vous recevrez une notification dès la décision (délai : 1 à 24 h).'
                : 'Votre vérification automatique est en cours de traitement. Revenez dans quelques instants.'}
            </p>
            {kyc?.submittedAt && (
              <p className="text-ink-muted text-center text-xs mb-8">
                Soumis le {new Date(kyc.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {/* Animated dots */}
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-brand-orange animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 text-center">
              Vous serez notifié par email et dans l'application dès que votre identité sera vérifiée.
            </div>
          </>
        )}

        {isRejected && (
          <>
            <h1 className="text-2xl font-bold text-center mb-3">Vérification refusée</h1>
            {kyc?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 text-center mb-4">
                <strong>Raison :</strong> {kyc.rejectionReason}
              </div>
            )}
            <p className="text-ink-secondary text-center text-sm leading-relaxed mb-8">
              Vous pouvez soumettre à nouveau votre dossier avec des documents valides et lisibles.
            </p>
            <button onClick={() => router.push('/kyc')} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              Recommencer la vérification <ArrowRight size={16} />
            </button>
          </>
        )}

        {isNew && (
          <>
            <h1 className="text-2xl font-bold text-center mb-3">Vérifiez votre identité</h1>
            <p className="text-ink-secondary text-center text-sm leading-relaxed mb-6">
              La vérification d'identité est obligatoire avant d'accéder à votre tableau de bord et d'obtenir votre carte virtuelle LFD WEB CARD.
            </p>

            {/* Steps */}
            <div className="space-y-3 mb-8">
              {[
                { icon: <CreditCard size={18} className="text-brand-orange" />, label: 'Préparez votre pièce d\'identité (CNI, passeport ou permis)' },
                { icon: <Camera size={18} className="text-brand-orange" />, label: 'Prenez un selfie avec votre document' },
                { icon: <Zap size={18} className="text-brand-orange" />, label: 'Résultat immédiat (vérification automatique) ou sous 24 h (manuel)' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface-muted rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-sm text-ink-secondary">{step.label}</span>
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/kyc')} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              Démarrer la vérification <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Logo ─────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
        <CreditCard size={15} className="text-white" />
      </div>
      <span className="font-semibold text-sm tracking-wide">LFD WEB CARD</span>
    </div>
  );
}

// ── Sidebar desktop ───────────────────────────────────────────────
function Sidebar({ active, onNav, onLogout, userName, unread }: {
  active: string; onNav: (s: string) => void; onLogout: () => void;
  userName: string; unread: number;
}) {
  const items = [
    { id: 'home', label: 'Accueil', icon: <Home size={18} /> },
    { id: 'card', label: 'Ma carte', icon: <CreditCard size={18} /> },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread },
  ];
  return (
    <aside className="sidebar-fixed hidden md:flex flex-col">
      <div className="px-5 py-5 border-b border-surface-border">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 text-left ${active === item.id ? 'bg-brand-orange text-white shadow-orange' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink-primary'}`}>
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span> : null}
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-surface-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-orange text-xs font-bold">{userName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName}</div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-ink-secondary hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────
function MobileDrawer({ open, onClose, active, onNav, onLogout, userName, unread }: {
  open: boolean; onClose: () => void; active: string; onNav: (s: string) => void;
  onLogout: () => void; userName: string; unread: number;
}) {
  const items = [
    { id: 'home', label: 'Accueil', icon: <Home size={18} /> },
    { id: 'card', label: 'Ma carte', icon: <CreditCard size={18} /> },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread },
  ];
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl md:hidden">
        <div className="px-5 py-5 border-b border-surface-border flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
            <X size={15} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(item => (
            <button key={item.id} onClick={() => { onNav(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 text-left ${active === item.id ? 'bg-brand-orange text-white shadow-orange' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink-primary'}`}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-surface-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-brand-orange text-xs font-bold">{userName[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{userName}</div>
            </div>
          </div>
          <button onClick={() => { onLogout(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-ink-secondary hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

// ── Mobile top bar ────────────────────────────────────────────────
function MobileTopBar({ onMenu, unread }: { onMenu: () => void; unread: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-white border-b border-surface-border px-4 h-14 flex items-center justify-between">
      <button onClick={onMenu} className="w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center">
        <Menu size={18} />
      </button>
      <Logo />
      <div className="w-9 h-9 flex items-center justify-center relative">
        <Bell size={18} className="text-ink-secondary" />
        {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
      </div>
    </div>
  );
}

// ── Bottom nav (mobile) ─────────────────────────────────────────
function BottomNav({ active, onNav, unread }: { active: string; onNav: (s: string) => void; unread: number }) {
  const items = [
    { id: 'home', label: 'Accueil', icon: <Home size={20} /> },
    { id: 'card', label: 'Carte', icon: <CreditCard size={20} /> },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={20} /> },
    { id: 'notifications', label: 'Alertes', icon: <Bell size={20} />, badge: unread },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-surface-border">
      <div className="grid grid-cols-4 h-16">
        {items.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${active === item.id ? 'text-brand-orange' : 'text-ink-muted'}`}>
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.badge ? <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge}</span> : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── Virtual Card ─────────────────────────────────────────────────
function CardDisplay({ card, onFreeze, loading }: { card: VirtualCard; onFreeze: () => void; loading: boolean }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`•••• •••• •••• ${card.last4}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const cls = card.status === 'frozen' ? 'vcard-frozen' : 'vcard';
  return (
    <div className={cls + ' shadow-xl'}>
      {card.status === 'frozen' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
            <Snowflake size={15} className="text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">Carte gelée</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-white/40 text-[10px] tracking-widest mb-0.5">SOLDE</div>
          <div className="text-2xl font-bold">{show ? `$${card.balance.toFixed(2)}` : '$••.••'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShow(!show)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <span className="font-bold text-sm tracking-widest uppercase">{card.brand}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 font-mono text-[15px] tracking-[0.18em] text-white/80 mb-6">
        •••• •••• •••• {card.last4}
        <button onClick={copy} className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-white/40 text-[10px] tracking-widest mb-0.5">TITULAIRE</div>
          <div className="font-semibold text-sm uppercase tracking-wide">{card.cardholderName}</div>
        </div>
        <div>
          <div className="text-white/40 text-[10px] tracking-widest mb-0.5">EXPIRE</div>
          <div className="font-semibold text-sm">{card.expiryMonth}/{card.expiryYear}</div>
        </div>
        <button onClick={onFreeze} disabled={loading}
          className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50">
          {card.status === 'frozen' ? <><Sun size={12} />Dégeler</> : <><Snowflake size={12} />Geler</>}
        </button>
      </div>
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full border border-white/5 translate-x-16 translate-y-16 pointer-events-none" />
    </div>
  );
}

// ── Buy Modal ─────────────────────────────────────────────────────
function BuyModal({ onClose, country, getToken }: { onClose: () => void; country: string; getToken: () => Promise<string> }) {
  const [brand, setBrand] = useState<'visa' | 'mastercard'>('visa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setLoading(true); setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ country: country.toLowerCase(), brand }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      window.open(data.data.url, '_blank');
      onClose();
    } catch { setError('Erreur réseau.'); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-bold text-xl">Acheter une carte</h3>
            <p className="text-ink-secondary text-sm">Paiement unique de 5 000 FCFA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Type de carte</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setBrand('visa')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${brand === 'visa' ? 'border-brand-orange bg-brand-orange-light' : 'border-surface-border bg-surface-muted'}`}>
              <span className={`text-lg font-extrabold italic tracking-tight ${brand === 'visa' ? 'text-brand-orange' : 'text-ink-secondary'}`}>VISA</span>
              <span className={`text-xs font-medium ${brand === 'visa' ? 'text-brand-orange' : 'text-ink-muted'}`}>Visa Virtuelle</span>
            </button>
            <button onClick={() => setBrand('mastercard')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${brand === 'mastercard' ? 'border-brand-orange bg-brand-orange-light' : 'border-surface-border bg-surface-muted'}`}>
              <div className="flex items-center -space-x-2">
                <div className={`w-7 h-7 rounded-full ${brand === 'mastercard' ? 'bg-brand-orange' : 'bg-red-400'}`} />
                <div className={`w-7 h-7 rounded-full opacity-80 ${brand === 'mastercard' ? 'bg-yellow-400' : 'bg-yellow-300'}`} />
              </div>
              <span className={`text-xs font-medium ${brand === 'mastercard' ? 'text-brand-orange' : 'text-ink-muted'}`}>Mastercard</span>
            </button>
          </div>
        </div>

        <div className="vcard mb-5 py-5 px-5 shadow-md" style={{ minHeight: 'auto' }}>
          <div className="text-white/40 text-[10px] tracking-widest mb-1">VOTRE NOUVELLE CARTE</div>
          <div className="font-mono text-white/70 tracking-[0.18em]">•••• •••• •••• ••••</div>
          <div className="flex justify-between mt-4 text-xs">
            <span className="text-white/40">Carte {brand === 'visa' ? 'Visa' : 'Mastercard'} virtuelle</span>
            <span className="font-bold tracking-widest uppercase">{brand}</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="bg-surface-muted rounded-2xl p-4 mb-5 text-sm">
          <div className="flex justify-between mb-2"><span className="text-ink-secondary">Carte {brand === 'visa' ? 'Visa' : 'Mastercard'} virtuelle</span><span className="font-medium">5 000 FCFA</span></div>
          <div className="flex justify-between mb-2"><span className="text-ink-secondary">Frais</span><span className="text-brand-green font-medium">Offerts</span></div>
          <div className="border-t border-surface-border pt-2 flex justify-between font-bold"><span>Total</span><span className="text-brand-orange">5 000 FCFA</span></div>
        </div>

        <button onClick={handle} disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : 'Payer maintenant →'}
        </button>
        <p className="text-center text-xs text-ink-muted mt-2">Vous serez redirigé vers la page de paiement sécurisé</p>
      </div>
    </div>
  );
}

// ── Reload Modal ─────────────────────────────────────────────────
function ReloadModal({ card, onClose, country, getToken }: { card: VirtualCard; onClose: () => void; country: string; getToken: () => Promise<string> }) {
  const [amount, setAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fee = Math.round(amount * 0.12);
  const total = amount + fee;
  const usd = (amount / 600).toFixed(2);

  const handle = async () => {
    if (amount < 1000) { setError('Minimum 1 000 FCFA'); return; }
    setLoading(true); setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, amount, fee, country: country.toLowerCase() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      window.open(data.data.url, '_blank');
      onClose();
    } catch { setError('Erreur réseau.'); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-bold text-xl">Recharger la carte</h3>
            <p className="text-ink-secondary text-sm">Carte •••• {card.last4}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
            <X size={15} />
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Montant à créditer (FCFA)</label>
          <input
            type="number" min={1000} step={500} value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="input-field text-xl font-bold"
          />
          <div className="text-ink-muted text-xs mt-1">≈ ${usd} USD crédités sur votre carte</div>
        </div>

        <div className="flex gap-2 mb-5">
          {[3000, 5000, 10000, 25000].map(a => (
            <button key={a} onClick={() => setAmount(a)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${amount === a ? 'bg-brand-orange text-white' : 'bg-surface-muted text-ink-secondary'}`}>
              {(a / 1000).toFixed(0)}k
            </button>
          ))}
        </div>

        <div className="bg-surface-muted rounded-2xl p-4 mb-5 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-ink-secondary">Crédit carte (≈ ${usd})</span>
            <span className="font-medium">{amount.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary flex items-center gap-1.5">
              Frais de service
              <span className="text-[10px] bg-ink-muted/10 text-ink-muted px-1.5 py-0.5 rounded-full font-medium">12%</span>
            </span>
            <span className="font-medium text-ink-primary">+{fee.toLocaleString()} FCFA</span>
          </div>
          <div className="border-t border-surface-border pt-2 flex justify-between font-bold">
            <span>Total à payer</span>
            <span className="text-brand-orange">{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <button onClick={handle} disabled={loading || amount < 1000} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : `Payer ${total.toLocaleString()} FCFA →`}
        </button>
        <p className="text-center text-xs text-ink-muted mt-2">Vous serez redirigé vers la page de paiement sécurisé</p>
      </div>
    </div>
  );
}

// ── Transaction item ─────────────────────────────────────────────
function TxItem({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'card_reload';
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-surface-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isCredit ? 'bg-brand-green-light' : 'bg-brand-orange-light'}`}>
          {isCredit ? <ArrowDownLeft size={17} className="text-brand-green" /> : <ArrowUpRight size={17} className="text-brand-orange" />}
        </div>
        <div>
          <div className="font-medium text-sm">{tx.type === 'card_purchase' ? 'Achat carte virtuelle' : 'Rechargement carte'}</div>
          <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
            {tx.status === 'success'
              ? <CheckCircle size={12} className="text-brand-green" />
              : tx.status === 'failed'
                ? <XCircle size={12} className="text-red-500" />
                : <Clock size={12} className="text-yellow-500" />}
            {tx.status === 'success' ? 'Confirmé' : tx.status === 'failed' ? 'Échoué' : 'En attente'}
            {' · '}{new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
      <div className={`font-bold text-sm ${isCredit ? 'text-brand-green' : 'text-ink-primary'}`}>
        {isCredit ? '+' : ''}{tx.amount.toLocaleString()} FCFA
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { appUser, firebaseUser, logout, getToken, loading: authLoading } = useAuth();

  // KYC state
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  // Dashboard state
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [tab, setTab] = useState('home');
  const [showBuy, setShowBuy] = useState(false);
  const [showReload, setShowReload] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch KYC status ─────────────────────────────────────────
  const fetchKyc = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setKyc(data.data);
    } finally {
      setKycLoading(false);
    }
  }, [firebaseUser, getToken]);

  // ── Fetch dashboard data ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const [cardRes, notifRes] = await Promise.all([
        fetch('/api/cards/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const cardData = await cardRes.json();
      const notifData = await notifRes.json();
      if (cardData.success) { setCards(cardData.data.cards); setTransactions(cardData.data.transactions); }
      if (notifData.success) setNotifications(notifData.data);
    } finally { setLoading(false); }
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) { router.push('/auth/login'); return; }
    if (firebaseUser) {
      fetchKyc();
      fetchData();
    }
  }, [firebaseUser, authLoading, router, fetchKyc, fetchData]);

  // Admin redirect
  useEffect(() => {
    if (appUser?.role === 'admin') router.push('/admin');
  }, [appUser, router]);

  // ── Mark notification as read (optimistic) ────────────────────
  const markAsRead = useCallback(async (notifId: string) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif || notif.read) return;
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      const token = await getToken();
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId: notifId }),
      });
    } catch {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: false } : n));
    }
  }, [notifications, getToken]);

  // ── Mark all as read ──────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const token = await getToken();
      await Promise.all(
        unreadNotifs.map(n =>
          fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ notificationId: n.id }),
          })
        )
      );
    } catch {
      setNotifications(prev =>
        prev.map(n => {
          const wasUnread = unreadNotifs.find(u => u.id === n.id);
          return wasUnread ? { ...n, read: false } : n;
        })
      );
    }
  }, [notifications, getToken]);

  const handleFreeze = async (card: VirtualCard) => {
    setFreezeLoading(true);
    try {
      const token = await getToken();
      await fetch('/api/cards/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, action: card.status === 'frozen' ? 'unfreeze' : 'freeze' }),
      });
      await fetchData();
    } finally { setFreezeLoading(false); }
  };

  const activeCard = cards.find(c => c.status === 'active' || c.status === 'frozen');
  const unread = notifications.filter(n => !n.read).length;

  // ── Loading screen ────────────────────────────────────────────
  if (authLoading || kycLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <CreditCard size={22} className="text-white" />
          </div>
          <p className="text-ink-secondary text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // ── KYC Gate: block dashboard if not approved ─────────────────
  // Allow access only when status === 'approved'
  const kycApproved = kyc?.status === 'approved';

  if (!kycApproved) {
    return <KycGate kyc={kyc} onVerify={() => router.push('/kyc')} />;
  }

  // ── Dashboard content (KYC approved) ─────────────────────────
  const renderContent = () => {
    switch (tab) {
      case 'home': return (
        <div className="space-y-6 animate-fade-in">
          {/* KYC approved badge */}
          <div className="inline-flex items-center gap-1.5 bg-brand-green-light border border-brand-green/20 rounded-full px-3 py-1 text-xs text-green-700 font-medium">
            <CheckCircle size={12} className="text-brand-green" />
            Identité vérifiée
          </div>

          <div>
            <h1 className="text-2xl font-bold">Bonjour, {appUser?.displayName?.split(' ')[0]} 👋</h1>
            <p className="text-ink-secondary">Bienvenue sur votre espace LFD WEB CARD</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="text-ink-secondary text-xs mb-1">Transactions</div>
              <div className="text-2xl font-bold">{transactions.filter(t => t.status === 'success').length}</div>
            </div>
            <div className="card p-4">
              <div className="text-ink-secondary text-xs mb-1">Statut carte</div>
              <div className="text-sm font-bold mt-1">
                {activeCard
                  ? <span className={activeCard.status === 'active' ? 'text-brand-green' : 'text-blue-500'}>{activeCard.status === 'active' ? '● Active' : '❄ Gelée'}</span>
                  : <span className="text-ink-muted">Aucune carte</span>}
              </div>
            </div>
          </div>
          {!activeCard && (
            <div className="card p-6 border-2 border-dashed border-brand-orange/30 text-center">
              <div className="w-14 h-14 bg-brand-orange-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-brand-orange" />
              </div>
              <h3 className="font-bold text-lg mb-2">Pas encore de carte</h3>
              <p className="text-ink-secondary text-sm mb-5">Obtenez votre carte Visa ou Mastercard virtuelle internationale pour payer partout dans le monde.</p>
              <button onClick={() => setShowBuy(true)} className="btn-primary"><Plus size={16} />Acheter une carte — 5 000 FCFA</button>
            </div>
          )}
          {activeCard && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowReload(true)} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left cursor-pointer">
                <div className="w-10 h-10 bg-brand-green-light rounded-2xl flex items-center justify-center"><TrendingUp size={18} className="text-brand-green" /></div>
                <div><div className="font-medium text-sm">Recharger</div><div className="text-ink-muted text-xs">Mobile Money</div></div>
              </button>
              <button onClick={fetchData} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left cursor-pointer">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center"><RefreshCw size={18} className="text-blue-500" /></div>
                <div><div className="font-medium text-sm">Actualiser</div><div className="text-ink-muted text-xs">Sync données</div></div>
              </button>
            </div>
          )}
          {transactions.slice(0, 3).length > 0 && (
            <div className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Dernières transactions</h3>
                <button onClick={() => setTab('history')} className="text-brand-orange text-xs font-medium flex items-center gap-1">Voir tout <ChevronRight size={13} /></button>
              </div>
              {transactions.slice(0, 3).map(tx => <TxItem key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>
      );

      case 'card': return (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-bold">Ma carte</h2>
          {activeCard ? (
            <>
              <CardDisplay card={activeCard} onFreeze={() => handleFreeze(activeCard)} loading={freezeLoading} />
              <div className="card p-5">
                <h3 className="font-semibold mb-4">Détails de la carte</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ['Type', `${activeCard.brand.charAt(0).toUpperCase() + activeCard.brand.slice(1)} Virtuelle`],
                    ['Devise', activeCard.currency],
                    ['Créée le', new Date(activeCard.createdAt).toLocaleDateString('fr-FR')],
                    ['Statut', activeCard.status === 'active' ? '● Active' : '❄ Gelée'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-ink-secondary">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowReload(true)} className="btn-primary py-3.5"><TrendingUp size={16} />Recharger</button>
                <button onClick={() => handleFreeze(activeCard)} disabled={freezeLoading} className="btn-secondary py-3.5">
                  {activeCard.status === 'frozen' ? <><Sun size={16} />Dégeler</> : <><Snowflake size={16} />Geler</>}
                </button>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center border-2 border-dashed border-brand-orange/30">
              <CreditCard size={40} className="text-brand-orange mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Aucune carte active</h3>
              <p className="text-ink-secondary text-sm mb-5">Achetez votre première carte Visa ou Mastercard virtuelle internationale.</p>
              <button onClick={() => setShowBuy(true)} className="btn-primary"><Plus size={16} />Acheter — 5 000 FCFA</button>
            </div>
          )}
        </div>
      );

      case 'history': return (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-bold">Historique des transactions</h2>
          <div className="card p-5">
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <TrendingUp size={36} className="text-ink-muted mx-auto mb-3" />
                <p className="text-ink-secondary">Aucune transaction pour l'instant</p>
              </div>
            ) : (
              transactions.map(tx => <TxItem key={tx.id} tx={tx} />)
            )}
          </div>
        </div>
      );

      case 'notifications': return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Notifications</h2>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-brand-orange hover:text-brand-orange/70 transition-colors flex items-center gap-1"
              >
                <CheckCircle size={13} /> Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="card p-8 text-center">
              <Bell size={36} className="text-ink-muted mx-auto mb-3" />
              <p className="text-ink-secondary">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`card p-4 transition-all select-none ${
                    !n.read
                      ? 'border-l-4 border-brand-orange cursor-pointer hover:shadow-card-hover active:scale-[0.99]'
                      : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.type === '3ds_required' ? 'bg-red-50' : 'bg-brand-orange-light'}`}>
                      {n.type === '3ds_required'
                        ? <AlertCircle size={16} className="text-red-500" />
                        : <Bell size={16} className="text-brand-orange" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-ink-secondary text-xs mt-0.5">{n.message}</div>
                      <div className="text-ink-muted text-[11px] mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-brand-orange rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="bg-surface-bg">
      <Sidebar active={tab} onNav={setTab} onLogout={logout} userName={appUser?.displayName || 'Utilisateur'} unread={unread} />
      <MobileTopBar onMenu={() => setDrawerOpen(true)} unread={unread} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        active={tab}
        onNav={setTab}
        onLogout={logout}
        userName={appUser?.displayName || 'Utilisateur'}
        unread={unread}
      />
      <div className="main-with-sidebar">
        <main className="p-5 sm:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-ink-muted">
              <Loader2 size={24} className="animate-spin mr-3" />Chargement...
            </div>
          ) : renderContent()}
        </main>
      </div>
      <BottomNav active={tab} onNav={setTab} unread={unread} />
      {showBuy && <BuyModal onClose={() => setShowBuy(false)} country={appUser?.country || 'BJ'} getToken={getToken} />}
      {showReload && activeCard && <ReloadModal card={activeCard} onClose={() => setShowReload(false)} country={appUser?.country || 'BJ'} getToken={getToken} />}
    </div>
  );
}