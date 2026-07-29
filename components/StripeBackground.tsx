'use client';

/**
 * Fond professionnel "rayures" utilisé sur les pages privées (connexion, inscription,
 * dashboard, admin, profil, KYC). Rayures diagonales fines + halos de couleur, très subtil,
 * pensé pour rester lisible et sobre — pas décoratif au point de distraire.
 */
export function StripeBackground({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  return (
    <div className={`fixed inset-0 -z-10 ${variant === 'dark' ? 'stripes-dark' : 'stripes-light'}`}>
      <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-brand-orange/20 rounded-full blur-[120px] animate-float-slow" />
      <div
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-brand-green/10 rounded-full blur-[120px] animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
    </div>
  );
}
