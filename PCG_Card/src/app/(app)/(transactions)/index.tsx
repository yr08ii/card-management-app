/**
 * S11 — Transactions list (design spec §3.1, PRD F7/AC1–AC3).
 *
 * Pagination model:
 * - The date-range filter (`range`) drives an "initial load" for page 1.
 *   Changing it bumps `requestIdRef`, which invalidates any in-flight
 *   request for the previous filter — a slow page-1 response for "90D"
 *   can never land after the user has already switched to "7D". `items`/
 *   `nextCursor` are reset synchronously in the same effect that kicks off
 *   the new fetch, so the list never shows a stale filter's rows under a
 *   new filter's header.
 * - "Load more" (`onEndReached`) fetches by `nextCursor` and appends. It
 *   is guarded against double-fetch by three conditions: no fetch already
 *   in flight (`loadingMore`), not still loading page 1 (`initialLoading`),
 *   and a `nextCursor` actually exists.
 * - A page-N failure (`loadMoreError`) is rendered as an inline footer
 *   with retry — `items` (pages 1..N-1) are left untouched, so scrolling
 *   back up still shows everything already loaded.
 * - Pull-to-refresh re-fetches page 1 for the current filter and replaces
 *   `items` wholesale on success. On failure it leaves the existing list
 *   alone and reports the failure via a toast instead of an error screen,
 *   for the same reason as the page-N case: a transient refresh failure
 *   must not blow away data the user can already see.
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { DateRangeFilter, DEFAULT_DATE_RANGE, dateRangeToQuery, type DateRangeValue } from '@/components/transactions/date-range-filter';
import { TransactionGroupHeader } from '@/components/transactions/transaction-group-header';
import { TransactionRow } from '@/components/transactions/transaction-row';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState, errorMessageOf } from '@/components/states/error-state';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeDay } from '@/lib/format';
import { api, ApiError, type Transaction } from '@/services';

type ListItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'row'; key: string; transaction: Transaction };

const SKELETON_ROWS = 8;

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError('SERVER_ERROR', 'Something went wrong. Please try again.', err);
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [range, setRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const query = useMemo(() => dateRangeToQuery(range), [range]);

  const [items, setItems] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<ApiError | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Bumped on every fetch kickoff; a resolved/rejected promise whose id no
  // longer matches the latest is discarded. This is what makes switching
  // the date filter mid-pagination (or mid page-1-load) safe.
  const requestIdRef = useRef(0);

  const loadInitial = useCallback((from?: string, to?: string) => {
    const requestId = ++requestIdRef.current;
    setInitialLoading(true);
    setInitialError(null);

    api
      .getTransactions({ from, to })
      .then((page) => {
        if (requestIdRef.current !== requestId) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setInitialLoading(false);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setInitialError(toApiError(err));
        setInitialLoading(false);
      });
  }, []);

  useEffect(() => {
    // A filter change invalidates any in-flight page (initial, more, or
    // refresh) for the old filter and starts a clean page 1 for the new one.
    setItems([]);
    setNextCursor(null);
    setLoadingMore(false);
    setLoadMoreError(null);
    setRefreshing(false);
    loadInitial(query.from, query.to);
    // `loadInitial` is stable (empty deps); `query` is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.from, query.to]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || initialLoading || refreshing || !nextCursor) return;

    const requestId = ++requestIdRef.current;
    setLoadingMore(true);
    setLoadMoreError(null);

    api
      .getTransactions({ cursor: nextCursor, from: query.from, to: query.to })
      .then((page) => {
        if (requestIdRef.current !== requestId) return;
        setItems((prev) => [...prev, ...page.items]);
        setNextCursor(page.nextCursor);
        setLoadingMore(false);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setLoadMoreError(toApiError(err));
        setLoadingMore(false);
      });
  }, [loadingMore, initialLoading, refreshing, nextCursor, query.from, query.to]);

  const handleRefresh = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setRefreshing(true);

    api
      .getTransactions({ from: query.from, to: query.to })
      .then((page) => {
        if (requestIdRef.current !== requestId) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setLoadMoreError(null);
        setRefreshing(false);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setRefreshing(false);
        toast.show(errorMessageOf(err, 'Could not refresh. Pull down to try again.'), 'danger');
      });
  }, [query.from, query.to, toast]);

  const handleRowPress = useCallback(
    (id: string) => {
      router.push(`/(app)/(transactions)/${id}`);
    },
    [router],
  );

  const listData = useMemo<ListItem[]>(() => {
    const out: ListItem[] = [];
    let lastLabel: string | null = null;

    for (const transaction of items) {
      const label = formatRelativeDay(transaction.createdAt);
      if (label !== lastLabel) {
        out.push({ kind: 'header', key: `h_${transaction.id}`, label });
        lastLabel = label;
      }
      out.push({ kind: 'row', key: transaction.id, transaction });
    }

    return out;
  }, [items]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === 'header') {
        return <TransactionGroupHeader label={item.label} />;
      }
      return <TransactionRow transaction={item.transaction} onPress={handleRowPress} />;
    },
    [handleRowPress],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={theme.brand} />
        </View>
      );
    }
    if (loadMoreError) {
      return (
        <View style={styles.footer}>
          <Text variant="footnote" color="danger" style={styles.footerError}>
            {errorMessageOf(loadMoreError)}
          </Text>
          <Button variant="secondary" size="sm" onPress={handleLoadMore}>
            Retry
          </Button>
        </View>
      );
    }
    return null;
  }, [loadingMore, loadMoreError, handleLoadMore, theme.brand]);

  return (
    <Screen scroll={false} padded={false} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="title1">Transactions</Text>
        <View style={styles.filterWrap}>
          <DateRangeFilter value={range} onChange={setRange} />
        </View>
      </View>

      {initialLoading ? (
        <View style={styles.skeletonWrap}>
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <View key={index} style={styles.skeletonRow}>
              <View style={styles.skeletonLeading}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="30%" height={12} />
              </View>
              <Skeleton width={64} height={16} />
            </View>
          ))}
        </View>
      ) : initialError ? (
        <ErrorState error={initialError} onRetry={() => loadInitial(query.from, query.to)} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Transactions on your card will show up here."
        />
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.brand} />
          }
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  filterWrap: {
    // SegmentedControl is naturally 44pt tall; no extra sizing needed.
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerError: {
    textAlign: 'center',
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  skeletonLeading: {
    flex: 1,
    gap: Spacing.sm,
  },
});
