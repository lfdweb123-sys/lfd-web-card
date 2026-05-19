'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield, CheckCircle, XCircle, Clock, Eye, X,
  User, Search, RefreshCw, ChevronLeft, AlertCircle
} from 'lucide-react';

interface KycEntry {
  id: string;
  userId: string;
  method: 'didit' | 'manual';
  status: string;
  rejectionReason?: string;
  submittedAt?: string;
  updatedAt: string;
  diditSessionId?: string;
}

interface KycImages {
  idFront?: string;
  idBack?: string;
  selfie?: string;
}

function MethodBadge({ method }: { method: string }) {
  if (method === 'didit') return <span className="badge bg-blue-50 text-blue-600">⚡ Automatique</span>;
  return <span className="badge-orange">👤 Manuel</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <span className="badge-green">✓ Approuvé</span>;
  if (status === 'rejected') return <span className="badge-red">✗ Refusé</span>;
  if (status === 'in_review') return <span className="badge bg-blue-50 text-blue-600">◷ En révision</span>;
  return <span className="badge-orange">◷ En attente</span>;
}

// ── Modal images + actions ───────────────────────────────────────
function ReviewModal({ entry, onClose, onAction, loading }: {
  entry: KycEntry;
  onClose: () => void;
  onAction: (action: 'approve' | 'reject', reason?: string) => Promise<void>;
  loading: boolean;
}) {
  const { getToken } = useAuth();
  const [images, setImages] = useState<KycImages | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);

  useEffect(() => {
    if (entry.method !== 'manual') return;
    const load = async () => {
      setImgLoading(true);
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId: entry.userId }),
        });
        const data = await res.json();
        if (data.success) setImages(data.data.images);
      } finally { setImgLoading(false); }
    };
    load();
  }, [entry, getToken]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl my-8 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div>
            <h3 className="font-bold text-lg">Dossier KYC</h3>
            <p className="text-ink-muted text-xs mt-0.5 font-mono">{entry.userId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-muted rounded-2xl p-3">
              <div className="text-ink-muted text-xs mb-1">Méthode</div>
              <MethodBadge method={entry.method} />
            </div>
            <div className="bg-surface-muted rounded-2xl p-3">
              <div className="text-ink-muted text-xs mb-1">Statut actuel</div>
              <StatusBadge status={entry.status} />
            </div>
            <div className="bg-surface-muted rounded-2xl p-3">
              <div className="text-ink-muted text-xs mb-1">Soumis le</div>
              <div className="font-medium text-xs">{new Date(entry.submittedAt || entry.updatedAt).toLocaleString('fr-FR')}</div>
            </div>
            {entry.diditSessionId && (
              <div className="bg-surface-muted rounded-2xl p-3">
                <div className="text-ink-muted text-xs mb-1">Session Didit</div>
                <div className="font-mono text-xs truncate">{entry.diditSessionId}</div>
              </div>
            )}
          </div>

          {/* Images (manuel seulement) */}
          {entry.method === 'manual' && (
            <div>
              <h4 className="font-semibold text-sm mb-3">Documents soumis</h4>
              {imgLoading ? (
                <div className="flex items-center justify-center py-8 text-ink-muted">
                  <RefreshCw size={18} className="animate-spin mr-2" />Chargement des images...
                </div>
              ) : images ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'idFront', label: 'Recto' },
                    { key: 'idBack', label: 'Verso' },
                    { key: 'selfie', label: 'Selfie' },
                  ].map(({ key, label }) => {
                    const src = images[key as keyof KycImages];
                    if (!src) return <div key={key} className="rounded-2xl bg-surface-muted h-32 flex items-center justify-center text-ink-muted text-xs">{label} manquant</div>;
                    const dataUrl = src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
                    return (
                      <div key={key} className="cursor-pointer group relative" onClick={() => setActiveImg(dataUrl)}>
                        <img src={dataUrl} alt={label} className="w-full h-32 object-cover rounded-2xl border border-surface-border group-hover:border-brand-orange/50 transition-all" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-all flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <div className="text-center text-xs text-ink-muted mt-1">{label}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-ink-muted text-sm text-center py-4">Aucune image disponible</div>
              )}
            </div>
          )}

          {/* Info Didit */}
          {entry.method === 'didit' && (
            <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                Vérification automatique via Didit. Le résultat est géré automatiquement par webhook.
                Vous pouvez consulter les détails sur le{' '}
                <a href="https://business.didit.me" target="_blank" rel="noreferrer" className="underline font-medium">
                  Business Console Didit
                </a>.
              </div>
            </div>
          )}

          {/* Raison de refus existante */}
          {entry.rejectionReason && (
            <div className="bg-red-50 rounded-2xl p-4 text-sm text-red-700">
              <strong>Raison du refus précédent :</strong> {entry.rejectionReason}
            </div>
          )}

          {/* Actions (seulement pour dossiers pending/in_review) */}
          {(entry.status === 'pending' || entry.status === 'in_review') && entry.method === 'manual' && (
            <div className="border-t border-surface-border pt-5">
              {!showReject ? (
                <div className="flex gap-3">
                  <button onClick={() => onAction('approve')} disabled={loading}
                    className="flex-1 bg-brand-green text-white font-semibold py-3 rounded-2xl hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle size={16} />Approuver
                  </button>
                  <button onClick={() => setShowReject(true)} disabled={loading}
                    className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-2xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <XCircle size={16} />Refuser
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Raison du refus (obligatoire)</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="input-field resize-none h-24"
                    placeholder="Ex: Photo floue, document expiré, selfie non conforme..."
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">Annuler</button>
                    <button onClick={() => onAction('reject', reason)} disabled={loading || !reason.trim()}
                      className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50">
                      {loading ? 'Envoi...' : 'Confirmer le refus'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen image */}
      {activeImg && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setActiveImg(null)}>
          <img src={activeImg} alt="Document" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}

// ── Main Admin KYC Page ──────────────────────────────────────────
export default function AdminKycPage() {
  const router = useRouter();
  const { appUser, firebaseUser, getToken } = useAuth();
  const [entries, setEntries] = useState<KycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'in_review'>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<KycEntry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/kyc?status=${filter}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEntries(data.data);
    } finally { setLoading(false); }
  }, [firebaseUser, getToken, filter]);

  useEffect(() => {
    if (!appUser) return;
    if (appUser.role !== 'admin') { router.push('/dashboard'); return; }
    fetchEntries();
  }, [appUser, router, fetchEntries]);

  const handleAction = async (action: 'approve' | 'reject', reason?: string) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: selected.userId, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(action === 'approve' ? 'Dossier approuvé ✅' : 'Dossier refusé ❌');
        setSelected(null);
        await fetchEntries();
        setTimeout(() => setMsg(''), 3000);
      }
    } finally { setActionLoading(false); }
  };

  const filtered = entries.filter(e =>
    e.userId.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { key: 'pending', label: 'En attente', color: 'text-yellow-600' },
    { key: 'in_review', label: 'En révision', color: 'text-blue-600' },
    { key: 'approved', label: 'Approuvés', color: 'text-brand-green' },
    { key: 'rejected', label: 'Refusés', color: 'text-red-600' },
  ] as const;

  return (
    <div className="min-h-screen bg-surface-bg">
      <header className="bg-white border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost p-2"><ChevronLeft size={18} /></Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
                <Shield size={15} className="text-white" />
              </div>
              <span className="font-semibold">Vérifications KYC</span>
            </div>
          </div>
          <button onClick={fetchEntries} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-orange' : 'text-ink-secondary'} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {msg && (
          <div className="bg-brand-green-light border border-brand-green/20 text-green-700 rounded-2xl p-4 text-sm mb-6 flex items-center gap-2">
            <CheckCircle size={15} />{msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-surface-border mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${filter === t.key ? `border-brand-orange text-brand-orange` : `border-transparent text-ink-secondary hover:text-ink-primary`}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input type="text" placeholder="Rechercher par userId..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-muted">
            <RefreshCw size={20} className="animate-spin mr-3" />Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <User size={36} className="text-ink-muted mx-auto mb-3" />
            <p className="text-ink-secondary">Aucun dossier {filter === 'pending' ? 'en attente' : ''}</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-ink-secondary text-left">
                    {['ID Utilisateur', 'Méthode', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-t border-surface-border hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-ink-muted">{e.userId.slice(0, 16)}…</div>
                      </td>
                      <td className="px-4 py-3"><MethodBadge method={e.method} /></td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3 text-ink-muted text-xs">
                        {new Date(e.submittedAt || e.updatedAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(e)}
                          className="inline-flex items-center gap-1.5 text-brand-orange text-xs font-medium hover:underline">
                          <Eye size={13} />Examiner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <ReviewModal
          entry={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}