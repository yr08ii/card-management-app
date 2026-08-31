/**
 * The card-art tile — the hero object on S7 (Home) and reused wherever a
 * compact card visual is needed (PRD F3/AC1, design spec §2.4).
 *
 * Theme-independence (design spec §2.4): this renders identically in light
 * and dark mode, the way a physical card does. Every color in here comes
 * from `CardArtColors`, or is a fixed white/rgba overlay needed for text
 * legibility against that gradient — never from `useTheme()`.
 *
 * Blocked state (PRD F3/AC2): must be unmistakable, so three independent
 * signals are always present together, never just one:
 *   1. the desaturated `CardArtColors.blocked` gradient (hue change),
 *   2. a frost (`BlurView`) overlay,
 *   3. a "Frozen" label.
 *
 * Accessibility (PRD §10): the combined accessibility label only ever
 * includes the masked last 4 digits — never a full PAN, which does not
 * exist in this component's props (`Card` has no `pan` field, see
 * `src/services/types.ts`).
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';

import { Text } from '@/components/ui/text';
import { CardArtColors, Radius, Spacing } from '@/constants/theme';
import { formatExpiry, maskedPan } from '@/lib/format';
import type { Card } from '@/services';

export type CardArtCard = Pick<
  Card,
  'last4' | 'cardholderName' | 'expiryMonth' | 'expiryYear' | 'brand' | 'status'
>;

export type CardArtProps = {
  card: CardArtCard;
  /** When provided, the whole tile becomes a single 44pt+ tappable target (PRD F4/AC1 — tapping the card opens details). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const WHITE = '#FFFFFF';
const WHITE_MUTED = 'rgba(255,255,255,0.72)';

const BRAND_LABEL: Record<CardArtCard['brand'], string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
};

export function CardArt({ card, onPress, style }: CardArtProps) {
  const blocked = card.status === 'BLOCKED';
  const palette = blocked ? CardArtColors.blocked : CardArtColors.active;
  const expiry = formatExpiry(card.expiryMonth, card.expiryYear);

  const accessibilityLabel = `${BRAND_LABEL[card.brand]} card ending in ${card.last4}, ${card.cardholderName}, expires ${expiry}, ${
    blocked ? 'Frozen' : 'Active'
  }`;

  const body = (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { borderColor: palette.innerBorder }]}>
      <View pointerEvents="none" style={[styles.sheen, blocked && styles.sheenReduced]} />

      <Text variant="overline" style={styles.brand}>
        {BRAND_LABEL[card.brand]}
      </Text>

      <Text variant="title2" tabular style={styles.pan}>
        {maskedPan(card.last4)}
      </Text>

      <View style={styles.bottomRow}>
        <View>
          <Text variant="caption" style={styles.metaLabel}>
            CARDHOLDER
          </Text>
          <Text variant="callout" style={styles.metaValue}>
            {card.cardholderName}
          </Text>
        </View>
        <View style={styles.expiryBlock}>
          <Text variant="caption" style={styles.metaLabel}>
            EXPIRES
          </Text>
          <Text variant="callout" tabular style={styles.metaValue}>
            {expiry}
          </Text>
        </View>
      </View>

      {blocked ? (
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.frozenWrap}>
            <View style={styles.frozenPill}>
              <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} size={12} tintColor={WHITE} />
              <Text variant="caption" style={styles.frozenText}>
                Frozen
              </Text>
            </View>
          </View>
        </BlurView>
      ) : null}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens card details"
        onPress={onPress}
        style={[styles.root, style]}>
        {body}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={[styles.root, style]}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: Radius.card,
  },
  gradient: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 190,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: -70,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  sheenReduced: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  brand: {
    color: WHITE_MUTED,
  },
  pan: {
    color: WHITE,
    marginTop: Spacing.lg,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  expiryBlock: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: WHITE_MUTED,
    letterSpacing: 0.6,
  },
  metaValue: {
    color: WHITE,
    marginTop: 2,
  },
  frozenWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-end',
    padding: Spacing.lg,
  },
  frozenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  frozenText: {
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
