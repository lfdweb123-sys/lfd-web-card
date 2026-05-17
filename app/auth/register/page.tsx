// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

const COUNTRIES = [
  { code: 'BJ', name: 'Bénin' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
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
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', country: 'BJ', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); setLoading(false); return; }
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch {
      setError('Erreur lors de l\'inscription. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors mb-8">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">VCardAfrica</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Créer un compte</h1>
          <p className="text-text-secondary">Obtenez votre carte virtuelle en 5 minutes</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm mb-6">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <input type="text" required value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                className="input-field" placeholder="Jean Dupont" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="votre@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone <span className="text-text-muted">(optionnel)</span></label>
              <input type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input-field" placeholder="+229 97 000 000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pays</label>
              <select value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="input-field">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12" placeholder="Minimum 8 caractères" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-brand-orange-light rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle size={16} className="text-brand-orange flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-orange">
                En créant un compte, vous acceptez nos conditions d'utilisation. Votre carte sera créée après paiement.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-center text-sm text-text-secondary mt-6">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-brand-orange font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
