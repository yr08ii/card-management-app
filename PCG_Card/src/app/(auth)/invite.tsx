/**
 * S4 — Accept invite (design spec §3.1, PRD F1/AC3).
 *
 * Deep link `cardapp://invite?email=…&token=…` resolves to this route: the
 * `(auth)` group segment contributes no URL path, so `(auth)/invite.tsx` is
 * reachable at `/invite`, matching the scheme configured in `app.json`.
 */

import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function InviteScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  return (
    <RouteStub
      name="S4 — Accept invite"
      params={params}
      links={[{ label: 'Continue to set password', href: '/(auth)/set-password' }]}
    />
  );
}
