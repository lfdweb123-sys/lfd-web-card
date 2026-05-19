'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Navbar */}
      <NavBar />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-5 pt-24">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={15} /> Retour à l'accueil
          </Link>

          <h1 className="text-3xl font-bold mb-1">Bienvenue</h1>
          <p className="text-ink-secondary mb-7">Connectez-vous à votre compte</p>

          <div className="card p-7">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Mot de passe</label>
                  <Link href="/auth/reset" className="text-xs text-brand-orange hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-field pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <p className="text-center text-sm text-ink-secondary mt-5">
              Pas encore de compte ?{' '}
              <Link href="/auth/register" className="text-brand-orange font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared Navbar (inline – exported separately
   if you prefer a dedicated file)
───────────────────────────────────────────── */
function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <span className="font-semibold tracking-wide text-sm">LFD WEB CARD</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {[
              ['#features', 'Fonctionnalités'],
              ['#how', 'Comment ça marche'],
              ['#pricing', 'Tarifs'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-ink-secondary hover:text-ink-primary text-sm font-medium transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">
              Connexion
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2.5">
              Obtenir ma carte
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-surface-border px-5 py-4 flex flex-col gap-3 animate-fade-in">
          {[
            ['#features', 'Fonctionnalités'],
            ['#how', 'Comment ça marche'],
            ['#pricing', 'Tarifs'],
            ['#faq', 'FAQ'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-ink-secondary py-1.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-surface-border">
            <Link href="/auth/login" className="btn-secondary text-sm">
              Connexion
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              Obtenir ma carte
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Shared Footer
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-white border-t border-surface-border py-12 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* 4 colonnes desktop / 1 colonne mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-sm">
          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
                <CreditCard size={16} className="text-white" />
              </div>
              <span className="font-semibold tracking-wide text-sm">LFD WEB CARD</span>
            </div>
            <p className="text-ink-secondary text-sm leading-relaxed">
              La carte virtuelle internationale conçue pour l'Afrique. Payez partout, simplement.
            </p>
          </div>

          {/* Col 2 — Produit */}
          <div>
            <h4 className="font-semibold mb-3">Produit</h4>
            <ul className="space-y-2 text-ink-secondary">
              <li><a href="#features" className="hover:text-ink-primary transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-ink-primary transition-colors">Tarifs</a></li>
              <li><a href="#how" className="hover:text-ink-primary transition-colors">Comment ça marche</a></li>
            </ul>
          </div>

          {/* Col 3 — Compte */}
          <div>
            <h4 className="font-semibold mb-3">Compte</h4>
            <ul className="space-y-2 text-ink-secondary">
              <li><Link href="/auth/register" className="hover:text-ink-primary transition-colors">S'inscrire</Link></li>
              <li><Link href="/auth/login" className="hover:text-ink-primary transition-colors">Se connecter</Link></li>
            </ul>
          </div>

          {/* Col 4 — Légal */}
          <div>
            <h4 className="font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-ink-secondary">
              <li><Link href="/legal/privacy" className="hover:text-ink-primary transition-colors">Confidentialité</Link></li>
              <li><Link href="/legal/terms" className="hover:text-ink-primary transition-colors">Conditions d'utilisation</Link></li>
              <li><a href="#faq" className="hover:text-ink-primary transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-ink-muted">
          <div>© 2025 LFD WEB CARD. Tous droits réservés.</div>
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-brand-green" />
            Paiements sécurisés par LFD Gateway
          </div>
        </div>
      </div>
    </footer>
  );
}