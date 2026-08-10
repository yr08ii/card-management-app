/**
 * S6 — Biometric unlock (design spec §3.1). Presented as a fullscreen modal
 * from the root Stack (see `_layout.tsx`). This is the lock gate itself —
 * unlike other stub screens it deliberately has no "skip" link; later
 * phases add the real Face ID / Touch ID / passcode prompt wired to
 * `useAppLock().unlock()` and `unlockWithPassword()`.
 */

import { Redirect } from 'expo-router';

import { RouteStub } from '@/components/route-stub';
import { useAppLock } from '@/providers/app-lock-provider';
import { useAuth } from '@/providers/auth-provider';

export default function UnlockScreen() {
  const { status } = useAuth();
  const { locked, biometricsEnabled, biometricsAvailable } = useAppLock();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/landing" />;
  }
  if (!locked) {
    return <Redirect href="/(app)/(home)" />;
  }

  return <RouteStub name="S6 — Biometric unlock" debug={{ locked, biometricsEnabled, biometricsAvailable }} />;
}
