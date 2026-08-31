import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';
import type { IconGlyph } from './icon-button';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Leading icon glyph, rendered inside a subtle rounded square. */
  icon?: IconGlyph;
  /** Custom leading content — takes precedence over `icon`. */
  leading?: ReactNode;
  /** Custom trailing content. Defaults to a chevron when `onPress` is set. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Explicit label for screen readers; defaults to `title` (+ `subtitle`). */
  accessibilityLabel?: string;
};

/** A single row in a settings/menu-style list: icon, title, subtitle, trailing accessory. */
export function ListRow({ title, subtitle, icon, leading, trailing, onPress, accessibilityLabel }: ListRowProps) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const interactive = !!onPress;

  const content = (
    <View style={[styles.row, pressed && { backgroundColor: theme.bgSubtle }]}>
      {leading ?? (icon && (
        <View style={[styles.iconWrap, { backgroundColor: theme.bgSubtle }]}>
          <SymbolView name={icon} size={18} tintColor={theme.brand} />
        </View>
      ))}
      <View style={styles.textWrap}>
        <Text variant="body" color="ink">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="inkMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (interactive ? <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={16} tintColor={theme.inkSubtle} /> : null)}
    </View>
  );

  if (!interactive) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
