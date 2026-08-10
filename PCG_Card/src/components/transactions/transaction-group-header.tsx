/**
 * S11 — sticky-feeling date-group header ("Today", "Yesterday", weekday,
 * or a full date) rendered above each run of same-day transactions
 * (design spec §3.4, PRD F7/AC1).
 */

import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TransactionGroupHeaderProps = {
  label: string;
};

export function TransactionGroupHeader({ label }: TransactionGroupHeaderProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="header"
      style={[styles.wrap, { backgroundColor: theme.bgSubtle, borderColor: theme.border }]}>
      <Text variant="overline" color="inkMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
