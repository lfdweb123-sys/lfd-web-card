'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime } from '@/lib/date';
import { Logo as LogoComponent } from '@/components/Logo';
import { Pagination } from '@/components/Pagination';
import { SidebarLogo } from '@/components/SidebarLogo';
import {
  Users, CreditCard, TrendingUp, Activity, LogOut, Shield, Loader2,
  CheckCircle, Ban, UserCheck, Search, Home,
  RefreshCw, ClipboardList, Menu, X, ArrowDownLeft, Send, Gift, MessageSquare, Plus, Edit3, Power, Mail, Bell, ShieldAlert, ShieldOff
} from 'lucide-react';

interface AdminStats {
  totalUsers: number; totalCards: number; activeCards: number;
  totalTransactions: number; totalRevenue: number; recentTransactions: AdminTx[];
}
interface AdminUser {
  id: string; email: string; displayName: string;
  role: string; status: string; country: string; createdAt: string;
  kycRequired?: boolean;
}
interface AdminTx { id: string; type: string; amount: number; status: string; createdAt: string; }

function Logo() {
  return <LogoComponent />;
}

const NAV_ITEMS = [
  { id: 'overview', label: "Vue d'ensemble", icon: <Home size={18} /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <TrendingUp size={18} /> },
  { id: 'withdrawals', label: 'Retraits', icon: <ArrowDownLeft size={18} /> },
  { id: 'referrers', label: 'Parrains', icon: <Gift size={18} /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
];

// ── Sidebar desktop ───────────────────────────────────────────────
function Sidebar({ active, onNav, onLogout, email }: {
  active: string; onNav: (s: string) => void; onLogout: () => void; email: string;
}) {
  return (
    <aside className="sidebar-fixed hidden md:flex flex-col stripes-dark text-white border-r-0">
      <div className="py-5 border-b border-white/10">
        <SidebarLogo href="/admin" />
        <div className="mt-3 px-5"><span className="badge-orange text-[11px]">Admin</span></div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left
              ${active === item.id ? 'bg-brand-orange text-white shadow-orange' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
        <Link href="/admin/kyc"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left text-white/60 hover:bg-white/10 hover:text-white">
          <ClipboardList size={18} /><span>Vérifications KYC</span>
        </Link>
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-xs text-white/40 mb-3 truncate">{email}</div>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
          <LogOut size={16} />Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────
function MobileDrawer({ open, onClose, active, onNav, onLogout, email }: {
  open: boolean; onClose: () => void; active: string; onNav: (s: string) => void;
  onLogout: () => void; email: string;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-72 stripes-dark text-white z-50 flex flex-col shadow-2xl md:hidden">
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="w-36">
            <SidebarLogo href="/admin" />
            <div className="mt-2"><span className="badge-orange text-[11px]">Admin</span></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <X size={15} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { onNav(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left
                ${active === item.id ? 'bg-brand-orange text-white shadow-orange' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
          <Link href="/admin/kyc" onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left text-white/60 hover:bg-white/10 hover:text-white">
            <ClipboardList size={18} /><span>Vérifications KYC</span>
          </Link>
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-xs text-white/40 mb-3 truncate">{email}</div>
          <button onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors">
            <LogOut size={16} />Déconnexion
          </button>
        </div>
      </div>
    </>
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
      <div className="w-9 h-9 flex items-center justify-center">
        <Shield size={18} className="text-brand-orange" />
      </div>
    </div>
  );
}

// ── Bottom nav (mobile) ───────────────────────────────────────────
function BottomNav({ active, onNav }: { active: string; onNav: (s: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-surface-border">
      <div className="grid grid-cols-4 h-16">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => onNav(id)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active === id ? 'text-brand-orange' : 'text-ink-muted'}`}>
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
        <Link href="/admin/kyc"
          className="flex flex-col items-center justify-center gap-0.5 text-ink-muted">
          <ClipboardList size={20} />
          <span className="text-[10px] font-medium">KYC</span>
        </Link>
      </div>
    </nav>
  );
}

function TxBadge({ s }: { s: string }) {
  if (s === 'success' || s === 'completed') return <span className="badge-green">✓ Succès</span>;
  if (s === 'failed') return <span className="badge-red">✗ Échoué</span>;
  if (s === 'pending_payout') return <span className="badge-orange">◷ Virement en cours</span>;
  return <span className="badge-orange">◷ Attente</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const { appUser, firebaseUser, logout, getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const USERS_PAGE_SIZE = 10;

  // Onglet Transactions — liste dédiée paginée (distincte de l'aperçu overview)
  const [txItems, setTxItems] = useState<AdminTx[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txType, setTxType] = useState('all');
  const [txStatus, setTxStatus] = useState('all');

  // Onglet Retraits
  const [withdrawals, setWithdrawals] = useState<{ id: string; userId: string; cardId: string; amountUSD: number; amount: number; createdAt: string; status: string }[]>([]);
  const [wdPage, setWdPage] = useState(1);
  const [wdHasMore, setWdHasMore] = useState(false);
  const [wdLoading, setWdLoading] = useState(false);
  const [wdStatusFilter, setWdStatusFilter] = useState('pending_payout');
  const [wdActionId, setWdActionId] = useState<string | null>(null);
  const [wdReference, setWdReference] = useState<Record<string, string>>({});

  // Onglet Parrains
  const [referrers, setReferrers] = useState<{
    id: string; name: string; email: string; promoCode: string;
    commissionPerReload: number; totalReferred: number; totalEarningsXOF: number; unpaidXOF: number; active: boolean;
  }[]>([]);
  const [refPage, setRefPage] = useState(1);
  const [refHasMore, setRefHasMore] = useState(false);
  const [refLoading, setRefLoading] = useState(false);
  const [showCreateReferrer, setShowCreateReferrer] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState<string | null>(null);
  const [referrerForm, setReferrerForm] = useState({ name: '', email: '', password: '', promoCode: '', commissionPerReload: 25 });
  const [referrerActionLoading, setReferrerActionLoading] = useState(false);
  const [referrerError, setReferrerError] = useState('');
  const [payoutTarget, setPayoutTarget] = useState<{ id: string; name: string; unpaidXOF: number } | null>(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // Onglet Messages (diffusion email/push)
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'selected'>('all');
  const [broadcastChannels, setBroadcastChannels] = useState<string[]>(['email', 'push']);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastEmailBody, setBroadcastEmailBody] = useState('');
  const [broadcastPushTitle, setBroadcastPushTitle] = useState('');
  const [broadcastPushBody, setBroadcastPushBody] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [broadcastSearch, setBroadcastSearch] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ totalUsers: number; emailsSent: number; pushesSent: number } | null>(null);
  const [broadcastError, setBroadcastError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!firebaseUser) return;
    setError('');
    try {
      const token = await firebaseUser.getIdToken(true);
      const [s, u] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sd = await s.json();
      const ud = await u.json();
      if (sd.success) setStats(sd.data);
      else setError(sd.error || 'Erreur stats');
      if (ud.success) setUsers(ud.data);
      else if (!sd.success) setError(ud.error || 'Erreur users');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!appUser) return;
    if (appUser.role !== 'admin') { router.push('/dashboard'); return; }
    fetchAll();
  }, [appUser, router, fetchAll]);

  const userAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    const token = await firebaseUser!.getIdToken(true);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, action }),
    });
    const data = await res.json();
    if (data.success) { setMsg('Action effectuée.'); await fetchAll(); setTimeout(() => setMsg(''), 3000); }
    else setError(data.error || 'Erreur');
    setActionLoading(null);
  };

  const filtered = users.filter(u =>
    (u.email?.toLowerCase().includes(search.toLowerCase()) ||
     u.displayName?.toLowerCase().includes(search.toLowerCase())) &&
    (userStatusFilter === 'all' || u.status === userStatusFilter) &&
    (userRoleFilter === 'all' || u.role === userRoleFilter)
  );
  const pagedUsers = filtered.slice((userPage - 1) * USERS_PAGE_SIZE, userPage * USERS_PAGE_SIZE);
  const usersHasMore = filtered.length > userPage * USERS_PAGE_SIZE;

  useEffect(() => { setUserPage(1); }, [search, userStatusFilter, userRoleFilter]);

  const fetchTransactions = useCallback(async () => {
    if (!firebaseUser) return;
    setTxLoading(true);
    try {
      const token = await firebaseUser.getIdToken(true);
      const qs = new URLSearchParams({ page: String(txPage), type: txType, status: txStatus });
      const res = await fetch(`/api/admin/transactions?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setTxItems(data.data.items);
        setTxHasMore(data.data.hasMore);
      }
    } finally {
      setTxLoading(false);
    }
  }, [firebaseUser, txPage, txType, txStatus]);

  useEffect(() => {
    if (tab === 'transactions') fetchTransactions();
  }, [tab, fetchTransactions]);

  useEffect(() => { setTxPage(1); }, [txType, txStatus]);

  const fetchWithdrawals = useCallback(async () => {
    if (!firebaseUser) return;
    setWdLoading(true);
    try {
      const token = await firebaseUser.getIdToken(true);
      const qs = new URLSearchParams({ page: String(wdPage), status: wdStatusFilter });
      const res = await fetch(`/api/admin/withdrawals?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.data.items);
        setWdHasMore(data.data.hasMore);
      }
    } finally {
      setWdLoading(false);
    }
  }, [firebaseUser, wdPage, wdStatusFilter]);

  useEffect(() => {
    if (tab === 'withdrawals') fetchWithdrawals();
  }, [tab, fetchWithdrawals]);

  useEffect(() => { setWdPage(1); }, [wdStatusFilter]);

  const markWithdrawalPaid = async (transactionId: string) => {
    setWdActionId(transactionId);
    try {
      const token = await firebaseUser!.getIdToken(true);
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId, payoutReference: wdReference[transactionId] || undefined }),
      });
      const data = await res.json();
      if (data.success) { setMsg('Retrait marqué comme payé ✅'); await fetchWithdrawals(); setTimeout(() => setMsg(''), 3000); }
      else setError(data.error || 'Erreur');
    } finally {
      setWdActionId(null);
    }
  };

  const fetchReferrers = useCallback(async () => {
    if (!firebaseUser) return;
    setRefLoading(true);
    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(`/api/admin/referrers?page=${refPage}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setReferrers(data.data.items);
        setRefHasMore(data.data.hasMore);
      }
    } finally {
      setRefLoading(false);
    }
  }, [firebaseUser, refPage]);

  useEffect(() => {
    if (tab === 'referrers') fetchReferrers();
  }, [tab, fetchReferrers]);

  const resetReferrerForm = () => {
    setReferrerForm({ name: '', email: '', password: '', promoCode: '', commissionPerReload: 25 });
    setReferrerError('');
  };

  const handleCreateReferrer = async () => {
    setReferrerActionLoading(true);
    setReferrerError('');
    try {
      const token = await firebaseUser!.getIdToken(true);
      const res = await fetch('/api/admin/referrers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(referrerForm),
      });
      const data = await res.json();
      if (!data.success) { setReferrerError(data.error || 'Erreur'); return; }
      setShowCreateReferrer(false);
      resetReferrerForm();
      setMsg('Parrain créé avec succès ✅');
      await fetchReferrers();
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setReferrerActionLoading(false);
    }
  };

  const handleUpdateReferrer = async (id: string, updates: Record<string, unknown>) => {
    setReferrerActionLoading(true);
    try {
      const token = await firebaseUser!.getIdToken(true);
      const res = await fetch('/api/admin/referrers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.success) { setMsg('Parrain mis à jour ✅'); await fetchReferrers(); setTimeout(() => setMsg(''), 3000); }
      else setError(data.error || 'Erreur');
    } finally {
      setReferrerActionLoading(false);
      setEditingReferrer(null);
    }
  };

  const handleDeactivateReferrer = async (id: string) => {
    setReferrerActionLoading(true);
    try {
      const token = await firebaseUser!.getIdToken(true);
      const res = await fetch(`/api/admin/referrers?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setMsg('Parrain désactivé ✅'); await fetchReferrers(); setTimeout(() => setMsg(''), 3000); }
      else setError(data.error || 'Erreur');
    } finally {
      setReferrerActionLoading(false);
    }
  };

  const handlePayReferrer = async () => {
    if (!payoutTarget) return;
    setPayoutLoading(true);
    setPayoutError('');
    try {
      const token = await firebaseUser!.getIdToken(true);
      const res = await fetch('/api/admin/referral-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referrerId: payoutTarget.id, payoutReference: payoutReference || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setPayoutError(data.error || 'Erreur'); return; }
      setMsg(`Paiement de ${data.data.amountPaidXOF.toLocaleString()} FCFA enregistré ✅`);
      setPayoutTarget(null);
      setPayoutReference('');
      await fetchReferrers();
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setPayoutLoading(false);
    }
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const broadcastFiltered = users.filter(u =>
    u.email?.toLowerCase().includes(broadcastSearch.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(broadcastSearch.toLowerCase())
  );

  const toggleChannel = (channel: string) => {
    setBroadcastChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  const handleSendBroadcast = async () => {
    setBroadcastError('');
    setBroadcastResult(null);
    if (broadcastChannels.length === 0) { setBroadcastError('Choisissez au moins un canal.'); return; }
    if (broadcastTarget === 'selected' && selectedUserIds.length === 0) { setBroadcastError('Sélectionnez au moins un utilisateur.'); return; }
    if (broadcastChannels.includes('email') && (!broadcastSubject.trim() || !broadcastEmailBody.trim())) { setBroadcastError('Sujet et message requis pour l\'email.'); return; }
    if (broadcastChannels.includes('push') && (!broadcastPushTitle.trim() || !broadcastPushBody.trim())) { setBroadcastError('Titre et message requis pour la notification push.'); return; }

    setBroadcastLoading(true);
    try {
      const token = await firebaseUser!.getIdToken(true);
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          target: broadcastTarget,
          userIds: broadcastTarget === 'selected' ? selectedUserIds : undefined,
          channels: broadcastChannels,
          subject: broadcastSubject,
          emailBody: broadcastEmailBody,
          pushTitle: broadcastPushTitle,
          pushBody: broadcastPushBody,
        }),
      });
      const data = await res.json();
      if (!data.success) { setBroadcastError(data.error || 'Erreur'); return; }
      setBroadcastResult(data.data);
    } catch {
      setBroadcastError('Erreur réseau.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg">
      <div className="text-center">
        <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
          <Shield size={22} className="text-white" />
        </div>
        <p className="text-ink-secondary text-sm">Chargement admin...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (tab) {
      case 'overview': return (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
            <button onClick={fetchAll} className="w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
              <RefreshCw size={15} className="text-ink-secondary" />
            </button>
          </div>

          {msg && <div className="bg-brand-green-light border border-brand-green/20 text-green-700 rounded-2xl p-3.5 text-sm flex items-center gap-2"><CheckCircle size={15} />{msg}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-sm">{error}</div>}

          <Link href="/admin/kyc" className="card p-4 flex items-center justify-between hover:border-brand-orange/40 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange-light rounded-2xl flex items-center justify-center">
                <ClipboardList size={18} className="text-brand-orange" />
              </div>
              <div>
                <div className="font-semibold text-sm">Vérifications KYC</div>
                <div className="text-xs text-ink-muted">Examiner les dossiers en attente</div>
              </div>
            </div>
            <span className="text-brand-orange text-sm font-medium group-hover:underline">Voir →</span>
          </Link>

          {stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Utilisateurs', value: stats.totalUsers, icon: <Users size={17} className="text-blue-500" />, bg: 'bg-blue-50' },
                  { label: 'Cartes actives', value: stats.activeCards, icon: <CreditCard size={17} className="text-brand-green" />, bg: 'bg-brand-green-light' },
                  { label: 'Transactions', value: stats.totalTransactions, icon: <Activity size={17} className="text-purple-500" />, bg: 'bg-purple-50' },
                  { label: 'Revenus FCFA', value: `${(stats.totalRevenue / 1000).toFixed(0)}k`, icon: <TrendingUp size={17} className="text-brand-orange" />, bg: 'bg-brand-orange-light' },
                ].map(s => (
                  <div key={s.label} className="card p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-ink-secondary text-xs">{s.label}</span>
                      <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4">Dernières transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-ink-muted text-left">
                      {['ID', 'Type', 'Montant', 'Statut', 'Date'].map(h => <th key={h} className="pb-3 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {stats.recentTransactions.length === 0 && (
                        <tr><td colSpan={5} className="py-6 text-center text-ink-muted">Aucune transaction</td></tr>
                      )}
                      {stats.recentTransactions.map(tx => (
                        <tr key={tx.id} className="border-t border-surface-border">
                          <td className="py-3 font-mono text-xs text-ink-muted">{tx.id.slice(0, 8)}…</td>
                          <td className="py-3">{tx.type === 'card_purchase' ? '🃏 Achat' : tx.type === 'card_withdrawal' ? '💸 Retrait' : '💳 Rechargement'}</td>
                          <td className="py-3 font-medium">{tx.amount?.toLocaleString()} FCFA</td>
                          <td className="py-3"><TxBadge s={tx.status} /></td>
                          <td className="py-3 text-ink-muted">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card p-5 border-l-4 border-yellow-400 bg-yellow-50">
                <h4 className="font-semibold text-yellow-800 mb-2">Webhooks à configurer</h4>
                <div className="text-xs font-mono text-yellow-700 space-y-1 bg-yellow-100 rounded-xl p-3">
                  <div>LFD Gateway      : {typeof window !== 'undefined' ? window.location.origin : 'https://card.lfdweb.com'}/api/webhook/payment</div>
                  <div>Émetteur cartes : {typeof window !== 'undefined' ? window.location.origin : 'https://card.lfdweb.com'}/api/webhook/pagocards</div>
                </div>
              </div>
            </>
          )}
        </div>
      );

      case 'users': return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Utilisateurs</h1>
            <button onClick={fetchAll} className="w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
              <RefreshCw size={15} className="text-ink-secondary" />
            </button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-sm">{error}</div>}
          {msg && <div className="bg-brand-green-light border border-brand-green/20 text-green-700 rounded-2xl p-3.5 text-sm flex items-center gap-2"><CheckCircle size={15} />{msg}</div>}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" placeholder="Rechercher..." value={search}
                onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
            <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)} className="input-field w-auto text-sm">
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>
            <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="input-field w-auto text-sm">
              <option value="all">Tous les rôles</option>
              <option value="user">Utilisateur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-ink-secondary text-left">
                    {['Utilisateur', 'Pays', 'Rôle', 'Statut', 'Date', 'Actions'].map(h =>
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Aucun utilisateur trouvé</td></tr>
                  )}
                  {pagedUsers.map(u => (
                    <tr key={u.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.displayName || '—'}</div>
                        <div className="text-ink-muted text-xs">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">{u.country || '—'}</td>
                      <td className="px-4 py-3"><span className={u.role === 'admin' ? 'badge-orange' : 'badge-gray'}>{u.role}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={u.status === 'active' ? 'badge-green' : 'badge-red'}>
                            {u.status === 'active' ? '● Actif' : '⊘ Suspendu'}
                          </span>
                          {u.kycRequired && <span className="badge-orange text-[10px]">KYC requis</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.status === 'active'
                            ? <button onClick={() => userAction(u.id, 'suspend')} disabled={!!actionLoading}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Suspendre"><Ban size={14} /></button>
                            : <button onClick={() => userAction(u.id, 'activate')} disabled={!!actionLoading}
                                className="p-1.5 text-brand-green hover:bg-brand-green-light rounded-lg" title="Réactiver"><UserCheck size={14} /></button>}
                          {u.role !== 'admin' &&
                            <button onClick={() => userAction(u.id, 'make_admin')} disabled={!!actionLoading}
                              className="p-1.5 text-brand-orange hover:bg-brand-orange-light rounded-lg" title="Promouvoir admin"><Shield size={14} /></button>}
                          {u.kycRequired ? (
                            <button onClick={() => userAction(u.id, 'unrequire_kyc')} disabled={!!actionLoading}
                              className="p-1.5 text-ink-secondary hover:bg-surface-muted rounded-lg" title="Retirer l'obligation de KYC"><ShieldOff size={14} /></button>
                          ) : (
                            <button onClick={() => userAction(u.id, 'require_kyc')} disabled={!!actionLoading}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Exiger la vérification d'identité (activité suspecte)"><ShieldAlert size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4">
              <Pagination page={userPage} hasMore={usersHasMore} onChange={setUserPage} />
            </div>
          </div>
        </div>
      );

      case 'transactions': return (
        <div className="space-y-5 animate-fade-in">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <div className="flex flex-wrap gap-2">
            <select value={txType} onChange={e => setTxType(e.target.value)} className="input-field w-auto text-sm">
              <option value="all">Tous les types</option>
              <option value="card_purchase">Achat de carte</option>
              <option value="card_reload">Recharge</option>
              <option value="card_withdrawal">Retrait</option>
            </select>
            <select value={txStatus} onChange={e => setTxStatus(e.target.value)} className="input-field w-auto text-sm">
              <option value="all">Tous les statuts</option>
              <option value="success">Réussi</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-ink-secondary text-left">
                    {['ID', 'Type', 'Montant', 'Statut', 'Date'].map(h =>
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  ) : txItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Aucune transaction</td></tr>
                  ) : txItems.map(tx => (
                    <tr key={tx.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{tx.id.slice(0, 12)}…</td>
                      <td className="px-4 py-3">{tx.type === 'card_purchase' ? '🃏 Achat carte' : tx.type === 'card_withdrawal' ? '💸 Retrait' : '💳 Rechargement'}</td>
                      <td className="px-4 py-3 font-medium">{tx.amount?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3"><TxBadge s={tx.status} /></td>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4">
              <Pagination page={txPage} hasMore={txHasMore} onChange={setTxPage} loading={txLoading} />
            </div>
          </div>
        </div>
      );

      case 'withdrawals': return (
        <div className="space-y-5 animate-fade-in">
          <h1 className="text-2xl font-bold">Retraits</h1>
          <p className="text-ink-secondary text-sm -mt-3">
            Retraits Mastercard traités par l'émetteur — l'argent arrive dans notre wallet, à vous d'envoyer le Mobile Money au client.
          </p>
          <select value={wdStatusFilter} onChange={e => setWdStatusFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="pending_payout">En attente de virement</option>
            <option value="completed">Payés</option>
          </select>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-ink-secondary text-left">
                    {['Utilisateur', 'Montant', 'Date', 'Référence', 'Action'].map(h =>
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {wdLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  ) : withdrawals.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Aucun retrait {wdStatusFilter === 'pending_payout' ? 'en attente' : 'payé'}</td></tr>
                  ) : withdrawals.map(w => (
                    <tr key={w.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{w.userId.slice(0, 12)}…</td>
                      <td className="px-4 py-3 font-medium">${w.amountUSD} <span className="text-ink-muted font-normal">(~{w.amount?.toLocaleString()} FCFA)</span></td>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(w.createdAt)}</td>
                      <td className="px-4 py-3">
                        {w.status === 'pending_payout' ? (
                          <input
                            type="text"
                            placeholder="Réf. Mobile Money"
                            value={wdReference[w.id] || ''}
                            onChange={e => setWdReference(prev => ({ ...prev, [w.id]: e.target.value }))}
                            className="input-field text-xs py-1.5 px-2 w-36"
                          />
                        ) : <span className="text-ink-muted text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {w.status === 'pending_payout' ? (
                          <button onClick={() => markWithdrawalPaid(w.id)} disabled={wdActionId === w.id}
                            className="inline-flex items-center gap-1.5 text-brand-green text-xs font-medium hover:underline disabled:opacity-50">
                            <Send size={13} />{wdActionId === w.id ? 'Envoi...' : 'Marquer payé'}
                          </button>
                        ) : <span className="badge-green">Payé</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4">
              <Pagination page={wdPage} hasMore={wdHasMore} onChange={setWdPage} loading={wdLoading} />
            </div>
          </div>
        </div>
      );

      case 'referrers': return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Parrains</h1>
            <button onClick={() => { resetReferrerForm(); setShowCreateReferrer(true); }} className="btn-primary text-sm py-2 px-4">
              <Plus size={15} /> Nouveau parrain
            </button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-ink-secondary text-left">
                    {['Parrain', 'Code', 'Commission', 'Filleuls', 'Gains totaux', 'En attente', 'Statut', 'Actions'].map(h =>
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {refLoading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-muted"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  ) : referrers.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-muted">Aucun parrain pour l'instant</td></tr>
                  ) : referrers.map(r => (
                    <tr key={r.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-ink-muted text-xs">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.promoCode}</td>
                      <td className="px-4 py-3">
                        {editingReferrer === r.id ? (
                          <input
                            type="number"
                            defaultValue={r.commissionPerReload}
                            className="input-field text-xs py-1.5 px-2 w-20"
                            onBlur={e => handleUpdateReferrer(r.id, { commissionPerReload: Number(e.target.value) })}
                          />
                        ) : (
                          <button onClick={() => setEditingReferrer(r.id)} className="flex items-center gap-1 hover:text-brand-orange">
                            {r.commissionPerReload} FCFA <Edit3 size={12} />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">{r.totalReferred}</td>
                      <td className="px-4 py-3 font-medium">{r.totalEarningsXOF.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3">
                        {r.unpaidXOF > 0 ? (
                          <span className="font-semibold text-yellow-700">{r.unpaidXOF.toLocaleString()} FCFA</span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.active ? 'badge-green' : 'badge-red'}>{r.active ? '● Actif' : '⊘ Désactivé'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.unpaidXOF > 0 && (
                            <button onClick={() => { setPayoutTarget({ id: r.id, name: r.name, unpaidXOF: r.unpaidXOF }); setPayoutError(''); }}
                              className="inline-flex items-center gap-1.5 text-brand-green text-xs font-medium hover:underline">
                              <Send size={13} /> Payer
                            </button>
                          )}
                          {r.active && (
                            <button onClick={() => handleDeactivateReferrer(r.id)} disabled={referrerActionLoading}
                              className="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium hover:underline disabled:opacity-50">
                              <Power size={13} /> Désactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4">
              <Pagination page={refPage} hasMore={refHasMore} onChange={setRefPage} loading={refLoading} />
            </div>
          </div>
        </div>
      );

      case 'messages': return (
        <div className="space-y-5 animate-fade-in max-w-6xl">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-ink-secondary text-sm -mt-3">
            Envoyez un message par email et/ou notification push à tous vos utilisateurs, ou à une sélection.
          </p>

          {broadcastResult && (
            <div className="bg-brand-green-light border border-brand-green/20 text-green-700 rounded-2xl p-4 text-sm">
              Envoyé à {broadcastResult.totalUsers} utilisateur(s) — {broadcastResult.emailsSent} email(s), {broadcastResult.pushesSent} notification(s) push.
            </div>
          )}
          {broadcastError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-sm">{broadcastError}</div>}

          {/* Destinataires */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Destinataires</h3>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setBroadcastTarget('all')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${broadcastTarget === 'all' ? 'bg-brand-orange text-white' : 'bg-surface-muted text-ink-secondary'}`}>
                Tous les utilisateurs
              </button>
              <button onClick={() => setBroadcastTarget('selected')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${broadcastTarget === 'selected' ? 'bg-brand-orange text-white' : 'bg-surface-muted text-ink-secondary'}`}>
                Sélectionner ({selectedUserIds.length})
              </button>
            </div>

            {broadcastTarget === 'selected' && (
              <div>
                <div className="relative mb-3">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input type="text" placeholder="Rechercher un utilisateur..." value={broadcastSearch}
                    onChange={e => setBroadcastSearch(e.target.value)} className="input-field pl-10 text-sm" />
                </div>
                <div className="max-h-64 overflow-y-auto border border-surface-border rounded-2xl divide-y divide-surface-border">
                  {broadcastFiltered.length === 0 ? (
                    <div className="p-4 text-center text-ink-muted text-sm">Aucun utilisateur trouvé</div>
                  ) : broadcastFiltered.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-surface-muted cursor-pointer">
                      <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUserSelection(u.id)}
                        className="w-4 h-4 accent-brand-orange" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.displayName || '—'}</div>
                        <div className="text-xs text-ink-muted truncate">{u.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Canaux */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Canaux</h3>
            <div className="flex gap-2">
              <button onClick={() => toggleChannel('email')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${broadcastChannels.includes('email') ? 'bg-brand-orange text-white' : 'bg-surface-muted text-ink-secondary'}`}>
                <Mail size={14} /> Email
              </button>
              <button onClick={() => toggleChannel('push')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${broadcastChannels.includes('push') ? 'bg-brand-orange text-white' : 'bg-surface-muted text-ink-secondary'}`}>
                <Bell size={14} /> Push
              </button>
            </div>
          </div>

          {/* Message email */}
          {broadcastChannels.includes('email') && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Mail size={16} className="text-brand-orange" /> Contenu de l'email</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Sujet" value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)} className="input-field text-sm" />
                <textarea placeholder="Votre message..." value={broadcastEmailBody}
                  onChange={e => setBroadcastEmailBody(e.target.value)} rows={5} className="input-field text-sm resize-none" />
              </div>
            </div>
          )}

          {/* Message push */}
          {broadcastChannels.includes('push') && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Bell size={16} className="text-brand-orange" /> Notification push</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Titre" value={broadcastPushTitle}
                  onChange={e => setBroadcastPushTitle(e.target.value)} className="input-field text-sm" />
                <textarea placeholder="Message court..." value={broadcastPushBody}
                  onChange={e => setBroadcastPushBody(e.target.value)} rows={3} className="input-field text-sm resize-none" />
              </div>
            </div>
          )}

          <button onClick={handleSendBroadcast} disabled={broadcastLoading} className="btn-primary w-full py-3.5">
            {broadcastLoading ? 'Envoi en cours...' : (<><Send size={16} /> Envoyer le message</>)}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="stripes-light min-h-screen">
      <Sidebar active={tab} onNav={setTab} onLogout={logout} email={appUser?.email || ''} />
      <MobileTopBar onMenu={() => setDrawerOpen(true)} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        active={tab}
        onNav={setTab}
        onLogout={logout}
        email={appUser?.email || ''}
      />
      <div className="main-with-sidebar">
        <main className="p-5 sm:p-8 pt-20 md:pt-8 pb-24 md:pb-8 max-w-8xl">
          {renderContent()}
        </main>
      </div>
      <BottomNav active={tab} onNav={setTab} />

      {showCreateReferrer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-5">
              <h3 className="font-bold text-xl">Nouveau parrain</h3>
              <button onClick={() => setShowCreateReferrer(false)} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
            </div>
            {referrerError && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{referrerError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom complet</label>
                <input type="text" value={referrerForm.name} onChange={e => setReferrerForm({ ...referrerForm, name: e.target.value })} className="input-field" placeholder="Gérard Sononkpon" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={referrerForm.email} onChange={e => setReferrerForm({ ...referrerForm, email: e.target.value })} className="input-field" placeholder="parrain@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
                <input type="text" value={referrerForm.password} onChange={e => setReferrerForm({ ...referrerForm, password: e.target.value })} className="input-field" placeholder="Minimum 8 caractères" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Code parrain</label>
                <input type="text" value={referrerForm.promoCode} onChange={e => setReferrerForm({ ...referrerForm, promoCode: e.target.value.toUpperCase() })} className="input-field" placeholder="GERARD10" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Commission par rechargement (FCFA)</label>
                <input type="number" value={referrerForm.commissionPerReload} onChange={e => setReferrerForm({ ...referrerForm, commissionPerReload: Number(e.target.value) })} className="input-field" />
              </div>
              <button onClick={handleCreateReferrer} disabled={referrerActionLoading} className="btn-primary w-full py-3.5">
                {referrerActionLoading ? 'Création...' : 'Créer le parrain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payoutTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-5">
              <h3 className="font-bold text-xl">Payer {payoutTarget.name}</h3>
              <button onClick={() => setPayoutTarget(null)} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
            </div>
            <div className="bg-surface-muted rounded-2xl p-4 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Montant à envoyer</span>
                <span className="font-bold text-brand-orange">{payoutTarget.unpaidXOF.toLocaleString()} FCFA</span>
              </div>
            </div>
            <p className="text-ink-secondary text-xs mb-4">
              Envoyez d'abord le Mobile Money vous-même, puis confirmez ici pour marquer les gains comme payés et notifier le parrain par email.
            </p>
            {payoutError && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{payoutError}</div>}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">Référence Mobile Money (optionnel)</label>
              <input type="text" value={payoutReference} onChange={e => setPayoutReference(e.target.value)} className="input-field" placeholder="Ex : MTN-XXXXXX" />
            </div>
            <button onClick={handlePayReferrer} disabled={payoutLoading} className="btn-primary w-full py-3.5">
              {payoutLoading ? 'Confirmation...' : 'Confirmer le paiement envoyé'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
