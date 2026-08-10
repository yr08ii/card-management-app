import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  /** Adds `Spacing.md` margin on the axis perpendicular to the line. Defaults to `true`. */
  inset?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A hairline rule in the `border` token color. */
export function Divider({ orientation = 'horizontal', inset = true, style }: DividerProps) {
  const theme = useTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { backgroundColor: theme.border },
        isHorizontal
          ? { height: StyleSheet.hairlineWidth, width: '100%' }
          : { width: StyleSheet.hairlineWidth, height: '100%' },
        inset && isHorizontal && { marginVertical: Spacing.md },
        inset && !isHorizontal && { marginHorizontal: Spacing.md },
        style,
      ]}
    />
  );
}
