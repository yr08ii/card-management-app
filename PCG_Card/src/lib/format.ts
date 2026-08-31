/**
 * Display formatting. Shared so every screen renders money, dates, and card
 * numbers identically (PRD §10 — localization-ready, currency/date per locale).
 *
 * Money is stored in minor units everywhere in the service layer. Converting
 * to a display string is the ONLY place division by 100 should happen — do
 * not do arithmetic on the result.
 */

import type { CurrencyCode, Transaction } from '@/services';

/**
 * Minor units → localized currency string.
 * `signed` prefixes an explicit + / − for transaction amounts.
 */
export function formatMoney(
  minorUnits: number,
  currency: CurrencyCode = 'USD',
  options: { signed?: boolean } = {},
): string {
  const { signed = false } = options;
  const value = Math.abs(minorUnits) / 100;

  const body = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  if (!signed) return body;
  // U+2212 minus, not a hyphen — it aligns with digits in tabular figures.
  return `${minorUnits < 0 ? '−' : '+'}${body}`;
}

/** Signed amount for a transaction row: credits read +, debits read −. */
export function formatTransactionAmount(txn: Transaction): string {
  const signedMinor = txn.direction === 'CREDIT' ? txn.amount : -txn.amount;
  return formatMoney(signedMinor, txn.currency, { signed: true });
}

/** `MM/YY`, the format printed on a card. */
export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;
}

/** Masked PAN for display anywhere other than the reveal screen. */
export function maskedPan(last4: string): string {
  return `•••• ${last4}`;
}

/**
 * Groups a full PAN into 4-digit blocks for the reveal screen.
 * Handles 15-digit (Amex-style 4-6-5) and 16-digit (4-4-4-4) lengths.
 */
export function groupPan(pan: string): string {
  const digits = pan.replace(/\D/g, '');
  if (digits.length === 15) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10)].join(' ');
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} at ${formatTime(iso)}`;
}

/** "Today" / "Yesterday" / a date — for transaction list group headers. */
export function formatRelativeDay(iso: string): string {
  const then = new Date(iso);
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(then)) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: 'long' });
  return formatDate(iso);
}

/** `YYYY-MM-DD`, the shape the service layer's date filter expects. */
export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
