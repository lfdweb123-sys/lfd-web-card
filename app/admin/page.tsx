'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime } from '@/lib/date';
import {
  Users, CreditCard, TrendingUp, Activity, LogOut, Shield,
  CheckCircle, Ban, UserCheck, Search, Home,
  RefreshCw, ClipboardList, Menu, X
} from 'lucide-react';

interface AdminStats {
  totalUsers: number; totalCards: number; activeCards: number;
  totalTransactions: number; totalRevenue: number; recentTransactions: AdminTx[];
}
interface AdminUser {
  id: string; email: string; displayName: string;
  role: string; status: string; country: string; createdAt: string;
}
interface AdminTx { id: string; type: string; amount: number; status: string; createdAt: string; }

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
        <Shield size={15} className="text-white" />
      </div>
      <span className="font-semibold text-sm tracking-wide">LFD WEB CARD</span>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'overview', label: "Vue d'ensemble", icon: <Home size={18} /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <TrendingUp size={18} /> },
];

// ── Sidebar desktop ───────────────────────────────────────────────
function Sidebar({ active, onNav, onLogout, email }: {
  active: string; onNav: (s: string) => void; onLogout: () => void; email: string;
}) {
  return (
    <aside className="sidebar-fixed hidden md:flex flex-col stripes-dark text-white border-r-0">
      <div className="px-5 py-5 border-b border-white/10">
        <Logo />
        <div className="mt-3 px-1"><span className="badge-orange text-[11px]">Admin</span></div>
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
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <Logo />
            <div className="mt-2 px-1"><span className="badge-orange text-[11px]">Admin</span></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
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
  if (s === 'success') return <span className="badge-green">✓ Succès</span>;
  if (s === 'failed') return <span className="badge-red">✗ Échoué</span>;
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
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

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
                          <td className="py-3">{tx.type === 'card_purchase' ? '🃏 Achat' : '💳 Rechargement'}</td>
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
                  <div>LFD Gateway : {typeof window !== 'undefined' ? window.location.origin : 'https://card.lfdweb.com'}/api/webhook/payment</div>
                  <div>Pagocards   : {typeof window !== 'undefined' ? window.location.origin : 'https://card.lfdweb.com'}/api/webhook/pagocards</div>
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
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
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
                  {filtered.map(u => (
                    <tr key={u.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.displayName || '—'}</div>
                        <div className="text-ink-muted text-xs">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">{u.country || '—'}</td>
                      <td className="px-4 py-3"><span className={u.role === 'admin' ? 'badge-orange' : 'badge-gray'}>{u.role}</span></td>
                      <td className="px-4 py-3">
                        <span className={u.status === 'active' ? 'badge-green' : 'badge-red'}>
                          {u.status === 'active' ? '● Actif' : '⊘ Suspendu'}
                        </span>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      case 'transactions': return stats ? (
        <div className="space-y-5 animate-fade-in">
          <h1 className="text-2xl font-bold">Transactions</h1>
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
                  {stats.recentTransactions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Aucune transaction</td></tr>
                  )}
                  {stats.recentTransactions.map(tx => (
                    <tr key={tx.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{tx.id.slice(0, 12)}…</td>
                      <td className="px-4 py-3">{tx.type === 'card_purchase' ? '🃏 Achat carte' : '💳 Rechargement'}</td>
                      <td className="px-4 py-3 font-medium">{tx.amount?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3"><TxBadge s={tx.status} /></td>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null;
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
    </div>
  );
}