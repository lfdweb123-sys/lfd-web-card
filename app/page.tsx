'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Globe, Shield, Zap, ArrowRight, CheckCircle, Star, Menu, X, ChevronDown, Smartphone, Lock, TrendingUp, Users } from 'lucide-react';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
        <CreditCard size={16} className="text-white" />
      </div>
      <span className="font-semibold text-base tracking-wide">LFD WEB CARD</span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <div className="hidden md:flex items-center gap-7">
            {['#features', '#how', '#pricing', '#faq'].map((href, i) => (
              <a key={href} href={href} className="text-ink-secondary hover:text-ink-primary text-sm font-medium transition-colors">
                {['Fonctionnalités', 'Comment ça marche', 'Tarifs', 'FAQ'][i]}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2.5">Obtenir ma carte</Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-surface-border px-5 py-4 flex flex-col gap-3 animate-fade-in">
          {[['#features', 'Fonctionnalités'], ['#how', 'Comment ça marche'], ['#pricing', 'Tarifs'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="text-ink-secondary py-1.5 text-sm font-medium" onClick={() => setOpen(false)}>{label}</a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-surface-border">
            <Link href="/auth/login" className="btn-secondary text-sm">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm">Obtenir ma carte</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroCard() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="absolute inset-0 bg-brand-orange/15 blur-3xl rounded-full scale-110" />
      <div className="absolute top-5 left-5 right-0 h-44 rounded-3xl opacity-30" style={{ background: 'linear-gradient(135deg,#111827,#1e3a5f)' }} />
      <div className="relative vcard shadow-2xl">
        <div className="flex items-start justify-between mb-8">
          <div className="w-10 h-7 rounded-md" style={{ background: 'linear-gradient(135deg,#f6d365,#fda085)' }} />
          <div className="text-right">
            <div className="text-white/40 text-[10px] font-medium tracking-widest">VIRTUAL</div>
            <div className="font-bold text-sm tracking-widest">VISA</div>
          </div>
        </div>
        <div className="font-mono text-lg tracking-[0.18em] mb-6 text-white/80">•••• •••• •••• 4242</div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white/40 text-[10px] mb-0.5 tracking-widest">TITULAIRE</div>
            <div className="font-semibold text-sm">JEAN DUPONT</div>
          </div>
          <div>
            <div className="text-white/40 text-[10px] mb-0.5 tracking-widest">EXPIRE</div>
            <div className="font-semibold text-sm">12/28</div>
          </div>
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-80" />
            <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-80 translate-x-3" />
          </div>
        </div>
        <div className="absolute inset-0 rounded-3xl opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)', backgroundSize: '8px 8px' }} />
      </div>
      <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl shadow-card-hover p-3 flex items-center gap-2 border border-surface-border animate-slide-up">
        <div className="w-7 h-7 bg-brand-green-light rounded-xl flex items-center justify-center">
          <CheckCircle size={14} className="text-brand-green" />
        </div>
        <div>
          <div className="text-xs font-semibold">Paiement accepté</div>
          <div className="text-[11px] text-ink-muted">Amazon — $24.99</div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="pt-28 pb-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-1.5 bg-brand-orange-light border border-brand-orange/20 rounded-full px-4 py-1.5 text-sm text-brand-orange font-semibold mb-6">
            <Star size={13} fill="currentColor" /> Carte acceptée dans 180+ pays
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] mb-5">
            Votre carte virtuelle{' '}
            <span className="text-gradient">internationale</span>{' '}
            en 5 minutes
          </h1>
          <p className="text-ink-secondary text-lg leading-relaxed mb-8 max-w-lg">
            Payez sur Amazon, Netflix, Alibaba et partout dans le monde. Obtenez votre carte Visa virtuelle instantanément après paiement Mobile Money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-7">
            <Link href="/auth/register" className="btn-primary text-base py-3.5">
              Obtenir ma carte maintenant <ArrowRight size={18} />
            </Link>
            <a href="#how" className="btn-secondary text-base py-3.5">Comment ça marche</a>
          </div>
          <div className="flex items-center gap-5 text-sm text-ink-secondary">
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-brand-green" />Activation instantanée</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-brand-green" />Sans frais cachés</span>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-10 border-y border-surface-border bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[['5 min', 'Pour obtenir votre carte'], ['180+', 'Pays acceptés'], ['3DS', 'Sécurité renforcée'], ['24/7', 'Support disponible']].map(([v, l]) => (
          <div key={v} className="text-center">
            <div className="text-3xl font-bold text-brand-orange">{v}</div>
            <div className="text-ink-secondary text-sm mt-1">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: <Zap size={22} className="text-brand-orange" />, bg: 'bg-brand-orange-light', title: 'Activation instantanée', desc: 'Payez avec Mobile Money (MTN, Moov, Orange...) et recevez votre carte virtuelle immédiatement. Zéro attente, zéro paperasse.' },
    { icon: <Globe size={22} className="text-blue-500" />, bg: 'bg-blue-50', title: 'Acceptée partout', desc: 'Votre carte Visa fonctionne sur tous les sites e-commerce : Amazon, Netflix, Shopify, PayPal, Google, Apple Store et bien plus.' },
    { icon: <Shield size={22} className="text-brand-green" />, bg: 'bg-brand-green-light', title: 'Sécurité maximale', desc: 'Protection 3D Secure sur chaque transaction. Gelez et dégelez votre carte depuis votre tableau de bord en un clic.' },
    { icon: <Smartphone size={22} className="text-purple-500" />, bg: 'bg-purple-50', title: 'Gérez depuis votre téléphone', desc: 'Interface mobile-first. Consultez votre solde, vos transactions et rechargez votre carte à tout moment.' },
    { icon: <TrendingUp size={22} className="text-brand-orange" />, bg: 'bg-brand-orange-light', title: 'Rechargement facile', desc: 'Rechargez votre carte à tout moment via Mobile Money. Le solde est disponible instantanément sur votre carte.' },
    { icon: <Lock size={22} className="text-red-500" />, bg: 'bg-red-50', title: 'Données protégées', desc: 'Vos informations personnelles sont chiffrées et jamais partagées. Conformité totale aux standards fintech internationaux.' },
  ];
  return (
    <section id="features" className="py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-ink-muted text-sm font-medium mb-3">Pourquoi nous choisir</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-ink-secondary text-lg max-w-xl mx-auto">Une solution simple, rapide et sécurisée conçue pour l'Afrique.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(f => (
            <div key={f.title} className="card p-6 hover:shadow-card-hover transition-shadow duration-300">
              <div className={`w-11 h-11 ${f.bg} rounded-2xl flex items-center justify-center mb-4`}>{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', icon: <Users size={20} />, title: 'Créez votre compte', desc: 'Inscription rapide avec votre email. Aucun document requis pour commencer.' },
    { n: '02', icon: <Smartphone size={20} />, title: 'Payez avec Mobile Money', desc: 'Choisissez votre opérateur (MTN, Moov, Orange...) et payez le montant de la carte.' },
    { n: '03', icon: <CreditCard size={20} />, title: 'Recevez votre carte', desc: 'Votre carte virtuelle Visa est créée automatiquement après confirmation du paiement.' },
    { n: '04', icon: <Globe size={20} />, title: 'Payez partout dans le monde', desc: 'Utilisez votre carte sur tous les sites e-commerce internationaux immédiatement.' },
  ];
  return (
    <section id="how" className="py-20 px-5 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Obtenez votre carte en 4 étapes</h2>
          <p className="text-ink-secondary text-lg">Simple, rapide, sans tracas.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(s => (
            <div key={s.n}>
              <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white mb-4 shadow-orange">{s.icon}</div>
              <div className="text-xs font-bold text-brand-orange tracking-widest mb-2">{s.n}</div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Where() {
  const p = ['Amazon', 'Netflix', 'Alibaba', 'Google Play', 'Apple Store', 'PayPal', 'Shopify', 'Adobe', 'Spotify', 'eBay', 'Canva', 'Notion'];
  return (
    <section className="py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Utilisable sur des milliers de sites</h2>
        <p className="text-ink-secondary mb-10">Partout où Visa est accepté, votre carte fonctionne.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {p.map(x => <div key={x} className="bg-white border border-surface-border rounded-2xl px-5 py-3 text-sm font-medium text-ink-secondary hover:border-brand-orange/30 hover:shadow-card transition-all duration-200 cursor-default">{x}</div>)}
          <div className="bg-brand-orange-light border border-brand-orange/20 rounded-2xl px-5 py-3 text-sm font-medium text-brand-orange">+ des milliers d'autres</div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-5 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tarifs simples et transparents</h2>
          <p className="text-ink-secondary text-lg">Aucun frais caché. Payez une fois, utilisez à vie.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="card p-8 border-2 border-brand-orange relative">
            <span className="badge-orange absolute top-5 right-5">Populaire</span>
            <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mb-5"><CreditCard size={22} className="text-white" /></div>
            <h3 className="font-bold text-xl mb-2">Création de carte</h3>
            <div className="text-4xl font-bold mb-1 text-brand-orange">5 000 <span className="text-xl font-medium text-ink-secondary">FCFA</span></div>
            <p className="text-ink-secondary text-sm mb-6">Paiement unique. Carte valable 3 ans.</p>
            <ul className="space-y-3 mb-7">
              {['Carte Visa virtuelle internationale', 'Activation instantanée', 'Protection 3D Secure', 'Support prioritaire'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary"><CheckCircle size={15} className="text-brand-green flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-primary w-full">Obtenir ma carte</Link>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 bg-brand-green-light rounded-2xl flex items-center justify-center mb-5"><TrendingUp size={22} className="text-brand-green" /></div>
            <h3 className="font-bold text-xl mb-2">Rechargement</h3>
            <div className="text-4xl font-bold mb-1 text-brand-green">0% <span className="text-xl font-medium text-ink-secondary">de frais</span></div>
            <p className="text-ink-secondary text-sm mb-6">Rechargez le montant que vous voulez.</p>
            <ul className="space-y-3 mb-7">
              {['Montant minimum : 1 000 FCFA', 'Conversion automatique en USD', 'Crédit instantané sur la carte', 'Via Mobile Money'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary"><CheckCircle size={15} className="text-brand-green flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-secondary w-full">Créer un compte</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    ['Combien de temps faut-il pour recevoir ma carte ?', 'Votre carte virtuelle est créée automatiquement dès confirmation de votre paiement Mobile Money. En général moins de 5 minutes.'],
    ['Quels opérateurs Mobile Money sont acceptés ?', 'Nous acceptons MTN Mobile Money, Moov Money, Orange Money et d\'autres selon votre pays.'],
    ['Puis-je utiliser la carte sur PayPal ou Amazon ?', 'Oui ! Votre carte Visa fonctionne sur tous les sites qui acceptent Visa : Amazon, PayPal, Netflix, Google Play, Apple Store, et des milliers d\'autres.'],
    ['Comment recharger ma carte ?', 'Depuis votre espace, cliquez sur "Recharger", entrez le montant en FCFA, choisissez votre opérateur Mobile Money et confirmez.'],
    ['Que faire pour sécuriser ma carte temporairement ?', 'Vous pouvez geler votre carte en un clic depuis votre espace. Cela bloque toutes les transactions jusqu\'à ce que vous la dégeliez.'],
    ['Mes données personnelles sont-elles en sécurité ?', 'Absolument. Vos données sont chiffrées et stockées de manière sécurisée. Consultez notre politique de confidentialité pour plus de détails.'],
  ];
  return (
    <section id="faq" className="py-20 px-5 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14"><h2 className="text-3xl font-bold">Questions fréquentes</h2></div>
        <div className="space-y-3">
          {faqs.map(([q, a], i) => (
            <div key={i} className="card overflow-hidden">
              <button className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-muted transition-colors" onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-medium pr-4">{q}</span>
                <ChevronDown size={17} className={`text-ink-muted flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <div className="px-5 pb-5 text-ink-secondary text-sm leading-relaxed border-t border-surface-border pt-4 animate-fade-in">{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 px-5 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center text-white" style={{ background: 'linear-gradient(135deg,#FF7A00 0%,#E06A00 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Prêt à payer partout dans le monde ?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">Rejoignez des milliers d'Africains qui paient en ligne sans frontières.</p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-brand-orange font-bold px-8 py-4 rounded-2xl hover:bg-white/90 transition-all duration-200 shadow-xl hover:-translate-y-0.5">
              Obtenir ma carte maintenant <ArrowRight size={20} />
            </Link>
            <p className="text-white/60 text-sm mt-4">Activation en moins de 5 minutes · Paiement Mobile Money</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
<footer className="bg-white border-t border-surface-border py-12 px-5 sm:px-6">
  <div className="max-w-6xl mx-auto">
    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
      <div className="max-w-xs">
        <Logo />
        <p className="text-ink-secondary text-sm leading-relaxed mt-3">La carte virtuelle internationale conçue pour l'Afrique. Payez partout, simplement.</p>
      </div>
      <div className="grid grid-cols-2 gap-8 text-sm">
        <div>
          <h4 className="font-semibold mb-3">Produit</h4>
          <ul className="space-y-2 text-ink-secondary">
            <li><a href="#features" className="hover:text-ink-primary transition-colors">Fonctionnalités</a></li>
            <li><a href="#pricing" className="hover:text-ink-primary transition-colors">Tarifs</a></li>
            <li><a href="#how" className="hover:text-ink-primary transition-colors">Comment ça marche</a></li>
            <li className="pt-3 mt-1 border-t border-surface-border">
              <span className="font-semibold text-ink-primary">Compte</span>
            </li>
            <li><Link href="/auth/register" className="hover:text-ink-primary transition-colors">S'inscrire</Link></li>
            <li><Link href="/auth/login" className="hover:text-ink-primary transition-colors">Se connecter</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Légal</h4>
          <ul className="space-y-2 text-ink-secondary">
            <li><Link href="/legal/privacy" className="hover:text-ink-primary transition-colors">Confidentialité</Link></li>
            <li><Link href="/legal/terms" className="hover:text-ink-primary transition-colors">Conditions d'utilisation</Link></li>
            <li><a href="#faq" className="hover:text-ink-primary transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-ink-muted">
      <div>© 2025 LFD WEB CARD. Tous droits réservés.</div>
      <div className="flex items-center gap-1.5"><Shield size={13} className="text-brand-green" />Paiements sécurisés par LFD Gateway</div>
    </div>
  </div>
</footer>
  );
}

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Where />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
