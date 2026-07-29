import Link from 'next/link';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen stripes-light">
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
        <h1 className="text-3xl font-bold mb-2">Conditions d'utilisation</h1>
        <p className="text-ink-muted text-sm mb-10">Dernière mise à jour : janvier 2025</p>

        <div className="space-y-8 text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">1. Acceptation des conditions</h2>
            <p>En créant un compte et en utilisant les services de LFD WEB CARD, vous acceptez pleinement et sans réserve les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">2. Description du service</h2>
            <p className="mb-3">LFD WEB CARD est une plateforme de cartes virtuelles permettant :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>L'acquisition d'une carte virtuelle Visa ou Mastercard internationale</li>
              <li>Le rechargement de la carte via Mobile Money</li>
              <li>L'utilisation de la carte pour des paiements en ligne dans le monde entier</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">3. Éligibilité</h2>
            <p>Pour utiliser nos services, vous devez :</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Être âgé d'au moins 18 ans</li>
              <li>Fournir des informations exactes et complètes lors de l'inscription</li>
              <li>Disposer d'un compte Mobile Money valide</li>
              <li>Résider dans un pays où notre service est disponible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">4. Tarification</h2>
            <p className="mb-3">Les tarifs applicables sont les suivants :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-ink-primary">Création de carte</strong> : 5 000 FCFA (paiement unique, non remboursable)</li>
              <li><strong className="text-ink-primary">Rechargement</strong> : montant minimum de 3 000 FCFA, maximum de 500 000 FCFA</li>
              <li><strong className="text-ink-primary">Frais de rechargement</strong> : inclus dans le service (voir dashboard Pagocards pour les frais applicables)</li>
            </ul>
            <p className="mt-3">La conversion FCFA vers USD est effectuée au taux du marché en vigueur au moment de la transaction.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">5. Paiements et remboursements</h2>
            <p className="mb-3">Les paiements sont traités via la passerelle sécurisée LFD Gateway. En cas d'échec technique de notre part lors de la création de carte après paiement confirmé, nous procéderons au remboursement dans un délai de 5 à 10 jours ouvrables.</p>
            <p className="font-medium text-ink-primary">Les frais de création de carte (5 000 FCFA) ne sont pas remboursables une fois la carte créée avec succès.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">6. Utilisation acceptable</h2>
            <p className="mb-3">Il est strictement interdit d'utiliser votre carte LFD WEB CARD pour :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Des activités illégales ou frauduleuses</li>
              <li>Le blanchiment d'argent ou le financement du terrorisme</li>
              <li>Des transactions sur des sites sanctionnés</li>
              <li>Tout contournement des lois et réglementations applicables</li>
            </ul>
            <p className="mt-3">Tout manquement entraînera la résiliation immédiate du compte et le signalement aux autorités compétentes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">7. Sécurité du compte</h2>
            <p>Vous êtes responsable de la confidentialité de vos identifiants de connexion. Signalez immédiatement toute utilisation non autorisée de votre compte à <a href="mailto:support@lfdweb.com" className="text-brand-orange hover:underline">support@lfdweb.com</a>. LFD WEB CARD ne sera pas responsable des pertes résultant d'un accès non autorisé dû à une négligence de votre part.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">8. Limitation de responsabilité</h2>
            <p>LFD WEB CARD ne peut être tenu responsable des pertes indirectes, accessoires ou consécutives découlant de l'utilisation ou de l'impossibilité d'utiliser notre service, des interruptions de service dues à des tiers (Pagocards, opérateurs Mobile Money), ou des fluctuations des taux de change.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">9. Suspension et résiliation</h2>
            <p>Nous nous réservons le droit de suspendre ou résilier tout compte en cas de violation des présentes conditions, d'activité frauduleuse suspectée, ou de demande des autorités compétentes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">10. Modifications</h2>
            <p>LFD WEB CARD se réserve le droit de modifier ces conditions à tout moment. Les modifications seront notifiées par email et prendront effet 15 jours après notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-primary mb-3">11. Contact</h2>
            <p>Pour toute question concernant ces conditions :<br />
              <a href="mailto:support@lfdweb.com" className="text-brand-orange hover:underline">support@lfdweb.com</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-surface-border py-6 px-5 text-center text-sm text-ink-muted">
        © 2025 LFD WEB CARD — <Link href="/legal/privacy" className="hover:text-ink-primary transition-colors">Politique de confidentialité</Link>
      </footer>
    </div>
  );
}
