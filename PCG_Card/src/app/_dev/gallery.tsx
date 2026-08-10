/**
 * Dev-only component gallery — renders every `ui/` primitive in every
 * variant/state so the design system can be reviewed visually in one place.
 * Not linked from the tab bar; reach it during development via
 * `router.push('/_dev/gallery')` or by typing the path directly on web.
 */
import { type PropsWithChildren, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Countdown } from '@/components/ui/countdown';
import { Divider } from '@/components/ui/divider';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { Toast, ToastProvider, useToast } from '@/components/ui/toast';
import { Spacing, type ThemeMode, type TypographyVariant } from '@/constants/theme';
import { useTheme, ThemeOverrideProvider, useThemeOverride } from '@/hooks/use-theme';

const TYPOGRAPHY_VARIANTS: TypographyVariant[] = [
  'display',
  'title1',
  'title2',
  'title3',
  'body',
  'bodyStrong',
  'callout',
  'subhead',
  'footnote',
  'caption',
  'overline',
];

export default function GalleryScreen() {
  return (
    <ThemeOverrideProvider>
      <ToastProvider>
        <GalleryBody />
      </ToastProvider>
    </ThemeOverrideProvider>
  );
}

function GalleryBody() {
  const theme = useTheme();
  const { override, setOverride } = useThemeOverride();

  return (
    <Screen subtle>
      <Text variant="title1" style={styles.pageTitle}>
        Component Gallery
      </Text>
      <Text variant="footnote" color="inkMuted" style={styles.pageSubtitle}>
        Every ui/ primitive, every variant. Dev-only — not part of the app's route tree.
      </Text>

      <Section title="Theme">
        <SegmentedControl
          accessibilityLabel="Theme override"
          value={override ?? 'system'}
          onChange={(next) => setOverride(next === 'system' ? null : (next as ThemeMode))}
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </Section>

      <Section title="Color tokens">
        <View style={styles.swatchGrid}>
          {(Object.keys(theme) as (keyof typeof theme)[]).map((key) => (
            <View key={key} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: theme[key], borderColor: theme.border }]} />
              <Text variant="caption" color="inkMuted">
                {key}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography">
        <Surface style={styles.stack}>
          {TYPOGRAPHY_VARIANTS.map((variant) => (
            <Text key={variant} variant={variant}>
              {variant} — The quick brown fox
            </Text>
          ))}
          <Text variant="bodyStrong" tabular>
            $1,234.56 · 4242 4242 4242 4242
          </Text>
        </Surface>
      </Section>

      <Section title="Button">
        <Surface style={styles.stack}>
          {(['primary', 'secondary', 'ghost', 'destructive'] as const).map((variant) => (
            <View key={variant} style={styles.row}>
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <Button key={size} variant={variant} size={size} onPress={() => {}}>
                  {variant}
                </Button>
              ))}
            </View>
          ))}
          <View style={styles.row}>
            <Button variant="primary" loading onPress={() => {}}>
              Loading
            </Button>
            <Button variant="primary" disabled onPress={() => {}}>
              Disabled
            </Button>
          </View>
        </Surface>
      </Section>

      <Section title="IconButton">
        <Surface style={[styles.row, styles.pad]}>
          <IconButton
            icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
            accessibilityLabel="Delete"
            color="danger"
            onPress={() => {}}
          />
          <IconButton
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            accessibilityLabel="Share"
            variant="surface"
            onPress={() => {}}
          />
          <IconButton
            icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
            accessibilityLabel="Locked"
            disabled
            onPress={() => {}}
          />
        </Surface>
      </Section>

      <Section title="Surface & elevation">
        <View style={styles.row}>
          <Surface elevation="level1" style={styles.elevationBox}>
            <Text variant="caption">level1</Text>
          </Surface>
          <Surface elevation="level2" style={styles.elevationBox}>
            <Text variant="caption">level2</Text>
          </Surface>
          <Surface elevation="level3" style={styles.elevationBox}>
            <Text variant="caption">level3</Text>
          </Surface>
        </View>
      </Section>

      <Section title="ListRow">
        <Surface>
          <ListRow
            title="Card ending in 4242"
            subtitle="Active"
            icon={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
            onPress={() => {}}
          />
          <Divider inset={false} />
          <ListRow
            title="Notifications"
            subtitle="Push and email alerts"
            icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
            trailing={<Badge variant="brand">On</Badge>}
          />
          <Divider inset={false} />
          <ListRow title="No icon, no trailing" />
        </Surface>
      </Section>

      <InputSection />

      <Section title="Badge">
        <View style={[styles.row, styles.pad]}>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="danger">Blocked</Badge>
          <Badge variant="warning">Pending</Badge>
        </View>
      </Section>

      <Section title="Skeleton">
        <Surface style={styles.stack}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={14} width="90%" />
          <Skeleton height={14} width="40%" />
          <View style={styles.row}>
            <Skeleton width={44} height={44} radius="pill" />
            <View style={[styles.stack, { flex: 1 }]}>
              <Skeleton height={12} width="70%" />
              <Skeleton height={12} width="50%" />
            </View>
          </View>
        </Surface>
      </Section>

      <BottomSheetSection />

      <ToastSection />

      <Section title="Divider">
        <Surface style={styles.pad}>
          <Text variant="body">Above</Text>
          <Divider />
          <Text variant="body">Below</Text>
        </Surface>
      </Section>

      <Section title="SegmentedControl">
        <RangeDemo />
      </Section>

      <Section title="Countdown">
        <CountdownDemo />
      </Section>
    </Screen>
  );
}

function InputSection() {
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Section title="Input & PasswordStrengthMeter">
      <Surface style={styles.stack}>
        <Input label="Email" value={value} onChangeText={setValue} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <Input label="With error" value="" onChangeText={() => {}} error="This field is required" />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
        />
        <PasswordStrengthMeter password={password} />
      </Surface>
    </Section>
  );
}

function BottomSheetSection() {
  const [visible, setVisible] = useState(false);

  return (
    <Section title="BottomSheet">
      <Button variant="secondary" onPress={() => setVisible(true)}>
        Open sheet
      </Button>
      <BottomSheet visible={visible} onClose={() => setVisible(false)} title="Block this card?">
        <Text variant="title3" style={styles.pad}>
          Block this card?
        </Text>
        <Text variant="body" color="inkMuted" style={styles.pad}>
          You can unblock it again at any time. Tap the backdrop to dismiss.
        </Text>
        <Button variant="destructive" onPress={() => setVisible(false)}>
          Block card
        </Button>
      </BottomSheet>
    </Section>
  );
}

function ToastSection() {
  const toast = useToast();

  return (
    <Section title="Toast">
      <View style={styles.row}>
        <Button variant="secondary" onPress={() => toast.show('Copied to clipboard')}>
          Default
        </Button>
        <Button variant="secondary" onPress={() => toast.show('Card unblocked', 'success')}>
          Success
        </Button>
        <Button variant="secondary" onPress={() => toast.show('Something went wrong', 'danger')}>
          Danger
        </Button>
      </View>
      <View style={styles.stack}>
        <Toast message="Static preview toast" variant="success" />
      </View>
    </Section>
  );
}

function RangeDemo() {
  const [range, setRange] = useState('7d');

  return (
    <SegmentedControl
      accessibilityLabel="Date range"
      value={range}
      onChange={setRange}
      options={[
        { label: '7D', value: '7d' },
        { label: '30D', value: '30d' },
        { label: 'All', value: 'all' },
      ]}
    />
  );
}

function CountdownDemo() {
  const [key, setKey] = useState(0);

  return (
    <Surface style={[styles.row, styles.pad]}>
      <Countdown key={key} seconds={30} onExpire={() => {}} />
      <Button variant="ghost" size="sm" onPress={() => setKey((k) => k + 1)}>
        Restart
      </Button>
    </Surface>
  );
}

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text variant="overline" color="inkMuted" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  stack: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pad: {
    padding: Spacing.lg,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  swatchItem: {
    width: 72,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  elevationBox: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
