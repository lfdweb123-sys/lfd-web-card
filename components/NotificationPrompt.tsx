'use client';
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { isPushSupported, getPushPermission, enablePushNotifications } from '@/lib/messaging';

export function NotificationPrompt({ getToken }: { getToken: () => Promise<string> }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    const alreadyAsked = localStorage.getItem('lfd_push_prompt_dismissed');
    const permission = getPushPermission();
    if (permission === 'default' && !alreadyAsked) setVisible(true);
  }, []);

  if (!visible || dismissed) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const idToken = await getToken();
      const token = await enablePushNotifications(idToken);
      if (token) setDismissed(true);
      else {
        // Permission refusée ou erreur — on ne redemande plus dans cette session
        localStorage.setItem('lfd_push_prompt_dismissed', '1');
        setDismissed(true);
      }
    } catch {
      setDismissed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('lfd_push_prompt_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="card p-4 mb-5 flex items-start gap-3 border border-brand-orange/20 bg-brand-orange-light animate-fade-in">
      <div className="w-10 h-10 bg-brand-orange rounded-2xl flex items-center justify-center flex-shrink-0">
        <Bell size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-0.5">Activez les notifications</div>
        <p className="text-ink-secondary text-xs leading-relaxed mb-3">
          Soyez alerté en temps réel : carte prête, paiement, recharge, vérification d'identité et sécurité de votre compte.
        </p>
        <div className="flex gap-2">
          <button onClick={handleEnable} disabled={loading} className="btn-primary text-xs py-2 px-4">
            {loading ? 'Activation...' : 'Activer'}
          </button>
          <button onClick={handleDismiss} className="btn-secondary text-xs py-2 px-4">
            Plus tard
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-ink-muted hover:text-ink-primary flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
