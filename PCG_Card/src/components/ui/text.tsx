import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Typography, type ThemeColor, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextProps = RNTextProps & {
  /** Typography scale token. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Color token. Defaults to `ink`. */
  color?: ThemeColor;
  /**
   * Locks digit width via `fontVariant: ['tabular-nums']`. Use for money
   * amounts, card numbers, and countdowns so digits don't shift width while
   * a countdown runs or a list scrolls.
   */
  tabular?: boolean;
};

/**
 * Themed text primitive. Always read colors through this component (or
 * `useTheme()` directly) instead of hardcoding a hex value.
 */
export function Text({ variant = 'body', color = 'ink', tabular = false, style, ...rest }: TextProps) {
  const theme = useTheme();
  const token = Typography[variant];

  return (
    <RNText
      style={[
        {
          color: theme[color],
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight,
          letterSpacing: 'letterSpacing' in token ? token.letterSpacing : undefined,
          textTransform: 'textTransform' in token ? token.textTransform : undefined,
        },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
