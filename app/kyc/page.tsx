'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/date';
import { Logo as LogoComponent } from '@/components/Logo';
import { SidebarLogo } from '@/components/SidebarLogo';
import {
  Shield, CheckCircle, Clock, XCircle, ArrowRight, ArrowLeft,
  Upload, Camera, CreditCard, Zap, AlertCircle,
  RefreshCw, ChevronRight, X, Eye,
  Home, TrendingUp, Bell, Menu, User, LogOut, Gift,
} from 'lucide-react';

type KycStatus = 'approved' | 'rejected' | 'pending' | 'in_review' | null;
type KycMethod = 'didit' | 'manual' | null;

interface KycData {
  status: KycStatus;
  method: KycMethod;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
}

// ── Compression image ────────────────────────────────────────────
async function compressImage(file: File, maxWidthPx = 1200, qualityJpeg = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidthPx) { height = Math.round((height * maxWidthPx) / width); width = maxWidthPx; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', qualityJpeg));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Image preview ────────────────────────────────────────────────
function ImagePreview({ src, label, onRemove }: { src: string; label: string; onRemove: () => void }) {
  const [showFull, setShowFull] = useState(false);
  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden border-2 border-brand-green bg-brand-green-light">
        <img src={src} alt={label} className="w-full h-36 object-cover cursor-pointer" onClick={() => setShowFull(true)} />
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => setShowFull(true)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white">
            <Eye size={13} className="text-ink-secondary" />
          </button>
          <button onClick={onRemove} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white">
            <X size={13} className="text-red-500" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
          <span className="text-white text-xs font-medium flex items-center gap-1">
            <CheckCircle size={11} />{label}
          </span>
        </div>
      </div>
      {showFull && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowFull(false)}>
          <img src={src} alt={label} className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}

// ── Upload zone ──────────────────────────────────────────────────
function UploadZone({ label, hint, icon, value, onChange }: {
  label: string; hint: string; icon: React.ReactNode;
  value: string | null; onChange: (b64: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    try { onChange(await compressImage(file, 1200, 0.82)); }
    finally { setLoading(false); }
  };

  if (value) return null;

  return (
    <div
      className="border-2 border-dashed border-surface-border rounded-2xl p-5 text-center cursor-pointer hover:border-brand-orange/50 hover:bg-brand-orange-light/30 transition-all"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
    >
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      <div className="w-10 h-10 bg-brand-orange-light rounded-2xl flex items-center justify-center mx-auto mb-2">
        {loading ? <RefreshCw size={18} className="text-brand-orange animate-spin" /> : icon}
      </div>
      <div className="font-medium text-sm mb-0.5">{label}</div>
      <div className="text-ink-muted text-xs">{hint}</div>
      <div className="text-ink-muted text-[11px] mt-1">Glisser-déposer ou cliquer · JPG/PNG · max 5 MB</div>
    </div>
  );
}

// ── Status banner ────────────────────────────────────────────────
function StatusBanner({ kyc }: { kyc: KycData }) {
  if (kyc.status === 'approved') {
    return (
      <div className="bg-brand-green-light border border-brand-green/30 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center flex-shrink-0">
          <CheckCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-green-800 mb-1">Identité vérifiée</h3>
          <p className="text-green-700 text-sm">Votre identité a été confirmée. Vous pouvez maintenant acheter votre carte virtuelle.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-3 btn-primary text-sm py-2">
            Aller au tableau de bord <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (kyc.status === 'pending' || kyc.status === 'in_review') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Clock size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-yellow-800 mb-1">Vérification en cours</h3>
          <p className="text-yellow-700 text-sm">
            {kyc.method === 'manual'
              ? "Votre dossier est en cours d'examen par notre équipe. Vous recevrez une notification dès la décision."
              : 'Votre vérification automatique est en cours de traitement.'}
          </p>
          {kyc.method === 'manual' && kyc.submittedAt && (
            <p className="text-yellow-600 text-xs mt-1.5">
              Soumis le {formatDate(kyc.submittedAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (kyc.status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <XCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-red-800 mb-1">Vérification refusée</h3>
          {kyc.rejectionReason && (
            <p className="text-red-700 text-sm mb-2">Raison : <strong>{kyc.rejectionReason}</strong></p>
          )}
          <p className="text-red-600 text-sm">Vous pouvez soumettre à nouveau votre dossier en choisissant une méthode ci-dessous.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Stepper ──────────────────────────────────────────────────────
function KycStepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Méthode' },
    { n: 2, label: 'Documents' },
    { n: 3, label: 'Résultat' },
  ];
  return (
    <div className="flex items-center mb-7">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step > s.n ? 'bg-brand-green text-white'
                : step === s.n ? 'bg-brand-orange text-white shadow-orange'
                : 'bg-surface-muted text-ink-muted border border-surface-border'}`}>
              {step > s.n ? <CheckCircle size={15} /> : s.n}
            </div>
            <span className={`text-[11px] font-medium ${step >= s.n ? 'text-ink-primary' : 'text-ink-muted'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors ${step > s.n ? 'bg-brand-green' : 'bg-surface-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main KYC Page ────────────────────────────────────────────────
// ── Logo ──────────────────────────────────────────────────────────
function Logo() {
  return <LogoComponent />;
}

// ── Sidebar ───────────────────────────────────────────────────────
function Sidebar({ onLogout, userName }: { onLogout: () => void; userName: string }) {
  const items = [
    { id: 'home', label: 'Accueil', icon: <Home size={18} />, href: '/dashboard?tab=home' },
    { id: 'card', label: 'Mes cartes', icon: <CreditCard size={18} />, href: '/dashboard?tab=card' },
    { id: 'giftcards', label: 'Cartes cadeaux', icon: <Gift size={18} />, href: '/giftcards' },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={18} />, href: '/dashboard?tab=history' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, href: '/dashboard?tab=notifications' },
  ];
  return (
    <aside className="sidebar-fixed hidden md:flex flex-col stripes-dark text-white border-r-0">
      <div className="py-5 border-b border-white/10"><SidebarLogo /></div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <Link key={item.id} href={item.href}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150">
            {item.icon}
            <span>{item.label}</span>
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
          <User size={16} /> Mon profil
        </Link>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
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
      <Link href="/dashboard?tab=notifications" className="relative w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center">
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </div>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────
function MobileDrawer({ open, onClose, onLogout, userName }: {
  open: boolean; onClose: () => void; onLogout: () => void; userName: string;
}) {
  const items = [
    { label: 'Accueil', icon: <Home size={18} />, href: '/dashboard?tab=home' },
    { label: 'Mes cartes', icon: <CreditCard size={18} />, href: '/dashboard?tab=card' },
    { label: 'Cartes cadeaux', icon: <Gift size={18} />, href: '/giftcards' },
    { label: 'Historique', icon: <TrendingUp size={18} />, href: '/dashboard?tab=history' },
    { label: 'Notifications', icon: <Bell size={18} />, href: '/dashboard?tab=notifications' },
  ];
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-72 stripes-dark text-white z-50 flex flex-col shadow-2xl md:hidden">
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="w-36"><SidebarLogo /></div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><X size={15} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(item => (
            <Link key={item.label} href={item.href} onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all">
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-orange-light rounded-xl flex items-center justify-center">
              <span className="text-brand-orange text-xs font-bold">{userName[0]?.toUpperCase()}</span>
            </div>
            <div className="text-sm font-medium truncate">{userName}</div>
          </div>
          <Link href="/profile" onClick={onClose}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mb-1">
            <User size={16} /> Mon profil
          </Link>
          <button onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

export default function KycPage() {
  const router = useRouter();
  const { firebaseUser, appUser, loading: authLoading, getToken, logout } = useAuth();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [mode, setMode] = useState<'choose' | 'didit' | 'manual'>('choose');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitDone, setSubmitDone] = useState(false);

  const [diditLoading, setDiditLoading] = useState(false);
  const [diditError, setDiditError] = useState('');

  const fetchKyc = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setKyc(data.data);
    } finally { setPageLoading(false); }
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) router.push('/auth/login');
    if (firebaseUser) fetchKyc();
  }, [firebaseUser, authLoading, router, fetchKyc]);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setUnreadCount(data.data.filter((n: { read: boolean }) => !n.read).length);
      } catch { /* non bloquant */ }
    })();
  }, [firebaseUser, getToken]);

  const isManualLocked = kyc?.method === 'manual' && kyc?.status === 'pending';
  const showChoiceBlock = !kyc || kyc.status === 'rejected' || !kyc.status || kyc.method !== 'manual' || kyc.status !== 'pending';

  const handleDidit = async () => {
    setDiditLoading(true); setDiditError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/start', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) { setDiditError(data.error); setDiditLoading(false); return; }
      window.location.href = data.data.url;
    } catch { setDiditError('Erreur réseau.'); setDiditLoading(false); }
  };

  const handleManualSubmit = async () => {
    if (!idFront || !idBack || !selfie) { setSubmitError('Veuillez fournir les 3 photos.'); return; }
    setSubmitLoading(true); setSubmitError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idFront, idBack, selfie }),
      });
      const data = await res.json();
      if (!data.success) { setSubmitError(data.error); setSubmitLoading(false); return; }
      setSubmitDone(true);
      await fetchKyc();
    } catch { setSubmitError('Erreur réseau.'); setSubmitLoading(false); }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen stripes-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <Shield size={22} className="text-white" />
          </div>
          <p className="text-ink-secondary text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stripes-light min-h-screen">
      <Sidebar onLogout={logout} userName={appUser?.displayName || 'Utilisateur'} />
      <MobileTopBar onMenu={() => setDrawerOpen(true)} unread={unreadCount} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={logout}
        userName={appUser?.displayName || 'Utilisateur'}
      />

      <div className="main-with-sidebar">
        <main className="max-w-2xl mx-auto px-5 py-8 pt-20 md:pt-8 pb-24 md:pb-8">

        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink-primary text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Retour au tableau de bord
        </Link>

        {/* Hero */}
        <div className="card p-6 sm:p-7 mb-6 flex items-start gap-4">
          <div className="w-14 h-14 bg-brand-orange-light rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield size={26} className="text-brand-orange" />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-surface-muted border border-surface-border rounded-full px-3 py-1 text-xs text-ink-secondary font-semibold mb-2">
              Vérification d'identité · Optionnel
            </div>
            <h1 className="text-2xl font-bold mb-1.5">Vérifiez votre identité</h1>
            <p className="text-ink-secondary text-sm leading-relaxed">
              La vérification d'identité n'est pas obligatoire pour utiliser votre carte, mais elle peut débloquer des limites plus élevées et un support prioritaire.
            </p>
          </div>
        </div>

        {/* Steps */}
        <KycStepper step={
          kyc?.status === 'approved' ? 3
          : (submitDone || kyc?.status === 'pending' || kyc?.status === 'in_review') ? 3
          : mode !== 'choose' ? 2
          : 1
        } />

        {/* Status banner */}
        {kyc && kyc.status && <div className="mb-8"><StatusBanner kyc={kyc} /></div>}

        {kyc?.status === 'approved' ? null : (
          <>
            {/* Choix méthode */}
            {mode === 'choose' && showChoiceBlock && !isManualLocked && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="font-semibold text-lg">Choisissez votre méthode de vérification</h2>

                <button onClick={() => setMode('didit')}
                  className="w-full card p-5 text-left hover:shadow-card-hover transition-shadow border-2 hover:border-brand-orange/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Zap size={22} className="text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Vérification automatique</span>
                        <span className="badge-green text-[11px]">Recommandée</span>
                      </div>
                      <p className="text-ink-secondary text-sm leading-relaxed">
                        Vérification instantanée via Didit. Scannez votre pièce d'identité et faites un selfie. Résultat en quelques secondes.
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />220+ pays</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />14 000+ documents</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />Résultat immédiat</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-muted mt-1 flex-shrink-0" />
                  </div>
                </button>

                <button onClick={() => setMode('manual')}
                  className="w-full card p-5 text-left hover:shadow-card-hover transition-shadow border-2 hover:border-brand-orange/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-orange-light rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Upload size={22} className="text-brand-orange" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Vérification manuelle</span>
                        <span className="badge-gray text-[11px]">1–24h</span>
                      </div>
                      <p className="text-ink-secondary text-sm leading-relaxed">
                        Envoyez une photo de votre pièce d'identité recto, verso et un selfie. Notre équipe examine votre dossier.
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />Examen humain</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />Sécurisé</span>
                        <span className="flex items-center gap-1"><Clock size={11} className="text-yellow-500" />1 à 24 heures</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-muted mt-1 flex-shrink-0" />
                  </div>
                </button>
              </div>
            )}

            {/* Mode Didit */}
            {mode === 'didit' && (
              <div className="card p-6 animate-fade-in">
                <button onClick={() => setMode('choose')} className="flex items-center gap-1.5 text-ink-secondary text-sm mb-5 hover:text-ink-primary transition-colors">
                  ← Retour
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Zap size={30} className="text-blue-500" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Vérification automatique</h3>
                  <p className="text-ink-secondary text-sm mb-6 max-w-sm mx-auto">
                    Vous allez être redirigé vers notre partenaire Didit pour une vérification instantanée. Gardez votre pièce d'identité à portée de main.
                  </p>
                  <div className="bg-surface-muted rounded-2xl p-4 mb-6 text-left space-y-2">
                    {[
                      "Votre pièce d'identité (CNI, passeport ou permis)",
                      'Bonne luminosité pour le selfie',
                      '2 à 5 minutes de votre temps',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-ink-secondary">
                        <CheckCircle size={14} className="text-brand-green flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  {diditError && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{diditError}</div>}
                  <button onClick={handleDidit} disabled={diditLoading} className="btn-primary w-full py-3.5">
                    {diditLoading ? 'Redirection en cours...' : 'Démarrer la vérification →'}
                  </button>
                </div>
              </div>
            )}

            {/* Mode Manuel */}
            {mode === 'manual' && !isManualLocked && (
              <div className="card p-6 animate-fade-in">
                <button onClick={() => setMode('choose')} className="flex items-center gap-1.5 text-ink-secondary text-sm mb-5 hover:text-ink-primary transition-colors">
                  ← Retour
                </button>

                {submitDone ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-brand-green-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-brand-green" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Dossier soumis</h3>
                    <p className="text-ink-secondary text-sm mb-5">Notre équipe examine votre dossier. Vous recevrez une notification dans les 24 heures.</p>
                    <Link href="/dashboard" className="btn-primary">Retour au tableau de bord</Link>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-xl mb-1">Vérification manuelle</h3>
                    <p className="text-ink-secondary text-sm mb-6">
                      Fournissez 3 photos claires. Les images sont compressées automatiquement.
                    </p>

                    <div className="bg-brand-orange-light border border-brand-orange/20 rounded-2xl p-4 mb-5">
                      <p className="text-brand-orange font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <AlertCircle size={15} />Instructions importantes
                      </p>
                      <ul className="text-sm text-brand-orange-dark space-y-1 list-disc pl-4">
                        <li>Photos nettes et lisibles, sans reflet ni flou</li>
                        <li>Selfie : tenez votre pièce d'identité à côté de votre visage</li>
                        <li>Bonne luminosité, fond uni de préférence</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      {/* Recto */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-brand-orange-light rounded-lg flex items-center justify-center">
                            <CreditCard size={13} className="text-brand-orange" />
                          </div>
                          Recto de la pièce d'identité
                        </label>
                        {idFront
                          ? <ImagePreview src={idFront} label="Recto" onRemove={() => setIdFront(null)} />
                          : <UploadZone label="Recto" hint="Face avant de votre CNI, passeport ou permis" icon={<CreditCard size={18} className="text-brand-orange" />} value={idFront} onChange={setIdFront} />
                        }
                      </div>

                      {/* Verso */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-brand-orange-light rounded-lg flex items-center justify-center">
                            <CreditCard size={13} className="text-brand-orange" />
                          </div>
                          Verso de la pièce d'identité
                        </label>
                        {idBack
                          ? <ImagePreview src={idBack} label="Verso" onRemove={() => setIdBack(null)} />
                          : <UploadZone label="Verso" hint="Face arrière de votre pièce d'identité" icon={<CreditCard size={18} className="text-brand-orange" />} value={idBack} onChange={setIdBack} />
                        }
                      </div>

                      {/* Selfie */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-brand-orange-light rounded-lg flex items-center justify-center">
                            <Camera size={13} className="text-brand-orange" />
                          </div>
                          Selfie avec la pièce d'identité
                        </label>
                        {selfie
                          ? <ImagePreview src={selfie} label="Selfie" onRemove={() => setSelfie(null)} />
                          : <UploadZone label="Selfie" hint="Tenez votre pièce d'identité visible à côté de votre visage" icon={<Camera size={18} className="text-brand-orange" />} value={selfie} onChange={setSelfie} />
                        }
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2 mt-4 mb-5">
                      {[idFront, idBack, selfie].map((v, i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${v ? 'bg-brand-green' : 'bg-surface-border'}`} />
                      ))}
                      <span className="text-xs text-ink-muted ml-1">{[idFront, idBack, selfie].filter(Boolean).length}/3</span>
                    </div>

                    {submitError && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{submitError}</div>}

                    <button
                      onClick={handleManualSubmit}
                      disabled={submitLoading || !idFront || !idBack || !selfie}
                      className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitLoading ? 'Envoi en cours...' : 'Soumettre mon dossier →'}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        </main>
      </div>
    </div>
  );
}