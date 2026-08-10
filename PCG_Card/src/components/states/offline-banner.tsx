/**
 * Offline / stale-data banner (PRD §7 S16, §10).
 *
 * The PRD's offline requirement is a read-only cached summary with a clear
 * "offline / last updated" indicator, and actions that disable gracefully.
 * This renders the indicator; disabling the actions is each screen's job.
 */

import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OfflineBannerProps = {
  /** When the shown data was last successfully fetched. */
  lastUpdated?: Date | null;
  message?: string;
};

function relativeTime(then: Date): string {
  const mins = Math.floor((Date.now() - then.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export function OfflineBanner({ lastUpdated, message = "You're offline" }: OfflineBannerProps) {
  const theme = useTheme();
  const suffix = lastUpdated ? ` · updated ${relativeTime(lastUpdated)}` : '';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${message}${suffix}`}
      style={[styles.root, { backgroundColor: theme.bgSubtle, borderColor: theme.border }]}>
      <View style={[styles.dot, { backgroundColor: theme.warning }]} />
      <Text variant="subhead" color="inkMuted">
        {message}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: Radius.pill },
});
