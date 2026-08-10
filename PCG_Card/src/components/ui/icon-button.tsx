import { useState } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconGlyph = SymbolViewProps['name'];

export type IconButtonProps = {
  icon: IconGlyph;
  onPress?: () => void;
  /** Required — an icon alone is not a description for assistive tech. */
  accessibilityLabel: string;
  size?: number;
  color?: ThemeColor;
  variant?: 'plain' | 'surface';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A tappable icon with a guaranteed 44×44pt hit target, built on
 * `expo-symbols` (SF Symbols on iOS, Material Symbols on Android/web).
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  color = 'ink',
  variant = 'plain',
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.hitArea,
        variant === 'surface' && { backgroundColor: theme.bgSubtle, borderRadius: Radius.pill },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <SymbolView name={icon} size={size} tintColor={theme[color]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
