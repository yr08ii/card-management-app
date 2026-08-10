/**
 * Empty state (PRD §7 S16) — "No transactions yet", "No card found".
 *
 * Distinct from `ErrorState`: nothing failed, there is simply nothing to
 * show, so it is not announced as an alert and offers no retry by default.
 */

import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text variant="title3" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="inkMuted" style={styles.body}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="secondary" onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', marginTop: Spacing.sm },
  action: { marginTop: Spacing.lg },
});
