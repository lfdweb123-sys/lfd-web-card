'use client';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Logo réservé exclusivement aux sidebars (dashboard, admin, profil).
 * Toujours affiché en pleine largeur de la sidebar (le conteneur parent ne doit
 * pas ajouter de padding horizontal sur cet élément).
 */
export function SidebarLogo({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} className="block w-full">
      <Image
        src="/logo-sidebar.png"
        alt="LFD WEB CARD"
        width={600}
        height={400}
        priority
        className="w-full h-auto"
      />
    </Link>
  );
}
