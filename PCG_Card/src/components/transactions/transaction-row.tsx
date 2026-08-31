/**
 * S11 — a single transaction row (design spec §3.4, PRD F7/AC1).
 *
 * Memoized so re-renders of the list (pagination, pull-to-refresh) don't
 * re-render every already-rendered row — only rows whose `transaction`
 * object identity actually changed. The parent is responsible for passing
 * a stable `onPress` callback (see `useCallback` in the list screen) so
 * this component's own props stay referentially stable across list
 * re-renders.
 */

import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatMoney, formatTime, formatTransactionAmount } from '@/lib/format';
import type { Transaction } from '@/services';

export type TransactionRowProps = {
  transaction: Transaction;
  /** Receives the transaction id — kept stable by the caller via `useCallback`. */
  onPress: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

function TransactionRowComponent({ transaction, onPress, style }: TransactionRowProps) {
  const theme = useTheme();

  const isDeclined = transaction.status === 'DECLINED';
  const isPending = transaction.status === 'PENDING';
  const amountColor: ThemeColor = isDeclined ? 'inkMuted' : transaction.direction === 'CREDIT' ? 'success' : 'ink';

  const accessibilityLabel = buildAccessibilityLabel(transaction);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => onPress(transaction.id)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.bgSubtle }, style]}>
      <View style={styles.leading}>
        <Text variant="body" color="ink" numberOfLines={1}>
          {transaction.merchant}
        </Text>
        <View style={styles.subRow}>
          <Text variant="footnote" color="inkMuted">
            {formatTime(transaction.createdAt)}
          </Text>
          {isPending ? <Badge variant="warning">Pending</Badge> : null}
          {isDeclined ? <Badge variant="danger">Declined</Badge> : null}
        </View>
      </View>
      <Text
        variant="bodyStrong"
        color={amountColor}
        tabular
        style={isDeclined ? styles.declinedAmount : undefined}>
        {formatTransactionAmount(transaction)}
      </Text>
    </Pressable>
  );
}

/**
 * One coherent label instead of four separate unlabeled `Text` nodes — a
 * screen reader user hears "Trader Joe's, $12.34 debit, Jul 29 at 3:45 PM,
 * pending" once per swipe, not four fragments (accessibility requirement).
 * Uses the unsigned amount + a spoken direction word rather than
 * `formatTransactionAmount`'s `+`/`−` glyphs, which read poorly aloud.
 */
function buildAccessibilityLabel(transaction: Transaction): string {
  const directionWord = transaction.direction === 'CREDIT' ? 'credit' : 'debit';
  const amount = formatMoney(transaction.amount, transaction.currency);
  const when = formatDateTime(transaction.createdAt);
  const statusSuffix =
    transaction.status === 'PENDING' ? ', pending' : transaction.status === 'DECLINED' ? ', declined' : '';

  return `${transaction.merchant}, ${amount} ${directionWord}, ${when}${statusSuffix}`;
}

export const TransactionRow = memo(TransactionRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  leading: {
    flex: 1,
    gap: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  declinedAmount: {
    textDecorationLine: 'line-through',
  },
});
