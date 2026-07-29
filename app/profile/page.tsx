'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime } from '@/lib/date';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/types';
import { Logo as LogoComponent } from '@/components/Logo';
import { SidebarLogo } from '@/components/SidebarLogo';
import {
  CreditCard, ArrowLeft, User, Mail, Phone, Globe,
  Lock, Eye, EyeOff, CheckCircle, XCircle, Clock,
  Shield, AlertCircle, ChevronRight, Save, Loader2,
  LogOut, Bell, Home, TrendingUp, Menu, X, Camera,
  Edit3, Check,
} from 'lucide-react';

// ── Country list (Africa-first) ───────────────────────────────────
const COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'CD', name: 'Congo (RDC)', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo (Brazzaville)', flag: '🇨🇬' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
];

type KycStatus = 'approved' | 'rejected' | 'pending' | 'in_review' | null;

interface KycData {
  status: KycStatus;
  method?: 'didit' | 'manual' | null;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
}

// ── Logo ──────────────────────────────────────────────────────────
function Logo() {
  return <LogoComponent />;
}

// ── Sidebar ───────────────────────────────────────────────────────
function Sidebar({ onLogout, userName }: { onLogout: () => void; userName: string }) {
  const items = [
    { id: 'home', label: 'Accueil', icon: <Home size={18} />, href: '/dashboard' },
    { id: 'card', label: 'Mes cartes', icon: <CreditCard size={18} />, href: '/dashboard' },
    { id: 'history', label: 'Historique', icon: <TrendingUp size={18} />, href: '/dashboard' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, href: '/dashboard' },
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
        <div className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium bg-brand-orange text-white shadow-orange mb-1">
          <User size={16} /> Mon profil
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ── Mobile top bar ────────────────────────────────────────────────
function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-white border-b border-surface-border px-4 h-14 flex items-center justify-between">
      <button onClick={onMenu} className="w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center">
        <Menu size={18} />
      </button>
      <Logo />
      <div className="w-9" />
    </div>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────
function MobileDrawer({ open, onClose, onLogout, userName }: {
  open: boolean; onClose: () => void; onLogout: () => void; userName: string;
}) {
  const items = [
    { label: 'Accueil', icon: <Home size={18} />, href: '/dashboard' },
    { label: 'Mes cartes', icon: <CreditCard size={18} />, href: '/dashboard' },
    { label: 'Historique', icon: <TrendingUp size={18} />, href: '/dashboard' },
    { label: 'Notifications', icon: <Bell size={18} />, href: '/dashboard' },
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
          <div className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium bg-brand-orange text-white shadow-orange mb-1">
            <User size={16} /> Mon profil
          </div>
          <button onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

// ── KYC Badge ─────────────────────────────────────────────────────
function KycBadge({ status }: { status: KycStatus }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1.5 bg-brand-green-light border border-brand-green/20 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
      <CheckCircle size={12} className="text-brand-green" /> Vérifié
    </span>
  );
  if (status === 'pending' || status === 'in_review') return (
    <span className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
      <Clock size={12} /> En attente
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
      <XCircle size={12} /> Refusé
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 bg-surface-muted border border-surface-border text-ink-muted text-xs font-semibold px-3 py-1 rounded-full">
      <AlertCircle size={12} /> Non vérifié
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 sm:p-7">
      <div className="mb-5">
        <h2 className="font-bold text-lg">{title}</h2>
        {subtitle && <p className="text-ink-secondary text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up
      ${type === 'success' ? 'bg-brand-green text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {message}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, appUser, logout, getToken, loading: authLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // KYC
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !firebaseUser) { router.push('/auth/login'); return; }
    if (appUser) {
      setDisplayName(appUser.displayName || '');
      setPhone(appUser.phone || '');
      setCountry(appUser.country || '');
    }
  }, [firebaseUser, appUser, authLoading, router]);

  // ── Fetch KYC ───────────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/kyc/status', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setKyc(data.data);
      } finally { setKycLoading(false); }
    })();
  }, [firebaseUser, getToken]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // ── Save profile ────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!firebaseUser) return;
    if (!displayName.trim()) { showToast('Le nom est requis.', 'error'); return; }
    setProfileLoading(true);
    try {
      // Update Firebase Auth displayName
      await updateProfile(firebaseUser, { displayName: displayName.trim() });

      // Update Firestore user doc
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: displayName.trim(),
        phone: phone.trim(),
        country,
      });

      setProfileSuccess(true);
      showToast('Profil mis à jour avec succès.', 'success');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!firebaseUser || !firebaseUser.email) return;
    if (!currentPwd) { showToast('Saisissez votre mot de passe actuel.', 'error'); return; }
    if (newPwd.length < 8) { showToast('Le nouveau mot de passe doit faire au moins 8 caractères.', 'error'); return; }
    if (newPwd !== confirmPwd) { showToast('Les mots de passe ne correspondent pas.', 'error'); return; }

    setPwdLoading(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPwd);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Then update
      await updatePassword(firebaseUser, newPwd);

      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showToast('Mot de passe modifié avec succès.', 'success');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        showToast('Mot de passe actuel incorrect.', 'error');
      } else {
        showToast(err.message || 'Erreur lors du changement de mot de passe.', 'error');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Password strength ───────────────────────────────────────────
  const pwdStrength = (() => {
    if (!newPwd) return null;
    let score = 0;
    if (newPwd.length >= 8) score++;
    if (/[A-Z]/.test(newPwd)) score++;
    if (/[0-9]/.test(newPwd)) score++;
    if (/[^A-Za-z0-9]/.test(newPwd)) score++;
    if (score <= 1) return { label: 'Faible', color: 'bg-red-400', width: 'w-1/4' };
    if (score === 2) return { label: 'Moyen', color: 'bg-yellow-400', width: 'w-2/4' };
    if (score === 3) return { label: 'Bon', color: 'bg-blue-400', width: 'w-3/4' };
    return { label: 'Excellent', color: 'bg-brand-green', width: 'w-full' };
  })();

  if (authLoading) {
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

  const userName = appUser?.displayName || firebaseUser?.displayName || 'Utilisateur';
  const userInitials = userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const countryObj = COUNTRIES.find(c => c.code === (appUser?.country || country));

  return (
    <div className="stripes-light min-h-screen">
      <Sidebar onLogout={logout} userName={userName} />
      <MobileTopBar onMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={logout} userName={userName} />

      <div className="main-with-sidebar">
        <main className="p-5 sm:p-8 pt-20 md:pt-8 pb-24 md:pb-8 max-w-8xl">

          {/* ── Back link + Header ─────────────────────────────── */}
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink-primary text-sm mb-6 transition-colors">
            <ArrowLeft size={15} /> Retour au tableau de bord
          </Link>

          {/* ── Profile hero ───────────────────────────────────── */}
          <div className="card p-6 sm:p-7 mb-5">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-orange to-orange-600 rounded-3xl flex items-center justify-center shadow-orange">
                  <span className="text-white text-2xl font-bold">{userInitials}</span>
                </div>
                {/* Verified tick */}
                {kyc?.status === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-green rounded-full flex items-center justify-center border-2 border-white">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-xl font-bold truncate">{userName}</h1>
                    <p className="text-ink-secondary text-sm">{appUser?.email || firebaseUser?.email}</p>
                  </div>
                  <KycBadge status={kyc?.status || null} />
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-ink-muted">
                  {countryObj && (
                    <span className="flex items-center gap-1">
                      <span>{countryObj.flag}</span> {countryObj.name}
                    </span>
                  )}
                  {appUser?.status && (
                    <span className={`flex items-center gap-1 font-medium ${appUser.status === 'active' ? 'text-brand-green' : 'text-red-500'}`}>
                      ● {appUser.status === 'active' ? 'Compte actif' : 'Suspendu'}
                    </span>
                  )}
                  {appUser?.createdAt && (
                    <span>Membre depuis {formatDate(appUser.createdAt, { month: 'long', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sections ──────────────────────────────────────── */}
          <div className="space-y-5">

            {/* 1 — Informations personnelles */}
            <Section title="Informations personnelles" subtitle="Modifiez vos informations de profil.">
              <div className="space-y-4">
                {/* Nom complet */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom complet</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Votre nom complet"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Email (lecture seule) */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Adresse email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="email"
                      value={appUser?.email || firebaseUser?.email || ''}
                      readOnly
                      className="input-field pl-10 bg-surface-muted text-ink-muted cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-ink-muted text-xs mt-1">L'email ne peut pas être modifié.</p>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Téléphone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+229 97 00 00 00"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Pays</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="input-field pl-10 appearance-none"
                    >
                      <option value="">Sélectionnez votre pays</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                >
                  {profileLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                    : profileSuccess
                    ? <><CheckCircle size={16} /> Enregistré !</>
                    : <><Save size={16} /> Enregistrer les modifications</>}
                </button>
              </div>
            </Section>

            {/* 2 — Statut KYC */}
            <Section title="Vérification d'identité (KYC)" subtitle="Statut de votre dossier de vérification.">
              {kycLoading ? (
                <div className="flex items-center gap-2 text-ink-muted text-sm py-2">
                  <Loader2 size={16} className="animate-spin" /> Chargement du statut...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status card */}
                  <div className={`rounded-2xl p-4 flex items-start gap-4 border
                    ${kyc?.status === 'approved' ? 'bg-brand-green-light border-brand-green/20'
                    : kyc?.status === 'pending' || kyc?.status === 'in_review' ? 'bg-yellow-50 border-yellow-200'
                    : kyc?.status === 'rejected' ? 'bg-red-50 border-red-200'
                    : 'bg-surface-muted border-surface-border'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
                      ${kyc?.status === 'approved' ? 'bg-brand-green'
                      : kyc?.status === 'pending' || kyc?.status === 'in_review' ? 'bg-yellow-400'
                      : kyc?.status === 'rejected' ? 'bg-red-500'
                      : 'bg-surface-border'}`}>
                      {kyc?.status === 'approved' ? <Shield size={18} className="text-white" />
                        : kyc?.status === 'pending' || kyc?.status === 'in_review' ? <Clock size={18} className="text-white" />
                        : kyc?.status === 'rejected' ? <XCircle size={18} className="text-white" />
                        : <AlertCircle size={18} className="text-ink-muted" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {kyc?.status === 'approved' ? 'Identité vérifiée'
                          : kyc?.status === 'pending' ? 'Vérification en attente'
                          : kyc?.status === 'in_review' ? 'Dossier en cours d\'examen'
                          : kyc?.status === 'rejected' ? 'Vérification refusée'
                          : 'Non vérifié'}
                      </div>
                      <div className="text-xs mt-0.5 text-ink-secondary">
                        {kyc?.status === 'approved' && kyc.approvedAt
                          ? `Approuvé le ${formatDate(kyc.approvedAt)}`
                          : kyc?.status === 'pending' || kyc?.status === 'in_review'
                          ? kyc.method === 'manual'
                            ? 'Examen manuel en cours — délai : 1 à 24 h'
                            : 'Vérification automatique en cours...'
                          : kyc?.status === 'rejected'
                          ? kyc.rejectionReason || 'Documents invalides ou illisibles.'
                          : "Vous n'avez pas encore soumis de dossier KYC."}
                      </div>
                      {kyc?.submittedAt && kyc.status !== 'approved' && (
                        <div className="text-[11px] text-ink-muted mt-1">
                          Soumis le {formatDate(kyc.submittedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-surface-muted rounded-2xl p-3">
                      <div className="text-ink-muted text-xs mb-0.5">Méthode</div>
                      <div className="font-medium">
                        {kyc?.method === 'didit' ? '🤖 Automatique' : kyc?.method === 'manual' ? '👤 Manuel' : '—'}
                      </div>
                    </div>
                    <div className="bg-surface-muted rounded-2xl p-3">
                      <div className="text-ink-muted text-xs mb-0.5">Statut</div>
                      <div className="font-medium"><KycBadge status={kyc?.status || null} /></div>
                    </div>
                  </div>

                  {/* Action */}
                  {kyc?.status !== 'approved' && (
                    <Link href="/kyc"
                      className="w-full btn-primary py-3.5 flex items-center justify-center gap-2">
                      {kyc?.status === 'rejected' ? 'Recommencer la vérification' : 'Démarrer la vérification'}
                      <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              )}
            </Section>

            {/* 3 — Sécurité / Mot de passe */}
            <Section title="Sécurité" subtitle="Modifiez votre mot de passe de connexion.">
              <div className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mot de passe actuel</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-10 pr-11"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors">
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="input-field pl-10 pr-11"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors">
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {pwdStrength && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pwdStrength.color} ${pwdStrength.width}`} />
                      </div>
                      <p className={`text-xs mt-1 font-medium
                        ${pwdStrength.label === 'Faible' ? 'text-red-500'
                        : pwdStrength.label === 'Moyen' ? 'text-yellow-600'
                        : pwdStrength.label === 'Bon' ? 'text-blue-500'
                        : 'text-brand-green'}`}>
                        Force : {pwdStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      placeholder="••••••••"
                      className={`input-field pl-10 pr-11 ${confirmPwd && confirmPwd !== newPwd ? 'border-red-300 focus:ring-red-200' : ''}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <XCircle size={11} /> Les mots de passe ne correspondent pas.
                    </p>
                  )}
                  {confirmPwd && confirmPwd === newPwd && newPwd.length >= 8 && (
                    <p className="text-brand-green text-xs mt-1 flex items-center gap-1">
                      <CheckCircle size={11} /> Mots de passe identiques.
                    </p>
                  )}
                </div>

                {/* Requirements */}
                <div className="bg-surface-muted rounded-2xl p-3 space-y-1">
                  {[
                    { ok: newPwd.length >= 8, label: 'Au moins 8 caractères' },
                    { ok: /[A-Z]/.test(newPwd), label: 'Une lettre majuscule' },
                    { ok: /[0-9]/.test(newPwd), label: 'Un chiffre' },
                    { ok: /[^A-Za-z0-9]/.test(newPwd), label: 'Un caractère spécial' },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      {ok
                        ? <CheckCircle size={12} className="text-brand-green flex-shrink-0" />
                        : <div className="w-3 h-3 rounded-full border border-ink-muted flex-shrink-0" />}
                      <span className={ok ? 'text-brand-green font-medium' : 'text-ink-muted'}>{label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={pwdLoading || !currentPwd || newPwd.length < 8 || newPwd !== confirmPwd}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pwdLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Modification...</>
                    : <><Lock size={16} /> Modifier le mot de passe</>}
                </button>

                {/* Reset link */}
                <p className="text-center text-xs text-ink-muted">
                  Mot de passe oublié ?{' '}
                  <Link href="/auth/reset" className="text-brand-orange hover:underline font-medium">
                    Réinitialiser par email
                  </Link>
                </p>
              </div>
            </Section>

            {/* 4 — Compte */}
            <Section title="Mon compte" subtitle="Informations et statut de votre compte.">
              <div className="space-y-3">
                {[
                  { label: 'Identifiant', value: appUser?.uid?.slice(0, 16) + '…' || '—' },
                  { label: 'Rôle', value: appUser?.role === 'admin' ? '🛡 Administrateur' : '👤 Utilisateur' },
                  { label: 'Statut du compte', value: appUser?.status === 'active' ? '● Actif' : '⚠ Suspendu',
                    valueClass: appUser?.status === 'active' ? 'text-brand-green' : 'text-red-500' },
                  { label: 'Membre depuis', value: appUser?.createdAt
                    ? formatDate(appUser.createdAt)
                    : '—' },
                ].map(({ label, value, valueClass }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
                    <span className="text-ink-secondary text-sm">{label}</span>
                    <span className={`text-sm font-medium ${valueClass || ''}`}>{value}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* 5 — Danger zone */}
            <div className="card p-6 border border-red-100">
              <h2 className="font-bold text-lg mb-1 text-red-600">Zone de danger</h2>
              <p className="text-ink-secondary text-sm mb-4">Actions irréversibles concernant votre compte.</p>
              <button
                onClick={async () => { await logout(); router.push('/'); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Se déconnecter de tous les appareils
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}