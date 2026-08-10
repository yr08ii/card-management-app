/**
 * S11 — date-range filter (design spec §3.4, PRD F7/AC2).
 *
 * The design spec (§3.5, §5) deliberately keeps this phase dependency-free
 * — no native date-picker package is installed, and this task may not
 * install one. A `SegmentedControl` of relative presets covers the AC
 * ("a date-range filter is available") without a calendar UI: each preset
 * maps to a concrete `{ from, to }` pair via `toIsoDate`, exactly like a
 * picker's output would.
 */

import { SegmentedControl } from '@/components/ui/segmented-control';
import { toIsoDate } from '@/lib/format';
import type { GetTransactionsQuery } from '@/services';

export type DateRangeValue = '7d' | '30d' | '90d' | 'all';

/** Matches PRD F7/AC2's suggested default ("last 30 days"). */
export const DEFAULT_DATE_RANGE: DateRangeValue = '30d';

const OPTIONS: { label: string; value: DateRangeValue }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'All', value: 'all' },
];

const RANGE_DAYS: Record<Exclude<DateRangeValue, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/** Maps a preset to the `{from, to}` query the service layer expects. */
export function dateRangeToQuery(range: DateRangeValue, now: Date = new Date()): GetTransactionsQuery {
  if (range === 'all') return {};

  const days = RANGE_DAYS[range];
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));

  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export type DateRangeFilterProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      accessibilityLabel="Filter transactions by date range"
    />
  );
}
