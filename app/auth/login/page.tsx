'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { StripeBackground } from '@/components/StripeBackground';
import { CreditCard, Eye, EyeOff, ArrowLeft, Shield, Globe, Zap, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Panneau gauche — branding rayé, visible dès tablette ── */}
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
            Votre carte virtuelle,<br />partout où vous allez.
          </h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-sm">
            Reconnectez-vous pour consulter votre solde, vos transactions et gérer votre carte en toute sécurité.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-brand-orange" />
              </div>
              <span className="text-sm text-white/70">Activation instantanée par Mobile Money</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Globe size={16} className="text-brand-green" />
              </div>
              <span className="text-sm text-white/70">Acceptée dans 180+ pays</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-blue-400" />
              </div>
              <span className="text-sm text-white/70">Protection 3D Secure sur chaque paiement</span>
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

        <main className="flex-1 flex items-center justify-center p-5 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors"
            >
              <ArrowLeft size={15} /> Retour à l'accueil
            </Link>

            <h1 className="text-3xl font-bold mb-1 mt-4 lg:mt-0">Bienvenue</h1>
            <p className="text-ink-secondary mb-7">Connectez-vous à votre compte</p>

            <div className="card p-6 sm:p-7 stripes-panel">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5 relative">
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
                  {loading ? 'Connexion...' : (<>Se connecter <ArrowRight size={16} /></>)}
                </button>
              </form>
              <p className="text-center text-sm text-ink-secondary mt-5">
                Pas encore de compte ?{' '}
                <Link href="/auth/register" className="text-brand-orange font-semibold hover:underline">
                  Créer un compte
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
