// lib/date.ts
// Certains documents Firestore plus anciens stockent createdAt/submittedAt en tant que
// Timestamp natif plutôt qu'en chaîne ISO. Une fois sérialisé en JSON (NextResponse.json),
// un Timestamp perd ses méthodes et n'expose plus que { _seconds, _nanoseconds } (ou
// { seconds, nanoseconds }) — `new Date(valeur)` produit alors "Invalid Date".
// Ces helpers gèrent tous les formats rencontrés : string ISO, number (ms), Date, ou objet Timestamp.

type TimestampLike = { toDate?: () => Date; _seconds?: number; seconds?: number; _nanoseconds?: number; nanoseconds?: number };

export function toSafeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'object') {
    const v = value as TimestampLike;
    if (typeof v.toDate === 'function') {
      const d = v.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    const seconds = v._seconds ?? v.seconds;
    if (typeof seconds === 'number') {
      const nanos = v._nanoseconds ?? v.nanoseconds ?? 0;
      return new Date(seconds * 1000 + Math.round(nanos / 1e6));
    }
  }

  return null;
}

export function formatDate(value: unknown, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const d = toSafeDate(value);
  return d ? d.toLocaleDateString('fr-FR', options) : '—';
}

export function formatDateTime(value: unknown, options?: Intl.DateTimeFormatOptions): string {
  const d = toSafeDate(value);
  return d ? d.toLocaleString('fr-FR', options) : '—';
}
