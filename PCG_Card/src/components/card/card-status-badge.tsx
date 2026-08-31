/**
 * A compact status pill for use outside the card art itself — e.g. in the
 * S8 details header, list rows — where the full three-signal card-art
 * treatment (PRD F3/AC2) would be overkill. Card art (`CardArt`) remains
 * the "unmistakable" surface for the blocked state; this is just a label.
 *
 * Uses the `warning` token for Blocked, matching the design spec's token
 * provenance note that `warning` covers "frozen-card notice" (§2.2) — not
 * `danger`, since a frozen card is a deliberate state, not a failure.
 */

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { CardStatus } from '@/services';

export type CardStatusBadgeProps = {
  status: CardStatus;
};

const CONFIG: Record<CardStatus, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  BLOCKED: { label: 'Frozen', variant: 'warning' },
};

export function CardStatusBadge({ status }: CardStatusBadgeProps) {
  const { label, variant } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
