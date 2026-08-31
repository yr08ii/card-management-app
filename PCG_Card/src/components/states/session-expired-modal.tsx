/**
 * Session-expired modal (PRD §9.7, S16).
 *
 * A 401 anywhere triggers one silent refresh; if that fails the user is
 * forced back to sign-in. `AuthProvider` owns that rule — this component
 * only tells the user why they landed there, so the message is never a
 * surprise logout.
 */

import { Modal, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Radius, Scrim, ScrimOpacity, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SessionExpiredModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function SessionExpiredModal({ visible, onDismiss }: SessionExpiredModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.root}>
        {/* Scrim is a sibling, not a parent — a parent with opacity would
            fade the dialog along with the backdrop. */}
        <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text variant="title3">Session expired</Text>
          <Text variant="body" color="inkMuted" style={styles.body}>
            You’ve been signed out for your security. Sign in again to get back to your card.
          </Text>
          <Button onPress={onDismiss} fullWidth style={styles.action}>
            Sign in
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  scrim: {
    backgroundColor: Scrim,
    opacity: ScrimOpacity,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  body: { marginTop: Spacing.sm },
  action: { marginTop: Spacing.lg },
});
