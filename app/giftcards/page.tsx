'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/date';
import { Toast } from '@/components/Toast';
import { Pagination } from '@/components/Pagination';
import { Logo as LogoComponent } from '@/components/Logo';
import { SidebarLogo } from '@/components/SidebarLogo';
import type { GiftcardOrder } from '@/types';
import { getGiftcardPriceRange, getGiftcardImage, getGiftcardRegion, type GiftcardLike } from '@/lib/giftcard-utils';
import {
  Gift, Search, X, Menu, Home, CreditCard, TrendingUp, Bell,
  User, LogOut, Loader2, ExternalLink, Copy, Check, ShoppingBag,
} from 'lucide-react';

type Giftcard = GiftcardLike;

const XOF_RATE = 600;
const FEE_RATE = 0.05;

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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 ${item.id === 'giftcards' ? 'bg-brand-orange text-white shadow-orange' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
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
      <LogoComponent />
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

// ── Catalog tile ──────────────────────────────────────────────────
function GiftcardTile({ card, onClick }: { card: Giftcard; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const image = getGiftcardImage(card);
  const { min, max } = getGiftcardPriceRange(card);
  const priceLabel = min === max ? `$${min}` : `$${min} – $${max}`;

  return (
    <button onClick={onClick}
      className="p-4 rounded-2xl border-2 border-surface-border bg-white hover:border-brand-orange/50 text-left transition-all">
      {image && !imgError ? (
        <img src={image} alt={card.title} onError={() => setImgError(true)}
          className="w-9 h-9 rounded-xl object-cover mb-3 bg-surface-muted" />
      ) : (
        <div className="w-9 h-9 bg-brand-orange-light rounded-xl flex items-center justify-center mb-3">
          <Gift size={16} className="text-brand-orange" />
        </div>
      )}
      <div className="font-semibold text-sm truncate">{card.title}</div>
      <div className="text-xs text-ink-muted mt-0.5">{priceLabel} {card.currency}</div>
      {getGiftcardRegion(card) && <div className="text-xs text-ink-muted">{getGiftcardRegion(card)}</div>}
    </button>
  );
}

// ── Buy modal ─────────────────────────────────────────────────────
function BuyModal({ card, country, getToken, onClose, onSuccess, onError }: {
  card: Giftcard; country: string; getToken: () => Promise<string>;
  onClose: () => void; onSuccess: () => void; onError: (msg: string) => void;
}) {
  const { min, max } = getGiftcardPriceRange(card);
  const isFixedPrice = min === max;
  const [quantity, setQuantity] = useState(1);
  const [amountUSD, setAmountUSD] = useState(min);
  const [loading, setLoading] = useState(false);

  const totalUSD = parseFloat((amountUSD * quantity).toFixed(2));
  const amountXOF = Math.round(totalUSD * XOF_RATE);
  const fee = Math.round(amountXOF * FEE_RATE);
  const total = amountXOF + fee;

  const handle = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/giftcards/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sku: card.sku, title: card.title, quantity, amountUSD, country: country.toLowerCase() }),
      });
      const data = await res.json();
      if (!data.success) { onError(data.error); setLoading(false); return; }
      window.open(data.data.url, '_blank');
      onSuccess();
      onClose();
    } catch { onError('Erreur réseau.'); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-bold text-xl">{card.title}</h3>
            <p className="text-ink-secondary text-sm">{card.currency}{getGiftcardRegion(card) ? ` · ${getGiftcardRegion(card)}` : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center"><X size={15} /></button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Montant unitaire (USD)</label>
          {isFixedPrice ? (
            <div className="input-field w-full bg-surface-muted text-ink-secondary flex items-center">${min} (montant fixe)</div>
          ) : (
            <>
              <input type="number" min={min} max={max} value={amountUSD}
                onChange={(e) => setAmountUSD(Math.min(max, Math.max(min, Number(e.target.value))))}
                className="input-field w-full" />
              <div className="text-ink-muted text-xs mt-1">Entre ${min} et ${max}</div>
            </>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Quantité</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 bg-surface-muted rounded-xl font-bold">−</button>
            <span className="flex-1 text-center font-semibold">{quantity}</span>
            <button onClick={() => setQuantity(q => Math.min(10, q + 1))} className="w-10 h-10 bg-surface-muted rounded-xl font-bold">+</button>
          </div>
        </div>

        <div className="bg-surface-muted rounded-2xl p-4 mb-5 text-sm">
          <div className="flex justify-between mb-2"><span className="text-ink-secondary">{quantity} x ${amountUSD}</span><span className="font-medium">{amountXOF.toLocaleString()} FCFA</span></div>
          <div className="flex justify-between mb-2"><span className="text-ink-secondary">Frais</span><span className="font-medium">{fee.toLocaleString()} FCFA</span></div>
          <div className="border-t border-surface-border pt-2 flex justify-between font-bold"><span>Total</span><span className="text-brand-orange">{total.toLocaleString()} FCFA</span></div>
        </div>

        <button onClick={handle} disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Redirection...' : 'Payer maintenant →'}
        </button>
      </div>
    </div>
  );
}

// ── Order row ─────────────────────────────────────────────────────
function OrderRow({ order }: { order: GiftcardOrder }) {
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    if (!order.referenceCode) return;
    navigator.clipboard.writeText(order.referenceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between p-4 border-b border-surface-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-brand-orange-light rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift size={16} className="text-brand-orange" />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{order.title} x{order.quantity}</div>
          <div className="text-xs text-ink-muted">{formatDate(order.createdAt)} · {order.amountXOF.toLocaleString()} FCFA</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {order.status === 'success' ? (
          order.shareLink ? (
            <a href={order.shareLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline">
              Voir le code <ExternalLink size={12} />
            </a>
          ) : order.referenceCode ? (
            <button onClick={copyCode} className="flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline">
              {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> {order.referenceCode}</>}
            </button>
          ) : (
            <span className="text-xs text-brand-green font-semibold">Prête</span>
          )
        ) : order.status === 'pending' ? (
          <span className="text-xs text-yellow-600 font-semibold">En attente</span>
        ) : (
          <span className="text-xs text-red-500 font-semibold">Échouée</span>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function GiftcardsPage() {
  const router = useRouter();
  const { firebaseUser, appUser, loading: authLoading, getToken, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Giftcard[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const [orders, setOrders] = useState<GiftcardOrder[]>([]);
  const [selectedCard, setSelectedCard] = useState<Giftcard | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCatalog = useCallback(async (page: number, q: string) => {
    setCatalogLoading(true); setCatalogError('');
    try {
      const token = await getToken();
      // La conversion FX pour les cartes non-USD n'est pas encore gérée côté paiement —
      // on ne propose que le catalogue USD pour l'instant (voir /api/giftcards/buy).
      const qs = new URLSearchParams({ page: String(page), limit: '24', currency: 'USD' });
      if (q) qs.set('search', q);
      const res = await fetch(`/api/giftcards?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) { setCatalogError(data.error || 'Impossible de charger le catalogue.'); return; }
      const list: Giftcard[] = data.data?.data || [];
      setCatalog(list);
      // Le catalogue ne montre que les cartes confirmées disponibles chez Pagocards — une page
      // peut donc contenir moins de 24 cartes tout en ayant une page suivante côté fournisseur ;
      // on se fie au drapeau calculé côté serveur plutôt qu'à la taille de la liste filtrée.
      setCatalogHasMore(Boolean(data.data?.hasMore));
    } catch { setCatalogError('Erreur réseau.'); }
    finally { setCatalogLoading(false); }
  }, [getToken]);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/giftcards/orders', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setOrders(data.data.orders);
    } catch { /* non bloquant */ }
  }, [getToken]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) router.push('/auth/login');
    if (firebaseUser) {
      Promise.all([fetchCatalog(1, ''), fetchOrders()]).finally(() => setPageLoading(false));
    }
  }, [firebaseUser, authLoading, router, fetchCatalog, fetchOrders]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCatalogPage(1);
    fetchCatalog(1, search);
  };

  const handlePageChange = (p: number) => {
    setCatalogPage(p);
    fetchCatalog(p, search);
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen stripes-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <Gift size={22} className="text-white" />
          </div>
          <p className="text-ink-secondary text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  const country = appUser?.country || 'BJ';

  return (
    <div className="stripes-light min-h-screen">
      <Sidebar onLogout={logout} userName={appUser?.displayName || 'Utilisateur'} />
      <MobileTopBar onMenu={() => setDrawerOpen(true)} unread={unreadCount} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={logout} userName={appUser?.displayName || 'Utilisateur'} />

      <div className="main-with-sidebar">
        <main className="max-w-5xl mx-auto px-5 py-10 pt-20 md:pt-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-surface-muted border border-surface-border rounded-full px-4 py-1.5 text-sm text-ink-secondary font-semibold mb-4">
              <Gift size={14} className="text-brand-orange" />Cartes cadeaux
            </div>
            <h1 className="text-3xl font-bold mb-2">Offrez ou utilisez une carte cadeau</h1>
            <p className="text-ink-secondary">Payez en Mobile Money, recevez votre code cadeau instantanément après confirmation du paiement. Catalogue en dollars US (USD) uniquement pour le moment.</p>
          </div>

          {orders.length > 0 && (
            <div className="mb-10">
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><ShoppingBag size={18} /> Mes cartes cadeaux</h2>
              <div className="card overflow-hidden">
                {orders.map(o => <OrderRow key={o.id} order={o} />)}
              </div>
            </div>
          )}

          <h2 className="font-bold text-lg mb-3">Catalogue</h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une carte cadeau (Amazon, Google Play, Steam...)"
                className="input-field w-full pl-10" />
            </div>
            <button type="submit" className="btn-secondary px-5">Rechercher</button>
          </form>

          {catalogError && <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm mb-5">{catalogError}</div>}

          {catalogLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-orange" /></div>
          ) : catalog.length === 0 ? (
            <div className="text-center py-16 text-ink-muted text-sm">Aucune carte cadeau trouvée.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {catalog.map((card) => (
                  <GiftcardTile key={card.sku} card={card} onClick={() => setSelectedCard(card)} />
                ))}
              </div>
              <Pagination page={catalogPage} hasMore={catalogHasMore} onChange={handlePageChange} loading={catalogLoading} />
            </>
          )}
        </main>
      </div>

      {selectedCard && (
        <BuyModal
          card={selectedCard}
          country={country}
          getToken={getToken}
          onClose={() => setSelectedCard(null)}
          onSuccess={() => setToast({ message: 'Redirection vers le paiement...', type: 'success' })}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
