'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

const COUNTRIES = [
  { code: 'BJ', name: 'Bénin' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'SN', name: 'Sénégal' },
  { code: 'TG', name: 'Togo' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'OTHER', name: 'Autre' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    country: 'BJ',
    customCountry: '',
    password: '',
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOther = form.country === 'OTHER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Minimum 8 caractères pour le mot de passe.');
      return;
    }
    if (isOther && !form.customCountry.trim()) {
      setError('Veuillez préciser votre pays.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        displayName: form.displayName,
        email: form.email,
        phone: form.phone,
        country: isOther ? form.customCountry.trim() : form.country,
        password: form.password,
      };
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Erreur lors de l'inscription.");
        setLoading(false);
        return;
      }
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch {
      setError('Erreur réseau. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Navbar */}
      <NavBar />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-5 pt-24 pb-10">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={15} /> Retour à l'accueil
          </Link>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-white" />
            </div>
            <span className="font-semibold tracking-wide">LFD WEB CARD</span>
          </div>

          <h1 className="text-3xl font-bold mb-1">Créer un compte</h1>
          <p className="text-ink-secondary mb-7">Obtenez votre carte virtuelle en 5 minutes</p>

          <div className="card p-7">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium mb-2">Nom complet</label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  className="input-field"
                  placeholder="Jean Dupont"
                />
              </div>

              {/* Email */}
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

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Téléphone <span className="text-ink-muted">(optionnel)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="+229 97 000 000"
                />
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium mb-2">Pays</label>
                <select
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value, customCountry: '' })}
                  className="input-field"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Champ pays personnalisé si "Autre" sélectionné */}
              {isOther && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-2">Précisez votre pays</label>
                  <input
                    type="text"
                    required
                    value={form.customCountry}
                    onChange={e => setForm({ ...form, customCountry: e.target.value })}
                    className="input-field"
                    placeholder="Ex : France, Maroc, Canada..."
                  />
                </div>
              )}

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-field pr-11"
                    placeholder="Minimum 8 caractères"
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

              {/* CGU */}
              <p className="text-xs text-ink-muted leading-relaxed">
                En créant un compte, vous acceptez nos{' '}
                <Link href="/legal/terms" className="text-brand-orange hover:underline">
                  conditions d'utilisation
                </Link>{' '}
                et notre{' '}
                <Link href="/legal/privacy" className="text-brand-orange hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5"
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-center text-sm text-ink-secondary mt-5">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-brand-orange font-semibold hover:underline">
                Se connecter
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
   Shared Navbar
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
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
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
                <CreditCard size={16} className="text-white" />
              </div>
              <span className="font-semibold tracking-wide text-sm">LFD WEB CARD</span>
            </div>
            <p className="text-ink-secondary text-sm leading-relaxed mt-3">
              La carte virtuelle internationale conçue pour l'Afrique. Payez partout, simplement.
            </p>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3">Produit</h4>
              <ul className="space-y-2 text-ink-secondary">
                <li><a href="#features" className="hover:text-ink-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-ink-primary transition-colors">Tarifs</a></li>
                <li><a href="#how" className="hover:text-ink-primary transition-colors">Comment ça marche</a></li>
                <li className="pt-3 mt-1 border-t border-surface-border">
                  <span className="font-semibold text-ink-primary">Compte</span>
                </li>
                <li><Link href="/auth/register" className="hover:text-ink-primary transition-colors">S'inscrire</Link></li>
                <li><Link href="/auth/login" className="hover:text-ink-primary transition-colors">Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Légal</h4>
              <ul className="space-y-2 text-ink-secondary">
                <li><Link href="/legal/privacy" className="hover:text-ink-primary transition-colors">Confidentialité</Link></li>
                <li><Link href="/legal/terms" className="hover:text-ink-primary transition-colors">Conditions d'utilisation</Link></li>
                <li><a href="#faq" className="hover:text-ink-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
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