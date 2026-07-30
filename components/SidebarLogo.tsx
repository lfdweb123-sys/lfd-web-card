'use client';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Logo réservé exclusivement aux sidebars (dashboard, admin, profil).
 * Taille réduite avec un peu de marge — ne doit pas remplir toute la largeur.
 */
export function SidebarLogo({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} className="block px-6">
      <Image
        src="/logo-sidebar.png"
        alt="LFD WEB CARD"
        width={600}
        height={400}
        priority
        className="w-full h-auto max-w-[140px]"
      />
    </Link>
  );
}
