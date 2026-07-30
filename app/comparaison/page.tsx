'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { FadeIn, Stagger, StaggerItem } from '@/components/FadeIn';
import {
  Check, X, Minus, ArrowRight, Menu as MenuIcon, ChevronDown,
  CreditCard, Smartphone, Clock, Shield, Globe, Palette,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

type CellValue = 'yes' | 'no' | 'partial' | string;

interface Row {
  label: string;
  icon: ReactNode;
  lfd: CellValue;
  bank: CellValue;
  prepaid: CellValue;
  other: CellValue;
}

const ROWS: Row[] = [
  { label: 'Paiement 100% Mobile Money', icon: <Smartphone size={16} />, lfd: 'yes', bank: 'no', prepaid: 'partial', other: 'partial' },
  { label: 'Aucun compte bancaire requis', icon: <CreditCard size={16} />, lfd: 'yes', bank: 'no', prepaid: 'yes', other: 'yes' },
  { label: 'Vérification d\'identité (KYC)', icon: <Shield size={16} />, lfd: 'Optionnelle', bank: 'Obligatoire', prepaid: 'Obligatoire', other: 'Obligatoire' },
  { label: 'Délai d\'obtention', icon: <Clock size={16} />, lfd: '< 5 min', bank: '1 à 3 semaines', prepaid: '1 à 5 jours', other: '10 min à 48h' },
  { label: 'Choix Visa ET Mastercard', icon: <CreditCard size={16} />, lfd: 'yes', bank: 'no', prepaid: 'no', other: 'partial' },
  { label: 'Frais affichés avant paiement', icon: <Shield size={16} />, lfd: 'yes', bank: 'partial', prepaid: 'partial', other: 'partial' },
  { label: 'Support en français', icon: <Globe size={16} />, lfd: 'yes', bank: 'partial', prepaid: 'no', other: 'partial' },
  { label: 'Cartes illimitées par compte', icon: <CreditCard size={16} />, lfd: 'yes', bank: 'no', prepaid: 'no', other: 'partial' },
  { label: 'Personnalisation de la carte', icon: <Palette size={16} />, lfd: 'yes', bank: 'no', prepaid: 'no', other: 'no' },
];

function Cell({ value }: { value: CellValue }) {
  if (value === 'yes') return <Check size={18} className="text-brand-green mx-auto" />;
  if (value === 'no') return <X size={18} className="text-red-400 mx-auto" />;
  if (value === 'partial') return <Minus size={18} className="text-yellow-500 mx-auto" />;
  return <span className="text-xs font-medium text-ink-secondary">{value}</span>;
}

function Navbar() {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-border">
      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors">Accueil</Link>
          <Link href={firebaseUser ? '/dashboard' : '/auth/register'} className="btn-primary text-sm py-2.5 px-5">
            {firebaseUser ? 'Mon tableau de bord' : 'Créer un compte'} <ArrowRight size={15} />
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden w-9 h-9 bg-surface-muted rounded-xl flex items-center justify-center">
          <MenuIcon size={18} />
        </button>
      </div>
      {open && (
        <div className="md:hidden px-5 pb-4 flex flex-col gap-2 border-t border-surface-border pt-3">
          <Link href="/" className="text-sm font-medium text-ink-secondary py-2">Accueil</Link>
          <Link href={firebaseUser ? '/dashboard' : '/auth/register'} className="btn-primary text-sm py-2.5 justify-center">
            {firebaseUser ? 'Mon tableau de bord' : 'Créer un compte'}
          </Link>
        </div>
      )}
    </nav>
  );
}

export default function ComparaisonPage() {
  const { firebaseUser } = useAuth();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs: [string, string][] = [
    ['Ces comparaisons sont-elles à jour ?', "Les offres du marché évoluent régulièrement. Ce tableau reflète les tendances générales observées sur le marché des cartes virtuelles et bancaires en Afrique — vérifiez toujours les conditions exactes de chaque prestataire avant de choisir."],
    ['Pourquoi le KYC est-il optionnel chez vous ?', "L'émetteur de nos cartes n'exige pas de vérification d'identité pour créer une carte virtuelle. Nous la proposons pour débloquer des avantages (limites plus élevées, support prioritaire), mais elle ne bloque jamais l'accès à votre carte."],
    ['Puis-je changer de carte après coup ?', "Oui. Vous pouvez posséder plusieurs cartes (Visa et Mastercard) sur un seul compte, sans limite."],
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 pb-14 px-5 sm:px-8 lg:px-12 xl:px-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 stripes-light" aria-hidden />
        <motion.div
          className="absolute top-10 -left-24 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px] -z-10"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
        <FadeIn className="max-w-3xl mx-auto text-center">
          <p className="text-ink-muted text-sm font-medium mb-3">Comparatif</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
            LFD WEB CARD face aux autres solutions
          </h1>
          <p className="text-ink-secondary text-lg leading-relaxed">
            Carte bancaire classique, carte prépayée physique, ou autres plateformes de cartes virtuelles :
            voici comment LFD WEB CARD se compare, point par point.
          </p>
        </FadeIn>
      </section>

      {/* Table — desktop */}
      <section className="px-5 sm:px-8 lg:px-12 xl:px-16 pb-16">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left p-4 font-semibold text-ink-secondary w-64">Critère</th>
                    <th className="p-4 text-center bg-brand-orange-light">
                      <div className="font-bold text-brand-orange">LFD WEB CARD</div>
                    </th>
                    <th className="p-4 text-center font-semibold text-ink-secondary">Carte bancaire classique</th>
                    <th className="p-4 text-center font-semibold text-ink-secondary">Carte prépayée physique</th>
                    <th className="p-4 text-center font-semibold text-ink-secondary">Autres cartes virtuelles</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-surface-muted/40' : ''}>
                      <td className="p-4 font-medium flex items-center gap-2.5">
                        <span className="text-brand-orange flex-shrink-0">{row.icon}</span>
                        {row.label}
                      </td>
                      <td className="p-4 text-center bg-brand-orange-light/40"><Cell value={row.lfd} /></td>
                      <td className="p-4 text-center"><Cell value={row.bank} /></td>
                      <td className="p-4 text-center"><Cell value={row.prepaid} /></td>
                      <td className="p-4 text-center"><Cell value={row.other} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>

          {/* Table — mobile/tablette : cartes empilées par critère */}
          <Stagger className="md:hidden space-y-3" gap={0.05}>
            {ROWS.map(row => (
              <StaggerItem key={row.label} className="card p-4">
                <div className="flex items-center gap-2 mb-3 font-medium text-sm">
                  <span className="text-brand-orange flex-shrink-0">{row.icon}</span>
                  {row.label}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-brand-orange-light p-2.5 flex flex-col items-center gap-1">
                    <span className="font-semibold text-brand-orange">LFD WEB CARD</span>
                    <Cell value={row.lfd} />
                  </div>
                  <div className="rounded-xl bg-surface-muted p-2.5 flex flex-col items-center gap-1">
                    <span className="font-medium text-ink-secondary text-center">Bancaire classique</span>
                    <Cell value={row.bank} />
                  </div>
                  <div className="rounded-xl bg-surface-muted p-2.5 flex flex-col items-center gap-1">
                    <span className="font-medium text-ink-secondary text-center">Prépayée physique</span>
                    <Cell value={row.prepaid} />
                  </div>
                  <div className="rounded-xl bg-surface-muted p-2.5 flex flex-col items-center gap-1">
                    <span className="font-medium text-ink-secondary text-center">Autres virtuelles</span>
                    <Cell value={row.other} />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <p className="text-ink-muted text-xs text-center mt-6 max-w-2xl mx-auto">
            Comparatif basé sur les tendances générales du marché à titre indicatif. Les offres réelles varient selon
            les prestataires, votre pays et votre profil — vérifiez toujours les conditions actuelles avant de choisir.
          </p>
        </div>
      </section>

      {/* Avantages / Inconvénients */}
      <section className="px-5 sm:px-8 lg:px-12 xl:px-16 pb-16 bg-surface-muted/40 py-16">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">En toute transparence</h2>
            <p className="text-ink-secondary text-lg">Aucune solution n'est parfaite pour tout le monde. Voici la nôtre, honnêtement.</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            <FadeIn className="card p-6 border-l-4 border-brand-green">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Check size={20} className="text-brand-green" /> Avantages
              </h3>
              <ul className="space-y-3 text-sm text-ink-secondary">
                {[
                  'Aucun compte bancaire ni justificatif de revenus nécessaire',
                  'Paiement 100% Mobile Money, dans votre devise locale',
                  "KYC optionnel — commencez sans attendre de validation",
                  'Carte prête en moins de 5 minutes après paiement',
                  'Choix entre Visa et Mastercard, plusieurs cartes possibles',
                  'Frais annoncés avant chaque paiement, sans surprise',
                ].map(a => (
                  <li key={a} className="flex items-start gap-2.5">
                    <Check size={15} className="text-brand-green flex-shrink-0 mt-0.5" /> {a}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.1} className="card p-6 border-l-4 border-yellow-400">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Minus size={20} className="text-yellow-500" /> Limites actuelles
              </h3>
              <ul className="space-y-3 text-sm text-ink-secondary">
                {[
                  'Carte virtuelle uniquement — pas de carte physique à retirer',
                  'Plafonds mensuels fixés par l\'émetteur (selon la marque choisie)',
                  'Le retrait vers Mobile Money est traité manuellement, sous 24-48h',
                  'Disponibilité selon les pays pris en charge par le Mobile Money',
                ].map(a => (
                  <li key={a} className="flex items-start gap-2.5">
                    <Minus size={15} className="text-yellow-500 flex-shrink-0 mt-0.5" /> {a}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 sm:px-8 lg:px-12 xl:px-16 py-16">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-10">
            <h2 className="text-3xl font-bold">Questions fréquentes</h2>
          </FadeIn>
          <div className="space-y-3">
            {faqs.map(([q, a], i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-muted transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="font-medium pr-4">{q}</span>
                  <ChevronDown size={17} className={`text-ink-muted flex-shrink-0 transition-transform duration-200 ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-ink-secondary text-sm leading-relaxed border-t border-surface-border pt-4">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-8 lg:px-12 xl:px-16 pb-20">
        <FadeIn
          className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center text-white"
          style={{ background: 'linear-gradient(115deg,#FF7A00 0%,#E06A00 40%,#FF9433 70%,#FF7A00 100%)' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Prêt à essayer LFD WEB CARD ?</h2>
          <p className="text-white/90 mb-7 max-w-md mx-auto">Sans compte bancaire, sans KYC obligatoire, en moins de 5 minutes.</p>
          <Link href={firebaseUser ? '/dashboard' : '/auth/register'} className="inline-flex items-center gap-2 bg-white text-brand-orange font-semibold px-7 py-3.5 rounded-2xl hover:shadow-xl transition-shadow">
            {firebaseUser ? 'Mon tableau de bord' : 'Créer mon compte gratuitement'} <ArrowRight size={18} />
          </Link>
        </FadeIn>
      </section>

      {/* Footer (identique à la landing) */}
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
