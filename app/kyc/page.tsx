'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield, CheckCircle, Clock, XCircle, ArrowRight,
  Upload, Camera, CreditCard, Zap, AlertCircle,
  RefreshCw, ChevronRight, X, Eye
} from 'lucide-react';

type KycStatus = 'approved' | 'rejected' | 'pending' | 'in_review' | null;
type KycMethod = 'didit' | 'manual' | null;

interface KycData {
  status: KycStatus;
  method: KycMethod;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
}

// ── Compression image ────────────────────────────────────────────
async function compressImage(file: File, maxWidthPx = 1200, qualityJpeg = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidthPx) { height = Math.round((height * maxWidthPx) / width); width = maxWidthPx; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', qualityJpeg));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Image preview ────────────────────────────────────────────────
function ImagePreview({ src, label, onRemove }: { src: string; label: string; onRemove: () => void }) {
  const [showFull, setShowFull] = useState(false);
  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden border-2 border-brand-green bg-brand-green-light">
        <img src={src} alt={label} className="w-full h-36 object-cover cursor-pointer" onClick={() => setShowFull(true)} />
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => setShowFull(true)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white">
            <Eye size={13} className="text-ink-secondary" />
          </button>
          <button onClick={onRemove} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white">
            <X size={13} className="text-red-500" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
          <span className="text-white text-xs font-medium flex items-center gap-1">
            <CheckCircle size={11} />{label}
          </span>
        </div>
      </div>
      {showFull && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowFull(false)}>
          <img src={src} alt={label} className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}

// ── Upload zone ──────────────────────────────────────────────────
function UploadZone({ label, hint, icon, value, onChange }: {
  label: string; hint: string; icon: React.ReactNode;
  value: string | null; onChange: (b64: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    try { onChange(await compressImage(file, 1200, 0.82)); }
    finally { setLoading(false); }
  };

  if (value) return null;

  return (
    <div
      className="border-2 border-dashed border-surface-border rounded-2xl p-5 text-center cursor-pointer hover:border-brand-orange/50 hover:bg-brand-orange-light/30 transition-all"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
    >
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      <div className="w-10 h-10 bg-brand-orange-light rounded-2xl flex items-center justify-center mx-auto mb-2">
        {loading ? <RefreshCw size={18} className="text-brand-orange animate-spin" /> : icon}
      </div>
      <div className="font-medium text-sm mb-0.5">{label}</div>
      <div className="text-ink-muted text-xs">{hint}</div>
      <div className="text-ink-muted text-[11px] mt-1">Glisser-déposer ou cliquer · JPG/PNG · max 5 MB</div>
    </div>
  );
}

// ── Status banner ────────────────────────────────────────────────
function StatusBanner({ kyc }: { kyc: KycData }) {
  if (kyc.status === 'approved') {
    return (
      <div className="bg-brand-green-light border border-brand-green/30 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center flex-shrink-0">
          <CheckCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-green-800 mb-1">Identité vérifiée</h3>
          <p className="text-green-700 text-sm">Votre identité a été confirmée. Vous pouvez maintenant acheter votre carte virtuelle.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-3 btn-primary text-sm py-2">
            Aller au tableau de bord <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (kyc.status === 'pending' || kyc.status === 'in_review') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Clock size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-yellow-800 mb-1">Vérification en cours</h3>
          <p className="text-yellow-700 text-sm">
            {kyc.method === 'manual'
              ? "Votre dossier est en cours d'examen par notre équipe. Vous recevrez une notification dès la décision."
              : 'Votre vérification automatique est en cours de traitement.'}
          </p>
          {kyc.method === 'manual' && kyc.submittedAt && (
            <p className="text-yellow-600 text-xs mt-1.5">
              Soumis le {new Date(kyc.submittedAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (kyc.status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <XCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-red-800 mb-1">Vérification refusée</h3>
          {kyc.rejectionReason && (
            <p className="text-red-700 text-sm mb-2">Raison : <strong>{kyc.rejectionReason}</strong></p>
          )}
          <p className="text-red-600 text-sm">Vous pouvez soumettre à nouveau votre dossier en choisissant une méthode ci-dessous.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Main KYC Page ────────────────────────────────────────────────
export default function KycPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading, getToken } = useAuth();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [mode, setMode] = useState<'choose' | 'didit' | 'manual'>('choose');

  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitDone, setSubmitDone] = useState(false);

  const [diditLoading, setDiditLoading] = useState(false);
  const [diditError, setDiditError] = useState('');

  const fetchKyc = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setKyc(data.data);
    } finally { setPageLoading(false); }
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) router.push('/auth/login');
    if (firebaseUser) fetchKyc();
  }, [firebaseUser, authLoading, router, fetchKyc]);

  const isManualLocked = kyc?.method === 'manual' && kyc?.status === 'pending';
  const showChoiceBlock = !kyc || kyc.status === 'rejected' || !kyc.status || kyc.method !== 'manual' || kyc.status !== 'pending';

  const handleDidit = async () => {
    setDiditLoading(true); setDiditError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/start', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) { setDiditError(data.error); setDiditLoading(false); return; }
      window.location.href = data.data.url;
    } catch { setDiditError('Erreur réseau.'); setDiditLoading(false); }
  };

  const handleManualSubmit = async () => {
    if (!idFront || !idBack || !selfie) { setSubmitError('Veuillez fournir les 3 photos.'); return; }
    setSubmitLoading(true); setSubmitError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/kyc/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idFront, idBack, selfie }),
      });
      const data = await res.json();
      if (!data.success) { setSubmitError(data.error); setSubmitLoading(false); return; }
      setSubmitDone(true);
      await fetchKyc();
    } catch { setSubmitError('Erreur réseau.'); setSubmitLoading(false); }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
            <Shield size={22} className="text-white" />
          </div>
          <p className="text-ink-secondary text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Header */}
      <header className="bg-white border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={15} className="text-white" />
            </div>
            <span className="font-semibold tracking-wide">LFD WEB CARD</span>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">Tableau de bord</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        {/* Titre */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-orange-light border border-brand-orange/20 rounded-full px-4 py-1.5 text-sm text-brand-orange font-semibold mb-4">
            <Shield size={14} />Vérification d'identité obligatoire
          </div>
          <h1 className="text-3xl font-bold mb-2">Vérifiez votre identité</h1>
          <p className="text-ink-secondary">
            La vérification d'identité est obligatoire avant d'obtenir ou d'utiliser votre carte virtuelle LFD WEB CARD.
          </p>
        </div>

        {/* Status banner */}
        {kyc && kyc.status && <div className="mb-8"><StatusBanner kyc={kyc} /></div>}

        {kyc?.status === 'approved' ? null : (
          <>
            {/* Choix méthode */}
            {mode === 'choose' && showChoiceBlock && !isManualLocked && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="font-semibold text-lg">Choisissez votre méthode de vérification</h2>

                <button onClick={() => setMode('didit')}
                  className="w-full card p-5 text-left hover:shadow-card-hover transition-shadow border-2 hover:border-brand-orange/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Zap size={22} className="text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Vérification automatique</span>
                        <span className="badge-green text-[11px]">Recommandée</span>
                      </div>
                      <p className="text-ink-secondary text-sm leading-relaxed">
                        Vérification instantanée via Didit. Scannez votre pièce d'identité et faites un selfie. Résultat en quelques secondes.
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />220+ pays</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />14 000+ documents</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />Résultat immédiat</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-muted mt-1 flex-shrink-0" />
                  </div>
                </button>

                <button onClick={() => setMode('manual')}
                  className="w-full card p-5 text-left hover:shadow-card-hover transition-shadow border-2 hover:border-brand-orange/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-orange-light rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Upload size={22} className="text-brand-orange" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Vérification manuelle</span>
                        <span className="badge-gray text-[11px]">1–24h</span>
                      </div>
                      <p className="text-ink-secondary text-sm leading-relaxed">
                        Envoyez une photo de votre pièce d'identité recto, verso et un selfie. Notre équipe examine votre dossier.
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />Examen humain</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} className="text-brand-green" />Sécurisé</span>
                        <span className="flex items-center gap-1"><Clock size={11} className="text-yellow-500" />1 à 24 heures</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-muted mt-1 flex-shrink-0" />
                  </div>
                </button>
              </div>
            )}

            {/* Mode Didit */}
            {mode === 'didit' && (
              <div className="card p-6 animate-fade-in">
                <button onClick={() => setMode('choose')} className="flex items-center gap-1.5 text-ink-secondary text-sm mb-5 hover:text-ink-primary transition-colors">
                  ← Retour
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Zap size={30} className="text-blue-500" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Vérification automatique</h3>
                  <p className="text-ink-secondary text-sm mb-6 max-w-sm mx-auto">
                    Vous allez être redirigé vers notre partenaire Didit pour une vérification instantanée. Gardez votre pièce d'identité à portée de main.
                  </p>
                  <div className="bg-surface-muted rounded-2xl p-4 mb-6 text-left space-y-2">
                    {[
                      "Votre pièce d'identité (CNI, passeport ou permis)",
                      'Bonne luminosité pour le selfie',
                      '2 à 5 minutes de votre temps',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-ink-secondary">
                        <CheckCircle size={14} className="text-brand-green flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  {diditError && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{diditError}</div>}
                  <button onClick={handleDidit} disabled={diditLoading} className="btn-primary w-full py-3.5">
                    {diditLoading ? 'Redirection en cours...' : 'Démarrer la vérification →'}
                  </button>
                </div>
              </div>
            )}

            {/* Mode Manuel */}
            {mode === 'manual' && !isManualLocked && (
              <div className="card p-6 animate-fade-in">
                <button onClick={() => setMode('choose')} className="flex items-center gap-1.5 text-ink-secondary text-sm mb-5 hover:text-ink-primary transition-colors">
                  ← Retour
                </button>

                {submitDone ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-brand-green-light rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-brand-green" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Dossier soumis</h3>
                    <p className="text-ink-secondary text-sm mb-5">Notre équipe examine votre dossier. Vous recevrez une notification dans les 24 heures.</p>
                    <Link href="/dashboard" className="btn-primary">Retour au tableau de bord</Link>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-xl mb-1">Vérification manuelle</h3>
                    <p className="text-ink-secondary text-sm mb-6">
                      Fournissez 3 photos claires. Les images sont compressées automatiquement.
                    </p>

                    <div className="bg-brand-orange-light border border-brand-orange/20 rounded-2xl p-4 mb-5">
                      <p className="text-brand-orange font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <AlertCircle size={15} />Instructions importantes
                      </p>
                      <ul className="text-sm text-brand-orange-dark space-y-1 list-disc pl-4">
                        <li>Photos nettes et lisibles, sans reflet ni flou</li>
                        <li>Selfie : tenez votre pièce d'identité à côté de votre visage</li>
                        <li>Bonne luminosité, fond uni de préférence</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      {/* Recto */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-brand-orange-light rounded-lg flex items-center justify-center">
                            <CreditCard size={13} className="text-brand-orange" />
                          </div>
                          Recto de la pièce d'identité
                        </label>
                        {idFront
                          ? <ImagePreview src={idFront} label="Recto" onRemove={() => setIdFront(null)} />
                          : <UploadZone label="Recto" hint="Face avant de votre CNI, passeport ou permis" icon={<CreditCard size={18} className="text-brand-orange" />} value={idFront} onChange={setIdFront} />
                        }
                      </div>

                      {/* Verso */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-brand-orange-light rounded-lg flex items-center justify-center">
                            <CreditCard size={13} className="text-brand-orange" />
                          </div>
                          Verso de la pièce d'identité
                        </label>
                        {idBack
                          ? <ImagePreview src={idBack} label="Verso" onRemove={() => setIdBack(null)} />
                          : <UploadZone label="Verso" hint="Face arrière de votre pièce d'identité" icon={<CreditCard size={18} className="text-brand-orange" />} value={idBack} onChange={setIdBack} />
                        }
                      </div>

                      {/* Selfie */}
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-brand-orange-light rounded-lg flex items-center justify-center">
                            <Camera size={13} className="text-brand-orange" />
                          </div>
                          Selfie avec la pièce d'identité
                        </label>
                        {selfie
                          ? <ImagePreview src={selfie} label="Selfie" onRemove={() => setSelfie(null)} />
                          : <UploadZone label="Selfie" hint="Tenez votre pièce d'identité visible à côté de votre visage" icon={<Camera size={18} className="text-brand-orange" />} value={selfie} onChange={setSelfie} />
                        }
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2 mt-4 mb-5">
                      {[idFront, idBack, selfie].map((v, i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${v ? 'bg-brand-green' : 'bg-surface-border'}`} />
                      ))}
                      <span className="text-xs text-ink-muted ml-1">{[idFront, idBack, selfie].filter(Boolean).length}/3</span>
                    </div>

                    {submitError && <div className="bg-red-50 text-red-600 rounded-2xl p-3 text-sm mb-4">{submitError}</div>}

                    <button
                      onClick={handleManualSubmit}
                      disabled={submitLoading || !idFront || !idBack || !selfie}
                      className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitLoading ? 'Envoi en cours...' : 'Soumettre mon dossier →'}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}