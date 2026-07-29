'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { StripeBackground } from '@/components/StripeBackground';
import { CreditCard, Eye, EyeOff, ArrowLeft, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Panneau gauche — branding rayé ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden text-white flex-col justify-between p-10 xl:p-14">
        <StripeBackground variant="dark" />
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard size={17} className="text-white" />
            </div>
            <span className="font-semibold text-base tracking-wide">LFD WEB CARD</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Obtenez votre carte<br />en moins de 5 minutes.
          </h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-sm">
            Créez votre compte, payez avec Mobile Money, et commencez à payer partout dans le monde.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} className="text-brand-green" />
              </div>
              <span className="text-sm text-white/70">Aucun document requis pour commencer</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-brand-orange" />
              </div>
              <span className="text-sm text-white/70">Carte prête juste après le paiement</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-blue-400" />
              </div>
              <span className="text-sm text-white/70">Frais Mobile Money annoncés avant paiement</span>
            </div>
          </div>
        </motion.div>

        <p className="text-white/30 text-xs">© 2026 LFD WEB CARD. Tous droits réservés.</p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 -z-10 stripes-light lg:bg-white lg:bg-none" />
        <div className="lg:hidden px-5 pt-5">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide">LFD WEB CARD</span>
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center p-5 sm:p-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors"
            >
              <ArrowLeft size={15} /> Retour à l'accueil
            </Link>

            <h1 className="text-3xl font-bold mb-1 mt-4 lg:mt-0">Créer un compte</h1>
            <p className="text-ink-secondary mb-7">Obtenez votre carte virtuelle en 5 minutes</p>

            <div className="card p-6 sm:p-7 stripes-panel">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 relative">
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
                  {loading ? 'Création...' : (<>Créer mon compte <ArrowRight size={16} /></>)}
                </button>
              </form>

              <p className="text-center text-sm text-ink-secondary mt-5">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="text-brand-orange font-semibold hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>

            <p className="lg:hidden text-center text-xs text-ink-muted mt-8">
              © 2026 LFD WEB CARD. Tous droits réservés.
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
