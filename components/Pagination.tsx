'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  page,
  hasMore,
  onChange,
  loading = false,
}: {
  page: number;
  hasMore: boolean;
  onChange: (page: number) => void;
  loading?: boolean;
}) {
  if (page === 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t border-surface-border">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1 || loading}
        className="flex items-center gap-1 text-sm font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} /> Précédent
      </button>
      <span className="text-xs text-ink-muted">Page {page}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={!hasMore || loading}
        className="flex items-center gap-1 text-sm font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Suivant <ChevronRight size={16} />
      </button>
    </div>
  );
}
