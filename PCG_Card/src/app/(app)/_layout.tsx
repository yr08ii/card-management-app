/**
 * Authenticated tab bar (design spec §3.1, §3.4, PRD §6): Home ·
 * Transactions · Profile, via `NativeTabs` from
 * `expo-router/unstable-native-tabs`.
 *
 * This layout is also the lock gate's defense-in-depth point: it sits
 * directly above every `(app)` screen, so returning a `<Redirect>` instead
 * of `<NativeTabs>` here guarantees none of Home/Transactions/Profile (or
 * their nested routes) ever mounts while unauthenticated or locked — no
 * card data can render (PRD F2/AC3), including via a deep link that
 * bypasses `index.tsx`'s initial redirect, or an `AppState`-driven re-lock
 * while a tab screen is already on screen (the `<Redirect>` unmounts it in
 * the same render).
 */

import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useAppLock } from '@/providers/app-lock-provider';
import { useAuth } from '@/providers/auth-provider';

export default function AppLayout() {
  const { status } = useAuth();
  const { locked } = useAppLock();
  const theme = useTheme();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/landing" />;
  }
  if (locked) {
    return <Redirect href="/unlock" />;
  }

  return (
    <NativeTabs
      backgroundColor={theme.surface}
      tintColor={theme.brand}
      iconColor={{ default: theme.inkMuted, selected: theme.brand }}
      labelStyle={{ default: { color: theme.inkMuted }, selected: { color: theme.brand } }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'creditcard', selected: 'creditcard.fill' }} md="credit_card" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(transactions)">
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
        <NativeTabs.Trigger.Label>Transactions</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md={{ default: 'person_outline', selected: 'person' }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
