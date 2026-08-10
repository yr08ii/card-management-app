/**
 * S12 — Transaction detail (design spec §3.1, PRD F7/AC4).
 *
 * The service layer has no `getTransaction(id)` endpoint (design spec
 * §3.2's `Api` mirrors the PRD traceability table exactly, and the PRD
 * only lists `GET /app/transactions`). The list screen therefore only
 * passes an id via the route param; this screen looks the transaction up
 * by paging through `api.getTransactions()` (no date filter, so every
 * transaction is reachable regardless of what range the list had active)
 * until it finds a match or runs out of pages. The fixture set is ~60
 * transactions / 20 per page, so this is at most 3 round trips.
 */

import { useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDateTime, formatMoney, formatTransactionAmount } from '@/lib/format';
import { api, ApiError, type Transaction } from '@/services';

// Safety bound so a corrupted/looping cursor chain can't page forever.
const MAX_LOOKUP_PAGES = 20;

async function findTransaction(id: string | undefined): Promise<Transaction> {
  if (!id) {
    throw new ApiError('NOT_FOUND', 'Transaction not found.');
  }

  let cursor: string | undefined;
  for (let i = 0; i < MAX_LOOKUP_PAGES; i++) {
    const page = await api.getTransactions({ cursor });
    const found = page.items.find((t) => t.id === id);
    if (found) return found;
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  throw new ApiError('NOT_FOUND', 'This transaction could not be found.');
}

const STATUS_BADGE: Record<Transaction['status'], { label: string; variant: BadgeVariant }> = {
  SETTLED: { label: 'Settled', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  DECLINED: { label: 'Declined', variant: 'danger' },
};

export default function TransactionDetailScreen() {
  const { txnId } = useLocalSearchParams<{ txnId: string }>();

  const {
    data: transaction,
    error,
    loading,
    refetch,
  } = useAsyncResource(() => findTransaction(txnId), [txnId]);

  if (loading) {
    return (
      <Screen>
        <DetailSkeleton />
      </Screen>
    );
  }

  if (error) {
    if (error.code === 'NOT_FOUND') {
      return (
        <Screen>
          <EmptyState
            title="Transaction not found"
            description="This transaction may have been removed or is no longer available."
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <ErrorState error={error} onRetry={refetch} />
      </Screen>
    );
  }

  if (!transaction) {
    return (
      <Screen>
        <EmptyState title="Transaction not found" />
      </Screen>
    );
  }

  return (
    <Screen>
      <TransactionDetailContent transaction={transaction} />
    </Screen>
  );
}

function TransactionDetailContent({ transaction }: { transaction: Transaction }) {
  const isDeclined = transaction.status === 'DECLINED';
  const amountColor: ThemeColor = isDeclined ? 'inkMuted' : transaction.direction === 'CREDIT' ? 'success' : 'ink';
  const statusBadge = STATUS_BADGE[transaction.status];

  const rows = buildDetailRows(transaction);

  return (
    <View>
      <View style={styles.summary}>
        <Text variant="subhead" color="inkMuted">
          {transaction.merchant}
        </Text>
        <Text variant="display" color={amountColor} tabular style={isDeclined ? styles.declinedAmount : undefined}>
          {formatTransactionAmount(transaction)}
        </Text>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </View>

      <Surface bordered style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 ? <Divider /> : null}
            <DetailRow label={row.label} value={row.value} />
          </Fragment>
        ))}
      </Surface>
    </View>
  );
}

type DetailRowData = { label: string; value: string };

/** Only includes rows whose value is actually present — never renders "null" or an empty row. */
function buildDetailRows(transaction: Transaction): DetailRowData[] {
  const rows: DetailRowData[] = [
    { label: 'Merchant', value: transaction.merchant },
    { label: 'Description', value: transaction.description },
    { label: 'Amount', value: formatMoney(transaction.amount, transaction.currency) },
    { label: 'Type', value: transaction.direction === 'CREDIT' ? 'Credit' : 'Debit' },
    { label: 'Status', value: STATUS_BADGE[transaction.status].label },
    { label: 'Date created', value: formatDateTime(transaction.createdAt) },
  ];

  if (transaction.authorizedAt) {
    rows.push({ label: 'Authorized', value: formatDateTime(transaction.authorizedAt) });
  }

  if (transaction.authorization) {
    rows.push({ label: 'Authorization code', value: transaction.authorization.authorizationCode });
    if (transaction.authorization.terminalId) {
      rows.push({ label: 'Terminal', value: transaction.authorization.terminalId });
    }
    if (transaction.authorization.mcc) {
      rows.push({ label: 'Merchant category code', value: transaction.authorization.mcc });
    }
  }

  return rows;
}

function DetailRow({ label, value }: DetailRowData) {
  return (
    <View style={styles.row}>
      <Text variant="subhead" color="inkMuted">
        {label}
      </Text>
      <Text variant="body" color="ink" tabular style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const SKELETON_ROWS = Array.from({ length: 6 });

function DetailSkeleton() {
  return (
    <View>
      <View style={styles.summary}>
        <Skeleton width={120} height={14} />
        <Skeleton width={180} height={36} style={styles.skeletonAmount} />
        <Skeleton width={72} height={20} radius="pill" />
      </View>
      <Surface bordered style={styles.card}>
        {SKELETON_ROWS.map((_, index) => (
          <Fragment key={index}>
            {index > 0 ? <Divider /> : null}
            <View style={styles.row}>
              <Skeleton width={100} height={14} />
              <Skeleton width={90} height={14} />
            </View>
          </Fragment>
        ))}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  skeletonAmount: {
    marginVertical: Spacing.xs,
  },
  declinedAmount: {
    textDecorationLine: 'line-through',
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: 24,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
