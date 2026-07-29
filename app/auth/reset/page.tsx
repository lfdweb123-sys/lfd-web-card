'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { StripeBackground } from '@/components/StripeBackground';
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
      setError("Email introuvable ou erreur. Vérifiez l'adresse saisie.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <StripeBackground variant="light" />
      <div className="px-5 sm:px-6 pt-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-wide">LFD WEB CARD</span>
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center p-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink-primary text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={15} /> Retour à la connexion
          </Link>

          <h1 className="text-3xl font-bold mb-1">Mot de passe oublié</h1>
          <p className="text-ink-secondary mb-7">
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </p>

          <div className="card p-6 sm:p-7 stripes-panel">
            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-brand-green-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-brand-green" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email envoyé !</h3>
                <p className="text-ink-secondary text-sm mb-5">
                  Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.
                </p>
                <Link href="/auth/login" className="btn-primary w-full">
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
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
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
