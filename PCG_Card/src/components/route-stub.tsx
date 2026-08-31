/**
 * Placeholder body for every route in the Phase 3 navigation skeleton
 * (design spec §3.1, §4 phase 3). Renders the screen's id, any route
 * params, and optional provider/context debug state — composed entirely
 * from the frozen `ui/` primitives (`Screen`, `Text`, `Button`). Later
 * phases replace each call site with the real screen; this component
 * itself should not gain feature logic beyond generic scaffolding.
 */

import { useRouter, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen, type ScreenProps } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

export type RouteStubLink = {
  label: string;
  href: Href;
};

export type RouteStubProps = Pick<ScreenProps, 'scroll' | 'subtle'> & {
  /** Screen id from the design spec's screen inventory, e.g. "S7 — Home / Card overview". */
  name: string;
  /** Route params to display verbatim (e.g. the result of `useLocalSearchParams()`). */
  params?: Record<string, unknown>;
  /** Non-route provider/context state worth surfacing while there is no real UI yet (e.g. `{ locked, biometricsEnabled }`). */
  debug?: Record<string, unknown>;
  /** Generic scaffolding links so the route tree stays walkable end to end before the real screens exist. */
  links?: RouteStubLink[];
  children?: ReactNode;
};

export function RouteStub({ name, params, debug, links, children, scroll, subtle }: RouteStubProps) {
  const router = useRouter();

  return (
    <Screen scroll={scroll} subtle={subtle}>
      <Text variant="overline" color="inkSubtle">
        Phase 3 stub
      </Text>
      <Text variant="title2" style={styles.title}>
        {name}
      </Text>

      {params && Object.keys(params).length > 0 ? (
        <View style={styles.section}>
          <Text variant="caption" color="inkSubtle">
            PARAMS
          </Text>
          <Text variant="footnote" color="inkMuted" tabular>
            {JSON.stringify(params, null, 2)}
          </Text>
        </View>
      ) : null}

      {debug && Object.keys(debug).length > 0 ? (
        <View style={styles.section}>
          <Text variant="caption" color="inkSubtle">
            PROVIDER STATE
          </Text>
          <Text variant="footnote" color="inkMuted" tabular>
            {JSON.stringify(debug, null, 2)}
          </Text>
        </View>
      ) : null}

      {links && links.length > 0 ? (
        <View style={styles.links}>
          {links.map((link) => (
            <Button key={link.label} variant="secondary" fullWidth onPress={() => router.push(link.href)}>
              {link.label}
            </Button>
          ))}
        </View>
      ) : null}

      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  section: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  links: {
    gap: Spacing.sm,
  },
});
