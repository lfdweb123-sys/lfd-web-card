'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await resetPassword(email);
      setDone(true);
    } catch {
      setError('Email introuvable ou erreur. Vérifiez l\'adresse saisie.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors">
          <ArrowLeft size={15} /> Retour à la connexion
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center">
            <CreditCard size={18} className="text-white" />
          </div>
          <span className="font-semibold tracking-wide">LFD WEB CARD</span>
        </div>
        <h1 className="text-3xl font-bold mb-1">Mot de passe oublié</h1>
        <p className="text-ink-secondary mb-7">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
        <div className="card p-7">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-brand-green-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-brand-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email envoyé !</h3>
              <p className="text-ink-secondary text-sm mb-5">Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.</p>
              <Link href="/auth/login" className="btn-primary w-full">Retour à la connexion</Link>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3.5 text-sm mb-5">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="votre@email.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
