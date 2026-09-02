'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { VirtualCard, Transaction, Notification } from '@/types';
import { formatDate, formatDateTime } from '@/lib/date';
import { getCardTheme, CARD_THEMES } from '@/lib/card-themes';
import { Accordion } from '@/components/Accordion';
import { Pagination } from '@/components/Pagination';
import { Toast } from '@/components/Toast';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { listenForegroundMessages } from '@/lib/messaging';
import { Logo as LogoComponent } from '@/components/Logo';
import { SidebarLogo } from '@/components/SidebarLogo';
import {
  CreditCard, LogOut, Plus, RefreshCw, Eye, EyeOff,
  Snowflake, Sun, ArrowUpRight, ArrowDownLeft,
  Clock, CheckCircle, XCircle, Copy, Check,
  TrendingUp, Bell, Home, X, ChevronRight, AlertCircle, Menu,
  Shield, ArrowRight, Loader2, Camera, Zap, Layers,
  UserCircle
} from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  mtn_money: 'MTN Mobile Money', moov_money: 'Moov Money',
  orange_money: 'Orange Money', wave: 'Wave',
};

// ── KYC ──────────────────────────────────────────────────────────
type KycStatus = 'approved' | 'rejected' | 'pending' | 'in_review' | null;

interface KycData {
  status: KycStatus;
  method?: 'didit' | 'manual' | null;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
}

function KycGate({ kyc, onVerify, forced }: { kyc: KycData | null; onVerify: () => void; forced?: boolean }) {
  const router = useRouter();
  const isPending = kyc?.status === 'pending' || kyc?.status === 'in_review';
  const isRejected = kyc?.status === 'rejected';
  const isNew = !kyc || !kyc.status;

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-5 py-16">
      <div className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
          <CreditCard size={16} className="text-white" />
        </div>
        <span className="font-semibold tracking-wide">LFD WEB CARD</span>
      </div>
      <div className="w-full max-w-md">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg
          ${isPending ? 'bg-yellow-400' : isRejected ? 'bg-red-500' : 'bg-brand-orange'}`}>
          {isPending ? <Clock size={34} className="text-white" />
            : isRejected ? <XCircle size={34} className="text-white" />
            : <Shield size={34} className="text-white" />}
        </div>
        {isPending && (
          <>
            <h1 className="text-2xl font-bold text-center mb-3">Vérification en cours</h1>
            <p className="text-ink-secondary text-center text-sm leading-relaxed mb-2">
              {kyc?.method === 'manual'
                ? "Votre dossier est en cours d'examen par notre équipe. Vous recevrez une notification dès la décision (délai : 1 à 24 h)."
                : 'Votre vérification automatique est en cours de traitement. Revenez dans quelques instants.'}
            </p>
            {kyc?.submittedAt && (
              <p className="text-ink-muted text-center text-xs mb-8">
                Soumis le {formatDate(kyc.submittedAt)}
              </p>
            )}
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
              {forced
                ? "Pour la sécurité de votre compte, une vérification d'identité est maintenant nécessaire avant de continuer à utiliser votre tableau de bord et votre carte."
                : "La vérification d'identité est obligatoire avant d'accéder à votre tableau de bord et d'obtenir votre carte virtuelle LFD WEB CARD."}
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon: <CreditCard size={18} className="text-brand-orange" />, label: "Préparez votre pièce d'identité (CNI, passeport ou permis)" },
                { icon: <Camera size={18} className="text-brand-orange" />, label: 'Prenez un selfie avec votre document' },
                { icon: <Zap size={18} className="text-brand-orange" />, label: 'Résultat immédiat (vérification automatique) ou sous 24 h (manuel)' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface-muted rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">{step.icon}</div>
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

function KycBanner({ kyc }: { kyc: KycData | null }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const isPending = kyc?.status === 'pending' || kyc?.status === 'in_review';
  const isRejected = kyc?.status === 'rejected';

  return (
    <div className="card p-4 flex items-start gap-3 border border-surface-border">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isRejected ? 'bg-red-50' : isPending ? 'bg-yellow-50' : 'bg-brand-orange-light'}`}>
        {isPending ? <Clock size={18} className="text-yellow-600" />
          : isRejected ? <XCircle size={18} className="text-red-500" />
          : <Shield size={18} className="text-brand-orange" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-0.5">
          {isPending ? 'Vérification en cours' : isRejected ? 'Vérification refusée' : 'Vérifiez votre identité (optionnel)'}
        </div>
        <p className="text-ink-secondary text-xs leading-relaxed mb-3">
          {isPending
            ? "Votre dossier est en cours d'examen. Vous serez notifié dès la décision."
            : isRejected
              ? kyc?.rejectionReason || 'Vous pouvez soumettre à nouveau votre dossier.'
              : "La vérification d'identité n'est pas obligatoire pour utiliser votre carte, mais elle peut débloquer des limites plus élevées et un support prioritaire."}
        </p>
        {!isPending && (
          <button onClick={() => router.push('/kyc')} className="btn-primary text-xs py-2 px-4">
            {isRejected ? 'Réessayer' : 'Vérifier maintenant'}
          </button>
        )}
      </div>
      <button onClick={() => setDismissed(true)} className="text-ink-muted hover:text-ink-primary flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// ── Logo ─────────────────────────────────────────────────────────
function Logo() {
  return <LogoComponent />;
}

// ── Nav items ─────────────────────────────────────────────────────
function navItems(unread: number) {
  return [
    { id: 'home', label: 'Accueil', icon: <Home size={18} />, href: '/dashboard?tab=home' },
    { id: 'card', label: 'Mes cartes', icon: <CreditCard size={18} />, href: '/dashboard?tab=card' },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={18} />, href: '/dashboard?tab=history' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unread, href: '/dashboard?tab=notifications' },
  ];
}

// ── Sidebar desktop ───────────────────────────────────────────────
function Sidebar({ active, onNav, onLogout, userName, unread }: {
  active: string; onNav: (s: string) => void; onLogout: () => void;
  userName: string; unread: number;
}) {
  const items = navItems(unread);
  return (
    <aside className="sidebar-fixed hidden md:flex flex-col stripes-dark text-white border-r-0">
      <div className="py-5 border-b border-white/10"><SidebarLogo /></div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <Link key={item.id} href={item.href} onClick={() => onNav(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 text-left ${active === item.id ? 'bg-brand-orange text-white shadow-orange' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span> : null}
          </Link>
        ))}
      </nav>
<div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-orange text-xs font-bold">{userName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName}</div>
          </div>
        </div>
        <Link href="/profile"
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mb-1">
          <UserCircle size={16} /> Mon profil
        </Link>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
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
  const items = navItems(unread);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-72 stripes-dark text-white z-50 flex flex-col shadow-2xl md:hidden">
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="w-36"><SidebarLogo /></div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><X size={15} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(item => (
            <Link key={item.id} href={item.href} onClick={() => { onNav(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 text-left ${active === item.id ? 'bg-brand-orange text-white shadow-orange' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-brand-orange text-xs font-bold">{userName[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{userName}</div></div>
          </div>
          <Link href="/profile" onClick={onClose}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mb-1">
            <UserCircle size={16} /> Mon profil
          </Link>
          <button onClick={() => { onLogout(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
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
      <button onClick={onMenu} className="w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center"><Menu size={18} /></button>
      <Logo />
      <div className="w-9 h-9 flex items-center justify-center relative">
        <Bell size={18} className="text-ink-secondary" />
        {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
      </div>
    </div>
  );
}

// ── Bottom nav (mobile) ───────────────────────────────────────────
function BottomNav({ active, onNav, unread }: { active: string; onNav: (s: string) => void; unread: number }) {
  const items = [
    { id: 'home', label: 'Accueil', icon: <Home size={20} />, href: '/dashboard?tab=home' },
    { id: 'card', label: 'Cartes', icon: <CreditCard size={20} />, href: '/dashboard?tab=card' },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={20} />, href: '/dashboard?tab=history' },
    { id: 'notifications', label: 'Alertes', icon: <Bell size={20} />, badge: unread, href: '/dashboard?tab=notifications' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-surface-border">
      <div className="grid grid-cols-4 h-16">
        {items.map(item => (
          <Link key={item.id} href={item.href} onClick={() => onNav(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${active === item.id ? 'text-brand-orange' : 'text-ink-muted'}`}>
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.badge ? <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge}</span> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// ── Virtual Card Display ──────────────────────────────────────────
function CardDisplay({ card, onFreeze, loading }: { card: VirtualCard; onFreeze: () => void; loading: boolean }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`•••• •••• •••• ${card.last4}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const cls = card.status === 'frozen' ? 'vcard-frozen' : 'vcard';
  const themeStyle = card.status === 'frozen' ? undefined : { background: getCardTheme(card.theme).gradient };
  return (
    <div className={cls + ' shadow-xl'} style={themeStyle}>
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

// ── Mini card preview (for card list) ────────────────────────────
function CardMini({ card, active, onClick }: { card: VirtualCard; active: boolean; onClick: () => void }) {
  const isFrozen = card.status === 'frozen';
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${active ? 'border-brand-orange bg-brand-orange-light/30' : 'border-surface-border bg-white hover:border-brand-orange/40'}`}
    >
      <div
        className={`w-12 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isFrozen ? 'bg-blue-500/20' : ''}`}
        style={isFrozen ? undefined : { background: getCardTheme(card.theme).gradient }}
      >
        {isFrozen
          ? <Snowflake size={14} className="text-blue-400" />
          : <CreditCard size={14} className="text-white/80" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold uppercase tracking-wide">{card.brand}</div>
        <div className="text-xs text-ink-muted font-mono">•••• {card.last4}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isFrozen ? 'bg-blue-100 text-blue-600' : 'bg-brand-green-light text-brand-green'}`}>
          {isFrozen ? 'Gelée' : 'Active'}
        </div>
        <div className="text-xs text-ink-muted mt-1">${card.balance.toFixed(2)}</div>
      </div>
    </button>
  );
}

// ── Buy Modal ─────────────────────────────────────────────────────
function BuyModal({ onClose, country, getToken, hasCards }: {
  onClose: () => void; country: string; getToken: () => Promise<string>; hasCards: boolean;
}) {
  const [brand, setBrand] = useState<'visa' | 'mastercard'>('visa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [withLoad, setWithLoad] = useState(false);
  const RELOAD_MIN = 30000;
  const [loadAmount, setLoadAmount] = useState(RELOAD_MIN);

  const CARD_PRICE = 5000; // doit rester synchronisé avec CARD_CREATION_PRICE côté serveur
  const FEE_RATE = 0.05;
  const cardFee = Math.round(CARD_PRICE * FEE_RATE);
  const loadFee = withLoad ? Math.round(loadAmount * FEE_RATE) : 0;
  const fee = cardFee + loadFee;
  const total = CARD_PRICE + (withLoad ? loadAmount : 0) + fee;

  const handle = async () => {
    if (withLoad && loadAmount < RELOAD_MIN) { setError(`Montant de rechargement minimum : ${RELOAD_MIN.toLocaleString()} FCFA`); return; }
    setLoading(true); setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ country: country.toLowerCase(), brand, ...(withLoad ? { initialLoad: loadAmount } : {}) }),
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
            <h3 className="font-bold text-xl">{hasCards ? 'Commander une nouvelle carte' : 'Acheter une carte'}</h3>
            <p className="text-ink-secondary text-sm">Paiement unique · {total.toLocaleString()} FCFA au total</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
        </div>

        {hasCards && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-5 flex items-start gap-2 text-sm text-blue-700">
            <Layers size={15} className="flex-shrink-0 mt-0.5" />
            <span>Vous pouvez posséder plusieurs cartes virtuelles pour différents usages (abonnements, achats, etc.).</span>
          </div>
        )}

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

        <div className="mb-5">
          <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-surface-border bg-surface-muted cursor-pointer">
            <input type="checkbox" checked={withLoad} onChange={(e) => setWithLoad(e.target.checked)} className="w-4 h-4 accent-brand-orange" />
            <div className="flex-1">
              <div className="text-sm font-medium">Recharger ma carte tout de suite</div>
              <div className="text-xs text-ink-muted">Optionnel — évite un second paiement plus tard</div>
            </div>
          </label>
          {withLoad && (
            <div className="mt-3">
              <input type="number" min={RELOAD_MIN} step={5000} value={loadAmount}
                onChange={(e) => setLoadAmount(Number(e.target.value))}
                className="input-field w-full" />
              <div className="text-ink-muted text-xs mt-1">≈ ${(loadAmount / 600).toFixed(2)} USD crédités sur la carte · Minimum {RELOAD_MIN.toLocaleString()} FCFA</div>
              <div className="flex gap-2 mt-2">
                {[30000, 50000, 75000, 100000].map(a => (
                  <button key={a} onClick={() => setLoadAmount(a)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-all ${loadAmount === a ? 'border-brand-orange bg-brand-orange-light text-brand-orange' : 'border-surface-border text-ink-secondary'}`}>
                    {(a / 1000)}k
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="bg-surface-muted rounded-2xl p-4 mb-5 text-sm">
          <div className="flex justify-between mb-2"><span className="text-ink-secondary">Carte {brand === 'visa' ? 'Visa' : 'Mastercard'} virtuelle</span><span className="font-medium">{CARD_PRICE.toLocaleString()} FCFA</span></div>
          {withLoad && (
            <div className="flex justify-between mb-2"><span className="text-ink-secondary">Rechargement</span><span className="font-medium">{loadAmount.toLocaleString()} FCFA</span></div>
          )}
          <div className="flex justify-between mb-2"><span className="text-ink-secondary">Frais Mobile Money (5%)</span><span className="font-medium">{fee.toLocaleString()} FCFA</span></div>
          <div className="border-t border-surface-border pt-2 flex justify-between font-bold"><span>Total</span><span className="text-brand-orange">{total.toLocaleString()} FCFA</span></div>
        </div>

        <button onClick={handle} disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : 'Payer maintenant →'}
        </button>
        <p className="text-center text-xs text-ink-muted mt-2">Vous serez redirigé vers la page de paiement sécurisé</p>
      </div>
    </div>
  );
}

// ── Reload Modal ──────────────────────────────────────────────────
function ReloadModal({ card, onClose, country, getToken }: {
  card: VirtualCard; onClose: () => void; country: string; getToken: () => Promise<string>;
}) {
  const RELOAD_MIN = 30000;
  const [amount, setAmount] = useState(RELOAD_MIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fee = Math.round(amount * 0.05);
  const total = amount + fee;
  const usd = (amount / 600).toFixed(2);

  const handle = async () => {
    if (amount < RELOAD_MIN) { setError(`Minimum ${RELOAD_MIN.toLocaleString()} FCFA`); return; }
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
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Montant à créditer (FCFA)</label>
          <input type="number" min={RELOAD_MIN} step={5000} value={amount}
            onChange={e => setAmount(Number(e.target.value))} className="input-field text-xl font-bold" />
          <div className="text-ink-muted text-xs mt-1">≈ ${usd} USD crédités sur votre carte · Minimum {RELOAD_MIN.toLocaleString()} FCFA</div>
        </div>

        <div className="flex gap-2 mb-5">
          {[30000, 50000, 75000, 100000].map(a => (
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
              <span className="text-[10px] bg-ink-muted/10 text-ink-muted px-1.5 py-0.5 rounded-full font-medium">5%</span>
            </span>
            <span className="font-medium text-ink-primary">+{fee.toLocaleString()} FCFA</span>
          </div>
          <div className="border-t border-surface-border pt-2 flex justify-between font-bold">
            <span>Total à payer</span>
            <span className="text-brand-orange">{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <button onClick={handle} disabled={loading || amount < RELOAD_MIN} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : `Payer ${total.toLocaleString()} FCFA →`}
        </button>
        <p className="text-center text-xs text-ink-muted mt-2">Vous serez redirigé vers la page de paiement sécurisé</p>
      </div>
    </div>
  );
}

// ── Withdraw modal (Mastercard uniquement) ────────────────────────
function WithdrawModal({ card, onClose, getToken, onSuccess }: {
  card: VirtualCard; onClose: () => void; getToken: () => Promise<string>; onSuccess: (msg: string) => void;
}) {
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const xof = Math.round(amount * 600);
  const maxAmount = card.balance || 0;

  const handle = async () => {
    if (amount < 2) { setError('Montant minimum : $2'); return; }
    if (amount > maxAmount) { setError('Ce montant dépasse le solde disponible sur la carte.'); return; }
    setLoading(true); setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, amount }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      onSuccess(`Retrait initié — vous recevrez environ ${data.data.amountXOF.toLocaleString()} FCFA par Mobile Money sous 24-48h.`);
      onClose();
    } catch { setError('Erreur réseau.'); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-bold text-xl">Retirer vers Mobile Money</h3>
            <p className="text-ink-secondary text-sm">Carte •••• {card.last4}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-5 flex items-start gap-2 text-sm text-blue-700">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>Le montant est prélevé sur votre carte immédiatement. Le virement Mobile Money est traité manuellement sous 24 à 48h.</span>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Montant à retirer (USD)</label>
          <input type="number" min={2} step={1} value={amount}
            onChange={e => setAmount(Number(e.target.value))} className="input-field text-xl font-bold" />
          <div className="text-ink-muted text-xs mt-1">
            ≈ {xof.toLocaleString()} FCFA · Solde disponible : ${maxAmount.toFixed(2)}
          </div>
        </div>

        <p className="text-ink-muted text-xs mb-5">Des frais de $1 sont appliqués par l'émetteur de la carte sur chaque retrait.</p>

        <button onClick={handle} disabled={loading || amount < 2 || amount > maxAmount} className="btn-primary w-full py-3.5">
          {loading ? 'Traitement...' : `Retirer $${amount} →`}
        </button>
      </div>
    </div>
  );
}

// ── Transaction item ──────────────────────────────────────────────
function TxItem({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'card_reload';
  const isWithdrawal = tx.type === 'card_withdrawal';
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-surface-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isCredit ? 'bg-brand-green-light' : isWithdrawal ? 'bg-blue-50' : 'bg-brand-orange-light'}`}>
          {isCredit ? <ArrowDownLeft size={17} className="text-brand-green" />
            : isWithdrawal ? <ArrowUpRight size={17} className="text-blue-500" />
            : <ArrowUpRight size={17} className="text-brand-orange" />}
        </div>
        <div>
          <div className="font-medium text-sm">
            {tx.type === 'card_purchase' ? 'Achat carte virtuelle' : tx.type === 'card_withdrawal' ? 'Retrait vers Mobile Money' : 'Rechargement carte'}
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
            {tx.status === 'success' || tx.status === 'completed' ? <CheckCircle size={12} className="text-brand-green" />
              : tx.status === 'failed' ? <XCircle size={12} className="text-red-500" />
              : <Clock size={12} className="text-yellow-500" />}
            {tx.status === 'success' ? 'Confirmé' : tx.status === 'failed' ? 'Échoué' : tx.status === 'completed' ? 'Envoyé' : tx.status === 'pending_payout' ? 'Virement en cours' : 'En attente'}
            {' · '}{formatDate(tx.createdAt, { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
      <div className={`font-bold text-sm ${isCredit ? 'text-brand-green' : isWithdrawal ? 'text-blue-500' : 'text-ink-primary'}`}>
        {isCredit ? '+' : isWithdrawal ? '-' : ''}{tx.amount.toLocaleString()} FCFA
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appUser, firebaseUser, logout, getToken, loading: authLoading } = useAuth();

  const [kyc, setKyc] = useState<KycData | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const validTabs = ['home', 'card', 'history', 'notifications'];
  const tabParam = searchParams.get('tab') || 'home';
  const tab = validTabs.includes(tabParam) ? tabParam : 'home';
  const setTab = (next: string) => router.push(`/dashboard?tab=${next}`, { scroll: false });
  const [showBuy, setShowBuy] = useState(false);
  const [showReload, setShowReload] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [themeLoading, setThemeLoading] = useState<string | null>(null);

  // Historique — pagination + filtres (liste dédiée, distincte de l'aperçu home)
  const [historyItems, setHistoryItems] = useState<Transaction[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyType, setHistoryType] = useState('all');
  const [historyStatus, setHistoryStatus] = useState('all');

  // Notifications — pagination + filtre (liste dédiée à l'onglet)
  const [notifItems, setNotifItems] = useState<Notification[]>([]);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');

  const fetchKyc = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setKyc(data.data);
    } finally { setKycLoading(false); }
  }, [firebaseUser, getToken]);

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
      if (cardData.success) {
        setCards(cardData.data.cards);
        setTransactions(cardData.data.transactions);
        if (cardData.data.cards.length > 0 && !selectedCardId) {
          const first = cardData.data.cards.find((c: VirtualCard) => c.status === 'active') || cardData.data.cards[0];
          setSelectedCardId(first.id);
        }
      }
      if (notifData.success) setNotifications(notifData.data);
    } finally { setLoading(false); }
  }, [firebaseUser, getToken, selectedCardId]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) { router.push('/auth/login'); return; }
    if (firebaseUser) { fetchKyc(); fetchData(); }
  }, [firebaseUser, authLoading, router, fetchKyc, fetchData]);

  useEffect(() => {
    if (appUser?.role === 'admin') router.push('/admin');
  }, [appUser, router]);

  const fetchHistory = useCallback(async () => {
    if (!firebaseUser) return;
    setHistoryLoading(true);
    try {
      const token = await getToken();
      const qs = new URLSearchParams({ page: String(historyPage), type: historyType, status: historyStatus });
      const res = await fetch(`/api/transactions?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setHistoryItems(data.data.items);
        setHistoryHasMore(data.data.hasMore);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [firebaseUser, getToken, historyPage, historyType, historyStatus]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  // Revenir à la page 1 quand un filtre change
  useEffect(() => {
    setHistoryPage(1);
  }, [historyType, historyStatus]);

  const fetchNotifTab = useCallback(async () => {
    if (!firebaseUser) return;
    setNotifLoading(true);
    try {
      const token = await getToken();
      const qs = new URLSearchParams({ page: String(notifPage), filter: notifFilter });
      const res = await fetch(`/api/notifications?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setNotifItems(data.data);
        setNotifHasMore(data.hasMore);
      }
    } finally {
      setNotifLoading(false);
    }
  }, [firebaseUser, getToken, notifPage, notifFilter]);

  useEffect(() => {
    if (tab === 'notifications') fetchNotifTab();
  }, [tab, fetchNotifTab]);

  useEffect(() => {
    setNotifPage(1);
  }, [notifFilter]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = listenForegroundMessages((title, body) => {
      setToast({ message: `${title} — ${body}`, type: 'success' });
      fetchData();
    });
    return unsubscribe;
  }, [firebaseUser, fetchData]);

  const markAsRead = useCallback(async (notifId: string) => {
    const notif = notifications.find(n => n.id === notifId) || notifItems.find(n => n.id === notifId);
    if (!notif || notif.read) return;
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    setNotifItems(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      const token = await getToken();
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId: notifId }),
      });
    } catch {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: false } : n));
      setNotifItems(prev => prev.map(n => n.id === notifId ? { ...n, read: false } : n));
    }
  }, [notifications, notifItems, getToken]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    const unreadFromTab = notifItems.filter(n => !n.read);
    if (unreadNotifs.length === 0 && unreadFromTab.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotifItems(prev => prev.map(n => ({ ...n, read: true })));
    const toMark = unreadNotifs.length > 0 ? unreadNotifs : unreadFromTab;
    try {
      const token = await getToken();
      await Promise.all(toMark.map(n =>
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ notificationId: n.id }),
        })
      ));
    } catch {
      setNotifications(prev => prev.map(n => {
        const wasUnread = toMark.find(u => u.id === n.id);
        return wasUnread ? { ...n, read: false } : n;
      }));
      setNotifItems(prev => prev.map(n => {
        const wasUnread = toMark.find(u => u.id === n.id);
        return wasUnread ? { ...n, read: false } : n;
      }));
    }
  }, [notifications, notifItems, getToken]);

  const handleFreeze = async (card: VirtualCard) => {
    setFreezeLoading(true);
    const willFreeze = card.status !== 'frozen';
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, action: willFreeze ? 'freeze' : 'unfreeze' }),
      });
      const data = await res.json();
      if (!data.success) {
        setToast({ message: data.error || "Impossible de modifier l'état de la carte.", type: 'error' });
        return;
      }
      await fetchData();
      setToast({ message: willFreeze ? 'Carte gelée avec succès ❄' : 'Carte dégelée avec succès ☀', type: 'success' });
    } catch {
      setToast({ message: 'Erreur réseau. Réessayez.', type: 'error' });
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleThemeChange = async (card: VirtualCard, theme: string) => {
    setThemeLoading(theme);
    try {
      const token = await getToken();
      const res = await fetch('/api/cards/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id, theme }),
      });
      const data = await res.json();
      if (!data.success) {
        setToast({ message: data.error || 'Impossible de changer le style de la carte.', type: 'error' });
        return;
      }
      await fetchData();
      setToast({ message: 'Style de carte mis à jour ✅', type: 'success' });
    } catch {
      setToast({ message: 'Erreur réseau. Réessayez.', type: 'error' });
    } finally {
      setThemeLoading(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchData(), fetchKyc()]);
      setToast({ message: 'Données synchronisées ✅', type: 'success' });
    } catch {
      setToast({ message: 'Échec de la synchronisation. Réessayez.', type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const activeCards = cards.filter(c => c.status === 'active' || c.status === 'frozen');
  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) : activeCards[0];
  const hasCards = activeCards.length > 0;
  const unread = notifications.filter(n => !n.read).length;

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

  // KYC optionnel par défaut — Pagocards n'exige pas de KYC côté cardholder.
  // Exception : si un admin a explicitement marqué ce compte comme nécessitant
  // une vérification (activité suspecte détectée), l'accès est bloqué jusqu'à
  // ce que la vérification soit complétée et approuvée.
  if (appUser?.kycRequired && kyc?.status !== 'approved') {
    return <KycGate kyc={kyc} onVerify={() => router.push('/kyc')} forced />;
  }

  const renderContent = () => {
    switch (tab) {

      case 'home': return (
        <div className="space-y-6 animate-fade-in">
          <NotificationPrompt getToken={getToken} />

          <div className="flex items-start justify-between gap-4">
            <div>
              {kyc?.status === 'approved' ? (
                <div className="inline-flex items-center gap-1.5 bg-brand-green-light border border-brand-green/20 rounded-full px-3 py-1 text-xs text-green-700 font-medium mb-3">
                  <CheckCircle size={12} className="text-brand-green" /> Identité vérifiée
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-surface-muted border border-surface-border rounded-full px-3 py-1 text-xs text-ink-secondary font-medium mb-3">
                  <Shield size={12} /> Identité non vérifiée (optionnel)
                </div>
              )}
              <h1 className="text-2xl font-bold">Bonjour, {appUser?.displayName?.split(' ')[0]} 👋</h1>
              <p className="text-ink-secondary">Bienvenue sur votre espace LFD WEB CARD</p>
            </div>
          </div>

          {kyc?.status !== 'approved' && <KycBanner kyc={kyc} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="text-ink-secondary text-xs mb-1">Transactions</div>
              <div className="text-2xl font-bold">{transactions.filter(t => t.status === 'success').length}</div>
            </div>
            <div className="card p-4">
              <div className="text-ink-secondary text-xs mb-1">Mes cartes</div>
              <div className="text-2xl font-bold">{hasCards ? activeCards.length : 0}</div>
              {hasCards && (
                <div className={`text-xs font-semibold mt-1 ${selectedCard?.status === 'active' ? 'text-brand-green' : 'text-blue-500'}`}>
                  {selectedCard?.status === 'active' ? '● Active' : '❄ Gelée'}
                </div>
              )}
            </div>
          </div>

          {!hasCards && (
            <div className="card p-6 border-2 border-dashed border-brand-orange/30 text-center">
              <div className="w-14 h-14 bg-brand-orange-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-brand-orange" />
              </div>
              <h3 className="font-bold text-lg mb-2">Pas encore de carte</h3>
              <p className="text-ink-secondary text-sm mb-5">
                Obtenez votre carte Visa ou Mastercard virtuelle internationale pour payer partout dans le monde.
              </p>
              <button onClick={() => setShowBuy(true)} className="btn-primary">
                <Plus size={16} /> Acheter une carte — 5 000 FCFA
              </button>
            </div>
          )}

          {hasCards && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowReload(true)} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left cursor-pointer">
                <div className="w-10 h-10 bg-brand-green-light rounded-2xl flex items-center justify-center"><TrendingUp size={18} className="text-brand-green" /></div>
                <div><div className="font-medium text-sm">Recharger</div><div className="text-ink-muted text-xs">Mobile Money</div></div>
              </button>
              <button onClick={() => setShowBuy(true)} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left cursor-pointer">
                <div className="w-10 h-10 bg-brand-orange-light rounded-2xl flex items-center justify-center"><Plus size={18} className="text-brand-orange" /></div>
                <div><div className="font-medium text-sm">Nouvelle carte</div><div className="text-ink-muted text-xs">5 000 FCFA</div></div>
              </button>
              <button onClick={handleRefresh} disabled={refreshing} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left cursor-pointer disabled:opacity-60">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center"><RefreshCw size={18} className={`text-blue-500 ${refreshing ? 'animate-spin' : ''}`} /></div>
                <div><div className="font-medium text-sm">Actualiser</div><div className="text-ink-muted text-xs">{refreshing ? 'Synchronisation...' : 'Sync données'}</div></div>
              </button>
              <button onClick={() => setTab('card')} className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left cursor-pointer">
                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center"><Layers size={18} className="text-purple-500" /></div>
                <div><div className="font-medium text-sm">Mes cartes</div><div className="text-ink-muted text-xs">{activeCards.length} carte{activeCards.length > 1 ? 's' : ''}</div></div>
              </button>
            </div>
          )}

          {transactions.slice(0, 3).length > 0 && (
            <div className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Dernières transactions</h3>
                <button onClick={() => setTab('history')} className="text-brand-orange text-xs font-medium flex items-center gap-1">
                  Voir tout <ChevronRight size={13} />
                </button>
              </div>
              {transactions.slice(0, 3).map(tx => <TxItem key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>
      );

      case 'card': return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Mes cartes</h2>
            <button onClick={() => setShowBuy(true)}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
              <Plus size={15} /> Nouvelle carte
            </button>
          </div>

          {!hasCards && (
            <div className="card p-8 text-center border-2 border-dashed border-brand-orange/30">
              <CreditCard size={40} className="text-brand-orange mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Aucune carte active</h3>
              <p className="text-ink-secondary text-sm mb-5">
                Achetez votre première carte Visa ou Mastercard virtuelle internationale.
              </p>
              <button onClick={() => setShowBuy(true)} className="btn-primary">
                <Plus size={16} /> Acheter — 5 000 FCFA
              </button>
            </div>
          )}

          {hasCards && (
            <>
              {activeCards.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink-secondary">Sélectionnez une carte</p>
                  {activeCards.map(card => (
                    <CardMini
                      key={card.id}
                      card={card}
                      active={selectedCard?.id === card.id}
                      onClick={() => setSelectedCardId(card.id)}
                    />
                  ))}
                </div>
              )}

              {selectedCard && (
                <>
                  <CardDisplay
                    card={selectedCard}
                    onFreeze={() => handleFreeze(selectedCard)}
                    loading={freezeLoading}
                  />
                  <div className={`grid gap-3 ${selectedCard.brand === 'mastercard' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <button onClick={() => setShowReload(true)} className="btn-primary py-3.5">
                      <TrendingUp size={16} /> Recharger
                    </button>
                    {selectedCard.brand === 'mastercard' && (
                      <button onClick={() => setShowWithdraw(true)} className="btn-secondary py-3.5">
                        <ArrowDownLeft size={16} /> Retirer
                      </button>
                    )}
                    <button onClick={() => handleFreeze(selectedCard)} disabled={freezeLoading} className="btn-secondary py-3.5">
                      {selectedCard.status === 'frozen'
                        ? <><Sun size={16} /> Dégeler</>
                        : <><Snowflake size={16} /> Geler</>}
                    </button>
                  </div>
                  <Accordion title="Détails de la carte">
                    <div className="space-y-3 text-sm">
                      {[
                        ['Type', `${selectedCard.brand.charAt(0).toUpperCase() + selectedCard.brand.slice(1)} Virtuelle`],
                        ['Devise', selectedCard.currency],
                        ['Créée le', formatDate(selectedCard.createdAt)],
                        ['Statut', selectedCard.status === 'active' ? '● Active' : '❄ Gelée'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-ink-secondary">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </Accordion>
                  <Accordion title="Personnaliser ma carte" subtitle="Choisissez le fond qui s'affiche sur votre carte virtuelle.">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {CARD_THEMES.map(t => {
                        const isActive = (selectedCard.theme || 'midnight') === t.id;
                        const isLoadingThis = themeLoading === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleThemeChange(selectedCard, t.id)}
                            disabled={!!themeLoading}
                            title={t.name}
                            className={`relative aspect-[3/2] rounded-xl transition-all ${isActive ? 'ring-2 ring-brand-orange ring-offset-2' : 'hover:scale-105'} disabled:opacity-60`}
                            style={{ background: t.gradient }}
                          >
                            {isActive && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle size={16} className="text-white drop-shadow" />
                              </span>
                            )}
                            {isLoadingThis && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                <Loader2 size={14} className="text-white animate-spin" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Accordion>
                </>
              )}

              <div className="card p-5 border border-dashed border-brand-orange/40 bg-brand-orange-light/20">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-brand-orange rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Plus size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Commander une nouvelle carte</div>
                    <div className="text-ink-secondary text-xs mt-0.5">Visa ou Mastercard · 5 000 FCFA</div>
                  </div>
                  <button onClick={() => setShowBuy(true)} className="btn-primary text-sm py-2 px-4 flex-shrink-0">
                    Commander
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );

      case 'history': return (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-bold">Historique des transactions</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={historyType}
              onChange={e => setHistoryType(e.target.value)}
              className="input-field w-auto text-sm py-2"
            >
              <option value="all">Tous les types</option>
              <option value="card_purchase">Achat de carte</option>
              <option value="card_reload">Recharge</option>
            </select>
            <select
              value={historyStatus}
              onChange={e => setHistoryStatus(e.target.value)}
              className="input-field w-auto text-sm py-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Réussi</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
          <div className="card p-5">
            {historyLoading ? (
              <div className="text-center py-10">
                <Loader2 size={28} className="text-brand-orange mx-auto mb-3 animate-spin" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-10">
                <TrendingUp size={36} className="text-ink-muted mx-auto mb-3" />
                <p className="text-ink-secondary">Aucune transaction pour l'instant</p>
              </div>
            ) : (
              <>
                {historyItems.map(tx => <TxItem key={tx.id} tx={tx} />)}
                <Pagination page={historyPage} hasMore={historyHasMore} onChange={setHistoryPage} loading={historyLoading} />
              </>
            )}
          </div>
        </div>
      );

      case 'notifications': return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Notifications</h2>
            {unread > 0 && (
              <button onClick={markAllAsRead}
                className="text-xs font-medium text-brand-orange hover:text-brand-orange/70 transition-colors flex items-center gap-1">
                <CheckCircle size={13} /> Tout marquer comme lu
              </button>
            )}
          </div>
          <select
            value={notifFilter}
            onChange={e => setNotifFilter(e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
          </select>
          {notifLoading ? (
            <div className="card p-8 text-center">
              <Loader2 size={28} className="text-brand-orange mx-auto animate-spin" />
            </div>
          ) : notifItems.length === 0 ? (
            <div className="card p-8 text-center">
              <Bell size={36} className="text-ink-muted mx-auto mb-3" />
              <p className="text-ink-secondary">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifItems.map(n => (
                <div key={n.id} onClick={() => markAsRead(n.id)}
                  className={`card p-4 transition-all select-none ${!n.read ? 'border-l-4 border-brand-orange cursor-pointer hover:shadow-card-hover active:scale-[0.99]' : 'opacity-75'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.type === '3ds_required' ? 'bg-red-50' : 'bg-brand-orange-light'}`}>
                      {n.type === '3ds_required'
                        ? <AlertCircle size={16} className="text-red-500" />
                        : <Bell size={16} className="text-brand-orange" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-ink-secondary text-xs mt-0.5">{n.message}</div>
                      <div className="text-ink-muted text-[11px] mt-1">{formatDateTime(n.createdAt)}</div>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-brand-orange rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
              <Pagination page={notifPage} hasMore={notifHasMore} onChange={setNotifPage} loading={notifLoading} />
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="stripes-light min-h-screen">
      <Sidebar active={tab} onNav={setTab} onLogout={logout} userName={appUser?.displayName || 'Utilisateur'} unread={unread} />
      <MobileTopBar onMenu={() => setDrawerOpen(true)} unread={unread} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} active={tab} onNav={setTab}
        onLogout={logout} userName={appUser?.displayName || 'Utilisateur'} unread={unread} />
      <div className="main-with-sidebar">
        <main className="p-5 sm:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-ink-muted">
              <Loader2 size={24} className="animate-spin mr-3" /> Chargement...
            </div>
          ) : renderContent()}
        </main>
      </div>
      <BottomNav active={tab} onNav={setTab} unread={unread} />

      {showBuy && (
        <BuyModal
          onClose={() => setShowBuy(false)}
          country={appUser?.country || 'BJ'}
          getToken={getToken}
          hasCards={hasCards}
        />
      )}
      {showReload && selectedCard && (
        <ReloadModal
          card={selectedCard}
          onClose={() => setShowReload(false)}
          country={appUser?.country || 'BJ'}
          getToken={getToken}
        />
      )}
      {showWithdraw && selectedCard && (
        <WithdrawModal
          card={selectedCard}
          onClose={() => setShowWithdraw(false)}
          getToken={getToken}
          onSuccess={(msg) => { setToast({ message: msg, type: 'success' }); fetchData(); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center animate-pulse-soft">
          <CreditCard size={22} className="text-white" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}