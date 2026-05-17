// app/admin/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Users, CreditCard, TrendingUp, Activity,
  LogOut, Shield, CheckCircle, XCircle,
  Clock, Ban, UserCheck, ChevronDown, RefreshCw,
  Search, AlertTriangle
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCards: number;
  activeCards: number;
  totalTransactions: number;
  totalRevenue: number;
  recentTransactions: AdminTransaction[];
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  country: string;
  createdAt: string;
}

interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

// ---- Stat Card ----
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-sm">{label}</span>
        <div className={`w-9 h-9 ${color} rounded-2xl flex items-center justify-center`}>{icon}</div>
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

// ---- Transaction Badge ----
function TxBadge({ status }: { status: string }) {
  if (status === 'success') return <span className="badge-green">✓ Succès</span>;
  if (status === 'failed') return <span className="badge-red">✗ Échoué</span>;
  if (status === 'error') return <span className="badge-red">⚠ Erreur</span>;
  return <span className="badge-orange">◷ En attente</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const { appUser, firebaseUser, logout, getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<'overview' | 'users' | 'transactions'>('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const fetchStats = useCallback(async () => {
    if (!firebaseUser) return;
    const token = await getToken();
    const [statsRes, usersRes] = await Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const statsData = await statsRes.json();
    const usersData = await usersRes.json();
    if (statsData.success) setStats(statsData.data);
    if (usersData.success) setUsers(usersData.data);
    setLoading(false);
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (!appUser) return;
    if (appUser.role !== 'admin') { router.push('/dashboard'); return; }
    fetchStats();
  }, [appUser, router, fetchStats]);

  const userAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Action "${action}" effectuée avec succès.`);
        await fetchStats();
        setTimeout(() => setMsg(''), 3000);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <Shield size={24} className="text-white" />
          </div>
          <p className="text-text-secondary text-sm">Chargement admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Header */}
      <header className="bg-white border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-display font-bold">Admin — VCardAfrica</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted hidden sm:block">{appUser?.email}</span>
            <button onClick={() => fetchStats()} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
              <RefreshCw size={14} className="text-text-secondary" />
            </button>
            <button onClick={logout} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
              <LogOut size={14} className="text-text-secondary" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {msg && (
          <div className="bg-brand-green-light border border-brand-green/20 text-brand-green-dark rounded-2xl p-4 text-sm mb-6 flex items-center gap-2">
            <CheckCircle size={16} /> {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-surface-border">
          {(['overview', 'users', 'transactions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-brand-orange text-brand-orange' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}>
              {t === 'overview' ? 'Vue d\'ensemble' : t === 'users' ? 'Utilisateurs' : 'Transactions'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && stats && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Utilisateurs" value={stats.totalUsers} icon={<Users size={18} className="text-blue-500" />} color="bg-blue-50" />
              <StatCard label="Cartes actives" value={stats.activeCards} icon={<CreditCard size={18} className="text-brand-green" />} color="bg-brand-green-light" />
              <StatCard label="Transactions" value={stats.totalTransactions} icon={<Activity size={18} className="text-purple-500" />} color="bg-purple-50" />
              <StatCard label="Revenus (FCFA)" value={`${(stats.totalRevenue / 1000).toFixed(0)}k`} icon={<TrendingUp size={18} className="text-brand-orange" />} color="bg-brand-orange-light" />
            </div>

            <div className="card p-6">
              <h3 className="font-medium mb-4">Dernières transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted text-left">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Montant</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTransactions.map(tx => (
                      <tr key={tx.id} className="border-t border-surface-border">
                        <td className="py-3 font-mono text-xs text-text-muted">{tx.id.slice(0, 8)}…</td>
                        <td className="py-3 capitalize">
                          {tx.type === 'card_purchase' ? '🃏 Achat carte' : '💳 Rechargement'}
                        </td>
                        <td className="py-3 font-medium">{tx.amount?.toLocaleString()} FCFA</td>
                        <td className="py-3"><TxBadge status={tx.status} /></td>
                        <td className="py-3 text-text-muted">
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Webhook setup reminder */}
            <div className="card p-5 border-l-4 border-yellow-400 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Configuration webhooks requise</h4>
                  <p className="text-yellow-700 text-sm mb-2">
                    Configurez ces URLs dans vos dashboards respectifs :
                  </p>
                  <div className="space-y-1 text-xs font-mono bg-yellow-100 rounded-xl p-3">
                    <div><span className="text-yellow-600">LFD Gateway :</span> {typeof window !== 'undefined' ? window.location.origin : 'https://votre-domaine.vercel.app'}/api/webhook/payment</div>
                    <div><span className="text-yellow-600">Pagocards   :</span> {typeof window !== 'undefined' ? window.location.origin : 'https://votre-domaine.vercel.app'}/api/webhook/pagocards</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Rechercher par email ou nom..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted">
                    <tr className="text-text-secondary text-left">
                      <th className="px-4 py-3 font-medium">Utilisateur</th>
                      <th className="px-4 py-3 font-medium">Pays</th>
                      <th className="px-4 py-3 font-medium">Rôle</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-t border-surface-border hover:bg-surface-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{u.displayName || '—'}</div>
                          <div className="text-text-muted text-xs">{u.email}</div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{u.country}</td>
                        <td className="px-4 py-3">
                          <span className={u.role === 'admin' ? 'badge-orange' : 'badge-gray'}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={u.status === 'active' ? 'badge-green' : 'badge-red'}>
                            {u.status === 'active' ? '● Actif' : '⊘ Suspendu'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {u.status === 'active' ? (
                              <button
                                onClick={() => userAction(u.id, 'suspend')}
                                disabled={!!actionLoading}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Suspendre">
                                <Ban size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => userAction(u.id, 'activate')}
                                disabled={!!actionLoading}
                                className="p-1.5 text-brand-green hover:bg-brand-green-light rounded-lg transition-colors disabled:opacity-50"
                                title="Réactiver">
                                <UserCheck size={14} />
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => userAction(u.id, 'make_admin')}
                                disabled={!!actionLoading}
                                className="p-1.5 text-brand-orange hover:bg-brand-orange-light rounded-lg transition-colors disabled:opacity-50"
                                title="Promouvoir admin">
                                <Shield size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && stats && (
          <div className="card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-text-secondary text-left">
                    <th className="px-4 py-3 font-medium">ID Transaction</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map(tx => (
                    <tr key={tx.id} className="border-t border-surface-border hover:bg-surface-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">{tx.id}</td>
                      <td className="px-4 py-3">
                        {tx.type === 'card_purchase' ? '🃏 Achat carte' : '💳 Rechargement'}
                      </td>
                      <td className="px-4 py-3 font-medium">{tx.amount?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3"><TxBadge status={tx.status} /></td>
                      <td className="px-4 py-3 text-text-muted">
                        {new Date(tx.createdAt).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
