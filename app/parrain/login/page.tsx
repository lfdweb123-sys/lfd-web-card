'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { StripeBackground } from '@/components/StripeBackground';
import { Gift, Eye, EyeOff, ArrowLeft, ArrowRight, Users, TrendingUp } from 'lucide-react';

export default function ParrainLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const token = await cred.user.getIdTokenResult();
      if (token.claims.role !== 'referrer') {
        await signOut(auth);
        setError("Ce compte n'est pas un compte parrain.");
        setLoading(false);
        return;
      }
      router.push('/parrain/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden text-white flex-col justify-between p-10 xl:p-14">
        <StripeBackground variant="dark" />
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={17} className="text-white" />
            </div>
            <span className="font-semibold text-base tracking-wide">Espace Parrain</span>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Suivez vos filleuls<br />et vos gains en temps réel.
          </h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-sm">
            Connectez-vous à votre espace parrain LFD WEB CARD.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-brand-orange" />
              </div>
              <span className="text-sm text-white/70">Nombre de filleuls inscrits avec votre code</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-brand-green" />
              </div>
              <span className="text-sm text-white/70">Gains sur chaque rechargement de vos filleuls</span>
            </div>
          </div>
        </motion.div>
        <p className="text-white/30 text-xs">© 2026 LFD WEB CARD. Tous droits réservés.</p>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 -z-10 stripes-light lg:bg-white lg:bg-none" />
        <div className="lg:hidden px-5 pt-5">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide">Espace Parrain</span>
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center p-5 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <Link href="/" className="hidden lg:inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors">
              <ArrowLeft size={15} /> Retour à l'accueil
            </Link>

            <h1 className="text-3xl font-bold mb-1 mt-4 lg:mt-0">Espace Parrain</h1>
            <p className="text-ink-secondary mb-7">Connectez-vous avec vos identifiants parrain</p>

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
                    placeholder="parrain@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input-field pr-11"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                  {loading ? 'Connexion...' : (<>Se connecter <ArrowRight size={16} /></>)}
                </button>
              </form>
              <p className="text-center text-xs text-ink-muted mt-5">
                Vos identifiants vous ont été fournis par l'équipe LFD WEB CARD.
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
