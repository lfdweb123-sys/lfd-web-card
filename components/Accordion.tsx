'use client';
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function Accordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-muted transition-colors"
      >
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-ink-secondary text-xs mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown
          size={18}
          className={`text-ink-muted flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-5 pb-5 border-t border-surface-border pt-4">{children}</div>}
    </div>
  );
}
