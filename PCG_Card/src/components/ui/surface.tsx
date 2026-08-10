import { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Elevation, Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SurfaceProps = PropsWithChildren<{
  /** Background token. Defaults to `surface`. */
  background?: ThemeColor;
  /** Radius token. Defaults to `lg`. Pass `null` for square corners. */
  radius?: keyof typeof Radius | null;
  /** Elevation level. Omit for a flat surface with no shadow. */
  elevation?: keyof typeof Elevation;
  /** Draws a hairline border in the `border` token color. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * A themed card-like container: background, radius, optional border and
 * elevation. The building block behind `ListRow`, `Badge` backgrounds, the
 * gallery cards, etc.
 */
export function Surface({
  children,
  background = 'surface',
  radius = 'lg',
  elevation,
  bordered = false,
  style,
}: SurfaceProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme[background],
          borderRadius: radius ? Radius[radius] : 0,
        },
        bordered && { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
        elevation && Elevation[elevation],
        style,
      ]}>
      {children}
    </View>
  );
}
