'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { FadeIn, Stagger, StaggerItem } from '@/components/FadeIn';
import {
  ArrowRight, Menu as MenuIcon, CreditCard, TrendingUp, ArrowDownLeft,
  Gift, Users, CheckCircle, ShieldCheck,
} from 'lucide-react';

function Navbar() {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-border">
      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors">Accueil</Link>
          <Link href="/comparaison" className="text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors">Comparatif</Link>
          <Link href={firebaseUser ? '/dashboard' : '/auth/register'} className="btn-primary text-sm py-2.5 px-5">
            {firebaseUser ? 'Mon tableau de bord' : 'Créer un compte'} <ArrowRight size={15} />
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center">
          <MenuIcon size={18} />
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-surface-border px-5 py-4 space-y-3 bg-white">
          <Link href="/" className="block text-sm font-medium text-ink-secondary">Accueil</Link>
          <Link href="/comparaison" className="block text-sm font-medium text-ink-secondary">Comparatif</Link>
          <Link href={firebaseUser ? '/dashboard' : '/auth/register'} className="btn-primary text-sm w-full justify-center">
            {firebaseUser ? 'Mon tableau de bord' : 'Créer un compte'}
          </Link>
        </div>
      )}
    </nav>
  );
}

interface PriceRow { label: string; value: string; }
interface PriceCard {
  icon: React.ReactNode;
  title: string;
  headline: string;
  headlineSub: string;
  rows: PriceRow[];
  note?: string;
}

const CARDS: PriceCard[] = [
  {
    icon: <CreditCard size={20} className="text-white" />,
    title: 'Création de carte',
    headline: '5 000 FCFA',
    headlineSub: '+ frais de service',
    rows: [
      { label: 'Prix de la carte', value: '5 000 FCFA' },
      { label: 'Frais de service', value: '5 %' },
      { label: 'Validité', value: '3 ans' },
      { label: 'Marques disponibles', value: 'Visa et Mastercard' },
      { label: 'Cartes par compte', value: 'Illimité' },
    ],
    note: 'Deux formules au choix à la commande : "Nouvelle génération" (retraits Mobile Money sans frais) ou "Classique". Le prix et les frais de service sont identiques dans les deux cas.',
  },
  {
    icon: <TrendingUp size={20} className="text-white" />,
    title: 'Rechargement',
    headline: 'Frais de service',
    headlineSub: '5 % du montant',
    rows: [
      { label: 'Frais de service', value: '5 %' },
      { label: 'Montant minimum', value: '30 000 FCFA' },
      { label: 'Montant maximum', value: '500 000 FCFA' },
      { label: 'Crédit sur la carte', value: 'Instantané' },
      { label: 'Conversion', value: 'Automatique en USD' },
    ],
    note: 'Le rechargement peut aussi être ajouté directement au moment de la commande d\'une carte.',
  },
  {
    icon: <ArrowDownLeft size={20} className="text-white" />,
    title: 'Retrait vers Mobile Money',
    headline: 'Selon la formule',
    headlineSub: 'de votre carte',
    rows: [
      { label: 'Mastercard — formule Classique', value: '1 $ de frais' },
      { label: 'Visa — formule Nouvelle génération', value: 'Aucun frais' },
      { label: 'Visa — formule Classique', value: 'Non disponible' },
      { label: 'Traitement', value: 'Souvent instantané, sinon sous 24 à 48h' },
    ],
    note: 'Le montant est prélevé sur la carte immédiatement. Un envoi automatique et instantané vers votre Mobile Money est tenté en premier ; s\'il n\'aboutit pas, le virement est traité manuellement sous 24 à 48h.',
  },
  {
    icon: <Gift size={20} className="text-white" />,
    title: 'Cartes cadeaux',
    headline: 'Frais de service',
    headlineSub: '5 % du montant',
    rows: [
      { label: 'Frais de service', value: '5 %' },
      { label: 'Devises acceptées', value: 'USD uniquement pour le moment' },
      { label: 'Livraison du code', value: 'Instantanée après paiement' },
    ],
  },
];

export default function TarifsPage() {
  const { firebaseUser } = useAuth();

  return (
    <div className="min-h-screen stripes-light">
      <Navbar />

      <main>
        <section className="py-16 sm:py-20 px-5 sm:px-8 lg:px-12 xl:px-16">
          <FadeIn className="max-w-3xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-surface-muted border border-surface-border rounded-full px-4 py-1.5 text-sm text-ink-secondary font-semibold mb-4">
              <ShieldCheck size={14} className="text-brand-orange" /> Tarifs
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Des tarifs simples, annoncés avant chaque paiement</h1>
            <p className="text-ink-secondary text-lg">
              Aucun frais caché, aucune surprise. Le montant total est toujours affiché avant confirmation, quelle que soit l'opération.
            </p>
          </FadeIn>

          <Stagger className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {CARDS.map((c) => (
              <StaggerItem key={c.title} className="card p-7 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 bg-brand-orange rounded-2xl flex items-center justify-center mb-5">
                  {c.icon}
                </div>
                <h2 className="font-bold text-xl mb-1">{c.title}</h2>
                <div className="text-2xl font-bold text-brand-orange mb-0.5">{c.headline}</div>
                <div className="text-ink-muted text-sm mb-5">{c.headlineSub}</div>
                <div className="divide-y divide-surface-border border-t border-surface-border">
                  {c.rows.map((r) => (
                    <div key={r.label} className="flex justify-between py-2.5 text-sm">
                      <span className="text-ink-secondary">{r.label}</span>
                      <span className="font-medium text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
                {c.note && <p className="text-ink-muted text-xs mt-4">{c.note}</p>}
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn className="max-w-3xl mx-auto mt-10">
            <div className="card p-7 flex items-start gap-4">
              <div className="w-11 h-11 bg-brand-green-light rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-brand-green" />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1">Programme de parrainage</h2>
                <p className="text-ink-secondary text-sm">
                  Les parrains touchent une commission à chaque rechargement effectué par les personnes qu'ils ont invitées. Le montant de la commission est fixé individuellement pour chaque parrain lors de la création de son compte.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn className="max-w-3xl mx-auto mt-6">
            <div className="bg-brand-orange-light border border-brand-orange/20 rounded-3xl p-6 flex items-start gap-3">
              <CheckCircle size={18} className="text-brand-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink-secondary">
                Sur chaque achat, rechargement, retrait ou carte cadeau, le récapitulatif détaillé (montant + frais + total) s'affiche avant toute confirmation de paiement.
              </p>
            </div>
          </FadeIn>

          <FadeIn className="text-center mt-14">
            <Link href={firebaseUser ? '/dashboard' : '/auth/register'} className="btn-primary inline-flex text-base py-3.5 px-8">
              {firebaseUser ? 'Aller à mon tableau de bord' : 'Créer mon compte gratuitement'} <ArrowRight size={18} />
            </Link>
          </FadeIn>
        </section>
      </main>

      <footer className="bg-white border-t border-surface-border py-12 px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
          <div>© 2026 LFD WEB CARD. Tous droits réservés.</div>
          <div className="flex gap-5">
            <Link href="/legal/terms" className="hover:text-ink-primary transition-colors">Conditions d'utilisation</Link>
            <Link href="/legal/privacy" className="hover:text-ink-primary transition-colors">Confidentialité</Link>
            <Link href="/" className="hover:text-ink-primary transition-colors">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
