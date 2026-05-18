'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const COUNTRIES = [
  { code: 'BJ', name: 'Bénin' }, { code: 'CI', name: "Côte d'Ivoire" }, { code: 'SN', name: 'Sénégal' },
  { code: 'TG', name: 'Togo' }, { code: 'ML', name: 'Mali' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'GN', name: 'Guinée' }, { code: 'CM', name: 'Cameroun' }, { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' }, { code: 'OTHER', name: 'Autre' },
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
    if (form.password.length < 8) { setError('Minimum 8 caractères pour le mot de passe.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Erreur lors de l\'inscription.'); setLoading(false); return; }
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch { setError('Erreur réseau. Réessayez.'); setLoading(false); }
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
        <h1 className="text-3xl font-bold mb-1">Créer un compte</h1>
        <p className="text-ink-secondary mb-7">Obtenez votre carte virtuelle en 5 minutes</p>
        <div className="card p-7">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <input type="text" required value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="input-field" placeholder="Jean Dupont" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="votre@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone <span className="text-ink-muted">(optionnel)</span></label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+229 97 000 000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pays</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-field">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field pr-11" placeholder="Minimum 8 caractères" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              En créant un compte, vous acceptez nos{' '}
              <Link href="/legal/terms" className="text-brand-orange hover:underline">conditions d'utilisation</Link> et notre{' '}
              <Link href="/legal/privacy" className="text-brand-orange hover:underline">politique de confidentialité</Link>.
            </p>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">{loading ? 'Création...' : 'Créer mon compte'}</button>
          </form>
          <p className="text-center text-sm text-ink-secondary mt-5">
            Déjà un compte ? <Link href="/auth/login" className="text-brand-orange font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
