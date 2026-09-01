'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface CheckResult {
  name: string;
  ok: boolean;
  latencyMs: number;
  detail?: string;
}
interface StatusResponse {
  success: boolean;
  overall: 'operational' | 'degraded' | 'outage';
  checkedAt: string;
  checks: CheckResult[];
}

const OVERALL_LABEL: Record<StatusResponse['overall'], string> = {
  operational: 'Tous les systèmes sont opérationnels',
  degraded: 'Certains services sont perturbés',
  outage: "Panne de l'émetteur de cartes",
};

const OVERALL_COLOR: Record<StatusResponse['overall'], string> = {
  operational: 'text-brand-green bg-brand-green-light border-brand-green/20',
  degraded: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  outage: 'text-red-600 bg-red-50 border-red-200',
};

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);
      setError('');
    } catch {
      setError('Impossible de contacter le service de vérification.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // rafraîchi toutes les 60s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="min-h-screen stripes-light">
      <nav className="bg-white border-b border-surface-border px-5 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors">
          <ArrowLeft size={15} /> Retour à l'accueil
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-14">
        <div className="text-center mb-10">
          <p className="text-ink-muted text-sm font-medium mb-3">Statut du service</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">État de la plateforme LFD WEB CARD</h1>
          <p className="text-ink-secondary">
            Vérification en temps réel de la disponibilité de notre émetteur de cartes.
          </p>
        </div>

        {loading ? (
          <div className="card p-10 text-center">
            <RefreshCw size={28} className="text-brand-orange mx-auto animate-spin" />
          </div>
        ) : error ? (
          <div className="card p-6 bg-red-50 border-red-200 text-red-600 text-center">{error}</div>
        ) : status ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-3xl p-6 mb-6 flex items-center gap-4 ${OVERALL_COLOR[status.overall]}`}
            >
              {status.overall === 'operational' ? <CheckCircle size={28} />
                : status.overall === 'degraded' ? <AlertTriangle size={28} />
                : <XCircle size={28} />}
              <div>
                <div className="font-bold text-lg">{OVERALL_LABEL[status.overall]}</div>
                <div className="text-xs opacity-75">
                  Dernière vérification : {new Date(status.checkedAt).toLocaleTimeString('fr-FR')}
                </div>
              </div>
            </motion.div>

            <div className="card divide-y divide-surface-border overflow-hidden">
              {status.checks.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    {c.ok
                      ? <CheckCircle size={18} className="text-brand-green flex-shrink-0" />
                      : <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      {c.detail && <div className="text-ink-muted text-xs">{c.detail}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.ok ? 'bg-brand-green-light text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {c.ok ? 'Opérationnel' : 'Indisponible'}
                    </span>
                    <div className="text-ink-muted text-[11px] mt-1">{c.latencyMs} ms</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-ink-muted text-xs mt-6">
              Cette page se rafraîchit automatiquement toutes les 60 secondes.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
