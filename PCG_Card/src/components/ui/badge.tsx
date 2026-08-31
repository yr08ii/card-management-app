import { StyleSheet, View } from 'react-native';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme';

import { Text } from './text';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';

export type BadgeProps = {
  children: string;
  variant?: BadgeVariant;
};

const VARIANT_TOKENS: Record<BadgeVariant, { fg: ThemeColor; bgLight: string; bgDark: string }> = {
  neutral: { fg: 'inkMuted', bgLight: 'rgba(107,124,147,0.12)', bgDark: 'rgba(148,169,190,0.16)' },
  brand: { fg: 'brand', bgLight: 'rgba(0,61,93,0.10)', bgDark: 'rgba(74,159,212,0.18)' },
  success: { fg: 'success', bgLight: 'rgba(14,124,102,0.12)', bgDark: 'rgba(61,190,154,0.18)' },
  danger: { fg: 'danger', bgLight: 'rgba(192,54,44,0.12)', bgDark: 'rgba(255,107,94,0.18)' },
  warning: { fg: 'warning', bgLight: 'rgba(154,97,0,0.12)', bgDark: 'rgba(229,163,61,0.18)' },
};

/** A small status pill — e.g. card status, transaction state. */
export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const mode = useThemeMode();
  const tokens = VARIANT_TOKENS[variant];
  const isDark = mode === 'dark';

  return (
    <View
      accessibilityRole="text"
      style={[styles.base, { backgroundColor: isDark ? tokens.bgDark : tokens.bgLight }]}>
      <Text variant="caption" color={tokens.fg} style={styles.label}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radius.pill,
  },
  label: {
    textTransform: 'none',
  },
});
