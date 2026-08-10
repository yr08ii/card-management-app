import { type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ScreenProps = PropsWithChildren<{
  /** Renders content inside a `ScrollView` instead of a plain `View`. Defaults to `true`. */
  scroll?: boolean;
  /** Adds `Spacing.lg` padding around the content. Defaults to `true`. */
  padded?: boolean;
  /** Which safe-area edges to inset. Defaults to all edges. */
  edges?: Edge[];
  /** Uses `bgSubtle` instead of `bg` for the background — for screens with card surfaces on top. */
  subtle?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

const DEFAULT_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

/**
 * Base screen container: safe-area insets, themed background, and an
 * optional scroll container. Every route composes from this.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = DEFAULT_EDGES,
  subtle = false,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const theme = useTheme();
  const backgroundColor = subtle ? theme.bgSubtle : theme.bg;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={edges}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[padded && styles.padded, contentContainerStyle]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={edges}>
      <View style={[styles.flex, padded && styles.padded, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  padded: {
    padding: Spacing.lg,
  },
});
