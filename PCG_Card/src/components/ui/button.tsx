import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  /** Button label. */
  children: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows an `ActivityIndicator` in place of the label and disables the press. */
  loading?: boolean;
  disabled?: boolean;
  /** Falls back to `children` when omitted (only works if `children` is the visible label, which it always is here). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

/**
 * Primary interactive control. Every size keeps a minimum 44pt touch height
 * per the PRD's touch-target requirement, even `sm`.
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  const palette = getPalette(variant, theme, pressed);
  const sizing = size === 'sm' ? { minHeight: 44, paddingHorizontal: Spacing.md, variant: 'callout' as const }
    : size === 'lg' ? { minHeight: 56, paddingHorizontal: Spacing.xl, variant: 'bodyStrong' as const }
    : { minHeight: 48, paddingHorizontal: Spacing.lg, variant: 'bodyStrong' as const };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        {
          minHeight: sizing.minHeight,
          paddingHorizontal: sizing.paddingHorizontal,
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderWidth: palette.border ? StyleSheet.hairlineWidth : 0,
          opacity: isDisabled && !loading ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.contentRow}>
          <Text variant={sizing.variant} style={{ color: palette.text }}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function getPalette(
  variant: ButtonVariant,
  theme: Record<ThemeColor, string>,
  pressed: boolean,
): { background: string; border: string | undefined; text: string } {
  switch (variant) {
    case 'primary':
      return { background: pressed ? theme.brandPressed : theme.brand, border: undefined, text: theme.onBrand };
    case 'secondary':
      return { background: pressed ? theme.bgSubtle : theme.surface, border: theme.borderStrong, text: theme.ink };
    case 'ghost':
      return { background: pressed ? theme.bgSubtle : 'transparent', border: undefined, text: theme.brand };
    case 'destructive':
      return { background: pressed ? theme.danger : theme.danger, border: undefined, text: theme.onBrand };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
