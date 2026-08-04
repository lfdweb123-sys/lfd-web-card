'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Pagination } from '@/components/Pagination';
import {
  Gift, LogOut, Users, TrendingUp, Copy, Check, Loader2, ArrowUpRight, Link2,
} from 'lucide-react';

interface ReferrerData {
  id: string; name: string; email: string; promoCode: string; publicId?: string;
  commissionPerReload: number; totalReferred: number; totalEarningsXOF: number; unpaidXOF: number; active: boolean;
}
interface Earning { id: string; amountXOF: number; paid: boolean; createdAt: string; }

export default function ParrainDashboardPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [referrer, setReferrer] = useState<ReferrerData | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
      setAuthChecked(true);
      if (!user) router.push('/parrain/login');
    });
    return unsub;
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/referral/me?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setReferrer(data.data.referrer);
        setEarnings(data.data.earnings);
        setHasMore(data.data.hasMore);
      } else {
        router.push('/parrain/login');
      }
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => {
    if (uid) fetchData();
  }, [uid, fetchData]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/parrain/login');
  };

  const handleCopy = () => {
    if (!referrer) return;
    navigator.clipboard.writeText(referrer.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = referrer?.publicId
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://card.lfdweb.com'}/auth/register?ref=${referrer.publicId}`
    : '';
  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (!authChecked || loading && !referrer) {
    return (
      <div className="min-h-screen stripes-light flex items-center justify-center">
        <Loader2 size={28} className="text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen stripes-light">
      <header className="bg-white border-b border-surface-border px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
            <Gift size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm">Espace Parrain</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-red-600 transition-colors">
          <LogOut size={15} /> Déconnexion
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-5 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bonjour, {referrer?.name} 👋</h1>
          <p className="text-ink-secondary text-sm">Voici le suivi de votre parrainage.</p>
        </div>

        {!referrer?.active && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            Ce compte parrain est actuellement désactivé. Contactez l'équipe LFD WEB CARD.
          </div>
        )}

        {/* Code promo */}
        <div className="card p-6 bg-brand-orange-light border border-brand-orange/20">
          <div className="text-ink-secondary text-xs font-medium mb-2">Votre code parrain</div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-brand-orange tracking-wide">{referrer?.promoCode}</div>
            <button onClick={handleCopy} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              {copied ? <Check size={16} className="text-brand-green" /> : <Copy size={16} className="text-ink-secondary" />}
            </button>
          </div>
          <p className="text-ink-secondary text-xs mt-3">
            Partagez ce code — vos filleuls le renseignent à l'inscription ou depuis leur profil.
          </p>
        </div>

        {/* Lien de parrainage (UUID) */}
        {referralLink && (
          <div className="card p-6">
            <div className="text-ink-secondary text-xs font-medium mb-2 flex items-center gap-1.5">
              <Link2 size={13} /> Votre lien de parrainage
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 truncate text-sm text-ink-secondary bg-surface-muted rounded-xl px-3.5 py-2.5">
                {referralLink}
              </div>
              <button onClick={handleCopyLink} className="w-9 h-9 bg-white border border-surface-border rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow shrink-0">
                {linkCopied ? <Check size={16} className="text-brand-green" /> : <Copy size={16} className="text-ink-secondary" />}
              </button>
            </div>
            <p className="text-ink-secondary text-xs mt-3">
              Plus simple à partager sur les réseaux — le filleul voit directement votre nom et n'a rien à saisir.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="w-9 h-9 bg-brand-orange-light rounded-2xl flex items-center justify-center mb-2.5">
              <Users size={16} className="text-brand-orange" />
            </div>
            <div className="text-xl font-bold">{referrer?.totalReferred ?? 0}</div>
            <div className="text-ink-secondary text-xs">Filleuls</div>
          </div>
          <div className="card p-4">
            <div className="w-9 h-9 bg-brand-green-light rounded-2xl flex items-center justify-center mb-2.5">
              <Check size={16} className="text-brand-green" />
            </div>
            <div className="text-xl font-bold">{((referrer?.totalEarningsXOF ?? 0) - (referrer?.unpaidXOF ?? 0)).toLocaleString()}</div>
            <div className="text-ink-secondary text-xs">FCFA déjà payés</div>
          </div>
          <div className="card p-4">
            <div className="w-9 h-9 bg-yellow-50 rounded-2xl flex items-center justify-center mb-2.5">
              <TrendingUp size={16} className="text-yellow-600" />
            </div>
            <div className="text-xl font-bold">{(referrer?.unpaidXOF ?? 0).toLocaleString()}</div>
            <div className="text-ink-secondary text-xs">FCFA en attente</div>
          </div>
        </div>

        {(referrer?.unpaidXOF ?? 0) > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm">
            Vos gains en attente vous seront envoyés par Mobile Money par l'équipe LFD WEB CARD. Vous recevrez un email de confirmation dès l'envoi.
          </div>
        )}

        <div className="card p-4 flex items-center gap-2 text-sm text-ink-secondary">
          <Gift size={15} className="text-brand-orange flex-shrink-0" />
          Vous gagnez {referrer?.commissionPerReload ?? 25} FCFA à chaque rechargement effectué par l'un de vos filleuls.
        </div>

        {/* Historique des gains */}
        <div>
          <h2 className="font-semibold mb-3">Historique des gains</h2>
          <div className="card p-5">
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-sm">Aucun gain pour l'instant.</div>
            ) : (
              <>
                {earnings.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-green-light rounded-2xl flex items-center justify-center">
                        <ArrowUpRight size={15} className="text-brand-green" />
                      </div>
                      <div>
                        <div className="text-sm text-ink-secondary">
                          Rechargement d'un filleul · {new Date(e.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${e.paid ? 'bg-brand-green-light text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {e.paid ? 'Payé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-brand-green text-sm">+{e.amountXOF.toLocaleString()} FCFA</div>
                  </div>
                ))}
                <Pagination page={page} hasMore={hasMore} onChange={setPage} loading={loading} />
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted">
          <Link href="/" className="hover:text-ink-primary transition-colors">Retour au site LFD WEB CARD</Link>
        </p>
      </main>
    </div>
  );
}
