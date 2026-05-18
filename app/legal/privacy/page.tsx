import Link from 'next/link';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-bg">
      <header className="bg-white border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange rounded-xl flex items-center justify-center">
              <CreditCard size={15} className="text-white" />
            </div>
            <span className="font-semibold tracking-wide">LFD WEB CARD</span>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink-primary text-sm transition-colors">
            <ArrowLeft size={14} /> Retour
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-ink-muted text-sm mb-10">Dernière mise à jour : janvier 2025</p>

        <div className="space-y-8 text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">1. Introduction</h2>
            <p>LFD WEB CARD (ci-après « nous », « notre » ou « la Société ») s'engage à protéger la vie privée de ses utilisateurs. La présente politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations personnelles lorsque vous utilisez notre service de carte virtuelle internationale.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">2. Données collectées</h2>
            <p className="mb-3">Nous collectons les informations suivantes :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-ink-primary">Données d'identification</strong> : nom complet, adresse email, numéro de téléphone, pays de résidence.</li>
              <li><strong className="text-ink-primary">Données financières</strong> : historique des transactions, montants rechargés, statut des paiements.</li>
              <li><strong className="text-ink-primary">Données de connexion</strong> : adresse IP, navigateur, date et heure d'accès.</li>
              <li><strong className="text-ink-primary">Données de carte</strong> : les 4 derniers chiffres de votre carte virtuelle, date d'expiration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">3. Utilisation des données</h2>
            <p className="mb-3">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Traiter vos paiements et émettre votre carte virtuelle</li>
              <li>Vous envoyer des notifications relatives à vos transactions</li>
              <li>Assurer la sécurité de votre compte et prévenir la fraude</li>
              <li>Respecter nos obligations légales et réglementaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">4. Partage des données</h2>
            <p className="mb-3">Nous ne vendons jamais vos données personnelles. Nous partageons certaines informations uniquement avec :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-ink-primary">Pagocards</strong> : pour l'émission de votre carte virtuelle (nom, email)</li>
              <li><strong className="text-ink-primary">LFD Payment Gateway</strong> : pour le traitement des paiements Mobile Money</li>
              <li><strong className="text-ink-primary">Firebase (Google)</strong> : pour l'authentification et le stockage sécurisé des données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">5. Sécurité des données</h2>
            <p>Nous appliquons des mesures de sécurité strictes : chiffrement des données en transit (HTTPS/TLS), stockage sécurisé dans Firebase Firestore avec des règles d'accès strictes, authentification à deux facteurs disponible, et journalisation de toutes les actions sensibles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">6. Conservation des données</h2>
            <p>Vos données sont conservées pendant la durée de votre compte actif et pendant 5 ans après la fermeture du compte, conformément aux obligations légales en matière financière.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">7. Vos droits</h2>
            <p className="mb-3">Conformément aux lois applicables sur la protection des données, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-ink-primary">Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
              <li><strong className="text-ink-primary">Droit de rectification</strong> : corriger des données inexactes</li>
              <li><strong className="text-ink-primary">Droit à l'effacement</strong> : demander la suppression de vos données (sous réserve des obligations légales)</li>
              <li><strong className="text-ink-primary">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            </ul>
            <p className="mt-3">Pour exercer ces droits, contactez-nous à : <a href="mailto:support@lfdweb.com" className="text-brand-orange hover:underline">support@lfdweb.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">8. Cookies</h2>
            <p>Notre plateforme utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification, sécurité). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">9. Contact</h2>
            <p>Pour toute question relative à cette politique, contactez notre équipe à :<br />
              <a href="mailto:support@lfdweb.com" className="text-brand-orange hover:underline">support@lfdweb.com</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-surface-border py-6 px-5 text-center text-sm text-ink-muted">
        © 2025 LFD WEB CARD — <Link href="/legal/terms" className="hover:text-ink-primary transition-colors">Conditions d'utilisation</Link>
      </footer>
    </div>
  );
}
