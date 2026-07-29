'use client';
import Image from 'next/image';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      {/* Desktop: logo horizontal */}
      <Image
        src="/logo-horizontal-web.png"
        alt="LFD WEB CARD"
        width={200}
        height={67}
        priority
        className="hidden md:block h-8 w-auto"
      />
      {/* Mobile: icon + text */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center flex-shrink-0">
          <CreditCard size={16} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide">LFD WEB CARD</span>
      </div>
    </Link>
  );
}
