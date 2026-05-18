'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors">
          <ArrowLeft size={15} /> Retour à l'accueil
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
            <CreditCard size={18} className="text-white" />
          </div>
          <span className="font-semibold tracking-wide">LFD WEB CARD</span>
        </div>
        <h1 className="text-3xl font-bold mb-1">Bienvenue</h1>
        <p className="text-ink-secondary mb-7">Connectez-vous à votre compte</p>
        <div className="card p-7">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="votre@email.com" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Mot de passe</label>
                <Link href="/auth/reset" className="text-xs text-brand-orange hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">{loading ? 'Connexion...' : 'Se connecter'}</button>
          </form>
          <p className="text-center text-sm text-ink-secondary mt-5">
            Pas encore de compte ? <Link href="/auth/register" className="text-brand-orange font-semibold hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
