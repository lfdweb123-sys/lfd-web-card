// app/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard, Globe, Shield, Zap, ArrowRight,
  CheckCircle, Star, Menu, X, ChevronDown,
  Smartphone, Lock, TrendingUp, Users
} from 'lucide-react';

// ---- Navbar ----
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg">VCardAfrica</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Fonctionnalités</a>
            <a href="#how" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Comment ça marche</a>
            <a href="#pricing" className="text-text-secondary hover:text-text-primary text-sm transition-colors">Tarifs</a>
            <a href="#faq" className="text-text-secondary hover:text-text-primary text-sm transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2">Obtenir ma carte</Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-surface-border px-4 py-4 flex flex-col gap-3 animate-fade-in">
          <a href="#features" className="text-text-secondary py-2 text-sm" onClick={() => setOpen(false)}>Fonctionnalités</a>
          <a href="#how" className="text-text-secondary py-2 text-sm" onClick={() => setOpen(false)}>Comment ça marche</a>
          <a href="#pricing" className="text-text-secondary py-2 text-sm" onClick={() => setOpen(false)}>Tarifs</a>
          <a href="#faq" className="text-text-secondary py-2 text-sm" onClick={() => setOpen(false)}>FAQ</a>
          <div className="flex flex-col gap-2 pt-2 border-t border-surface-border">
            <Link href="/auth/login" className="btn-secondary text-sm text-center">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm text-center">Obtenir ma carte</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ---- Hero Card Visual ----
function HeroCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Card glow */}
      <div className="absolute inset-0 bg-brand-orange/20 blur-3xl rounded-full scale-110" />
      {/* Back card */}
      <div className="absolute top-6 left-6 right-0 h-48 rounded-3xl opacity-40"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }} />
      {/* Main card */}
      <div className="relative virtual-card card-shine shadow-2xl">
        {/* Chip & Logo */}
        <div className="flex items-start justify-between mb-8">
          <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md opacity-90"
            style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' }} />
          <div className="text-right">
            <div className="text-xs text-white/50 font-body">VIRTUAL</div>
            <div className="font-display font-bold text-sm tracking-wider">VISA</div>
          </div>
        </div>
        {/* Number */}
        <div className="font-mono text-lg tracking-widest mb-6 text-white/90">
          •••• •••• •••• 4242
        </div>
        {/* Footer */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white/40 text-xs mb-1">TITULAIRE</div>
            <div className="font-medium text-sm">JEAN DUPONT</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">EXPIRE</div>
            <div className="font-medium text-sm">12/28</div>
          </div>
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-80" />
            <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-80 translate-x-3" />
          </div>
        </div>
        {/* Shine */}
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-5 rounded-3xl"
          style={{ background: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
      </div>
      {/* Notification bubble */}
      <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-card p-3 flex items-center gap-2 animate-slide-up border border-surface-border">
        <div className="w-8 h-8 bg-brand-green-light rounded-xl flex items-center justify-center">
          <CheckCircle size={16} className="text-brand-green" />
        </div>
        <div>
          <div className="text-xs font-medium text-text-primary">Paiement accepté</div>
          <div className="text-xs text-text-muted">Amazon — $24.99</div>
        </div>
      </div>
    </div>
  );
}

// ---- Hero Section ----
function HeroSection() {
  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-brand-orange-light border border-brand-orange/20 rounded-full px-4 py-1.5 text-sm text-brand-orange font-medium mb-6">
              <Star size={14} fill="currentColor" />
              Carte acceptée dans 180+ pays
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Votre carte virtuelle{' '}
              <span className="text-gradient">internationale</span>{' '}
              en 5 minutes
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-lg">
              Payez sur Amazon, Netflix, Alibaba et partout dans le monde.
              Obtenez votre carte Visa virtuelle instantanément après paiement Mobile Money.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/auth/register" className="btn-primary text-base flex items-center justify-center gap-2">
                Obtenir ma carte maintenant
                <ArrowRight size={18} />
              </Link>
              <a href="#how" className="btn-secondary text-base text-center">
                Comment ça marche
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-brand-green" />
                Activation instantanée
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-brand-green" />
                Sans frais cachés
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- Stats Bar ----
function StatsBar() {
  const stats = [
    { value: '5 min', label: 'Pour obtenir votre carte' },
    { value: '180+', label: 'Pays acceptés' },
    { value: '3DS', label: 'Sécurité renforcée' },
    { value: '24/7', label: 'Support disponible' },
  ];
  return (
    <section className="py-10 border-y border-surface-border bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <div className="font-display text-3xl font-extrabold text-brand-orange">{s.value}</div>
              <div className="text-text-secondary text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Features Section ----
function FeaturesSection() {
  const features = [
    {
      icon: <Zap size={24} className="text-brand-orange" />,
      title: 'Activation instantanée',
      desc: 'Payez avec Mobile Money (MTN, Moov, Orange...) et recevez votre carte virtuelle immédiatement. Zéro attente, zéro paperasse.',
      color: 'bg-brand-orange-light',
    },
    {
      icon: <Globe size={24} className="text-blue-500" />,
      title: 'Acceptée partout',
      desc: 'Votre carte Visa fonctionne sur tous les sites e-commerce : Amazon, Netflix, Shopify, PayPal, Google, Apple Store et bien plus.',
      color: 'bg-blue-50',
    },
    {
      icon: <Shield size={24} className="text-brand-green" />,
      title: 'Sécurité maximale',
      desc: 'Protection 3D Secure sur chaque transaction. Gelez et dégelez votre carte depuis votre tableau de bord en un clic.',
      color: 'bg-brand-green-light',
    },
    {
      icon: <Smartphone size={24} className="text-purple-500" />,
      title: 'Gérez depuis votre téléphone',
      desc: 'Tableau de bord mobile-first. Consultez votre solde, vos transactions et rechargez votre carte à tout moment.',
      color: 'bg-purple-50',
    },
    {
      icon: <TrendingUp size={24} className="text-brand-orange" />,
      title: 'Rechargement facile',
      desc: 'Rechargez votre carte à tout moment via Mobile Money. Le solde est disponible instantanément sur votre carte.',
      color: 'bg-brand-orange-light',
    },
    {
      icon: <Lock size={24} className="text-red-500" />,
      title: 'Données protégées',
      desc: 'Vos informations personnelles sont chiffrées et jamais partagées. Conformité totale aux standards fintech internationaux.',
      color: 'bg-red-50',
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-surface-muted rounded-full px-4 py-1.5 text-sm text-text-secondary mb-4">
            Pourquoi nous choisir
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Une solution simple, rapide et sécurisée conçue pour l'Afrique.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-card-hover transition-shadow duration-300">
              <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- How it works ----
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Créez votre compte',
      desc: 'Inscription rapide avec votre email. Aucun document requis pour commencer.',
      icon: <Users size={20} />,
    },
    {
      num: '02',
      title: 'Payez avec Mobile Money',
      desc: 'Choisissez votre opérateur (MTN, Moov, Orange...) et payez le montant de la carte.',
      icon: <Smartphone size={20} />,
    },
    {
      num: '03',
      title: 'Recevez votre carte',
      desc: 'Votre carte virtuelle Visa est créée automatiquement après confirmation du paiement.',
      icon: <CreditCard size={20} />,
    },
    {
      num: '04',
      title: 'Payez partout dans le monde',
      desc: 'Utilisez votre carte sur tous les sites e-commerce internationaux immédiatement.',
      icon: <Globe size={20} />,
    },
  ];

  return (
    <section id="how" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Obtenez votre carte en 4 étapes
          </h2>
          <p className="text-text-secondary text-lg">Simple, rapide, sans tracas.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-surface-border z-0" style={{ width: 'calc(100% - 48px)', left: '48px' }} />
              )}
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white mb-4 shadow-orange">
                  {step.icon}
                </div>
                <div className="font-display text-xs font-bold text-brand-orange tracking-widest mb-2">{step.num}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Where to use ----
function WhereToUse() {
  const platforms = ['Amazon', 'Netflix', 'Alibaba', 'Google Play', 'Apple Store', 'PayPal', 'Shopify', 'Adobe', 'Spotify', 'eBay', 'Canva', 'Notion'];
  return (
    <section className="py-20 px-4 sm:px-6 bg-surface-bg">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-4">
          Utilisable sur des milliers de sites
        </h2>
        <p className="text-text-secondary mb-10">Partout où Visa est accepté, votre carte fonctionne.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {platforms.map((p) => (
            <div key={p} className="bg-white border border-surface-border rounded-2xl px-5 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-brand-orange/30 hover:shadow-card transition-all duration-200 cursor-default">
              {p}
            </div>
          ))}
          <div className="bg-brand-orange-light border border-brand-orange/20 rounded-2xl px-5 py-3 text-sm font-medium text-brand-orange">
            + des milliers d'autres
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- Pricing ----
function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Tarifs simples et transparents</h2>
          <p className="text-text-secondary text-lg">Aucun frais caché. Payez une fois, utilisez à vie.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Achat carte */}
          <div className="card p-8 border-2 border-brand-orange relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="badge-orange">Populaire</span>
            </div>
            <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mb-6">
              <CreditCard size={24} className="text-white" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Création de carte</h3>
            <div className="font-display text-4xl font-extrabold mb-1 text-brand-orange">5 000 <span className="text-xl font-medium text-text-secondary">FCFA</span></div>
            <p className="text-text-secondary text-sm mb-6">Paiement unique. Carte valable 3 ans.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Carte Visa virtuelle internationale',
                'Activation instantanée',
                'Protection 3D Secure',
                'Tableau de bord inclus',
                'Support prioritaire',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle size={16} className="text-brand-green flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-primary w-full text-center block">
              Obtenir ma carte
            </Link>
          </div>

          {/* Rechargement */}
          <div className="card p-8">
            <div className="w-12 h-12 bg-brand-green-light rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp size={24} className="text-brand-green" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Rechargement</h3>
            <div className="font-display text-4xl font-extrabold mb-1 text-brand-green">0% <span className="text-xl font-medium text-text-secondary">de frais</span></div>
            <p className="text-text-secondary text-sm mb-6">Rechargez le montant que vous voulez.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Montant minimum : 1 000 FCFA',
                'Conversion automatique en USD',
                'Crédit instantané sur la carte',
                'Via Mobile Money',
                'Historique détaillé inclus',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle size={16} className="text-brand-green flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-secondary w-full text-center block">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- FAQ ----
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    {
      q: 'Combien de temps faut-il pour recevoir ma carte ?',
      a: 'Votre carte virtuelle est créée automatiquement dès confirmation de votre paiement Mobile Money. En général moins de 5 minutes.',
    },
    {
      q: 'Quels opérateurs Mobile Money sont acceptés ?',
      a: 'Nous acceptons MTN Mobile Money, Moov Money, Orange Money et d\'autres selon votre pays. Tous les principaux opérateurs d\'Afrique de l\'Ouest sont couverts.',
    },
    {
      q: 'Puis-je utiliser la carte sur PayPal ou Amazon ?',
      a: 'Oui ! Votre carte Visa fonctionne sur tous les sites qui acceptent Visa : Amazon, PayPal, Netflix, Google Play, Apple Store, et des milliers d\'autres.',
    },
    {
      q: 'Comment recharger ma carte ?',
      a: 'Depuis votre tableau de bord, cliquez sur "Recharger", entrez le montant en FCFA, choisissez votre opérateur Mobile Money et confirmez. Le solde est disponible immédiatement.',
    },
    {
      q: 'Que faire si je veux sécuriser ma carte temporairement ?',
      a: 'Vous pouvez geler votre carte en un clic depuis votre tableau de bord. Cela bloque toutes les transactions jusqu\'à ce que vous la dégeliez.',
    },
    {
      q: 'Mes données personnelles sont-elles en sécurité ?',
      a: 'Absolument. Vos données sont chiffrées et stockées de manière sécurisée. Nous n\'avons accès qu\'aux informations nécessaires à la création de votre carte.',
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-surface-bg">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl font-bold mb-4">Questions fréquentes</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-muted transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-6 text-text-secondary text-sm leading-relaxed border-t border-surface-border pt-4 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- CTA ----
function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #FF7A00 0%, #FF4500 60%, #CC3700 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
              Prêt à payer partout dans le monde ?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
              Rejoignez des milliers d'Africains qui paient en ligne sans frontières.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-brand-orange font-bold px-8 py-4 rounded-2xl hover:bg-white/90 transition-all duration-200 shadow-xl hover:-translate-y-0.5"
            >
              Obtenir ma carte maintenant
              <ArrowRight size={20} />
            </Link>
            <p className="text-white/60 text-sm mt-4">Activation en moins de 5 minutes • Paiement Mobile Money</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- Footer ----
function Footer() {
  return (
    <footer className="bg-white border-t border-surface-border py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
                <CreditCard size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg">VCardAfrica</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              La carte virtuelle internationale conçue pour l'Afrique. Payez partout, simplement.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium text-sm mb-3">Produit</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#features" className="hover:text-text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition-colors">Tarifs</a></li>
                <li><a href="#how" className="hover:text-text-primary transition-colors">Comment ça marche</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-3">Compte</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/auth/register" className="hover:text-text-primary transition-colors">S'inscrire</Link></li>
                <li><Link href="/auth/login" className="hover:text-text-primary transition-colors">Se connecter</Link></li>
                <li><Link href="/dashboard" className="hover:text-text-primary transition-colors">Tableau de bord</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a></li>
                <li><a href="mailto:support@vcardafrica.com" className="hover:text-text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-text-muted">
          <div>© 2025 VCardAfrica. Tous droits réservés.</div>
          <div className="flex items-center gap-1">
            <Shield size={14} className="text-brand-green" />
            Paiements sécurisés par LFD Gateway
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---- Main Page ----
export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorks />
      <WhereToUse />
      <PricingSection />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}
