/**
 * Generic retryable error state (PRD §7 S16, §10).
 *
 * Error copy must be human, non-technical and actionable — never a raw
 * server error. `ApiError` already carries a display-ready `message`, so
 * that is preferred; anything else falls back to a generic line rather
 * than leaking an exception string into the UI.
 */

import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/services';

export type ErrorStateProps = {
  error?: unknown;
  /** Overrides the message derived from `error`. */
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

const GENERIC = 'Something went wrong. Please try again.';

/** Never surfaces a raw exception string to the user. */
export function errorMessageOf(error: unknown, fallback: string = GENERIC): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function ErrorState({
  error,
  message,
  title = 'We hit a snag',
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  const body = message ?? errorMessageOf(error);

  return (
    <View style={styles.root} accessibilityRole="alert">
      <Text variant="title3" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="inkMuted" style={styles.body}>
        {body}
      </Text>
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry} style={styles.action}>
          {retryLabel}
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
