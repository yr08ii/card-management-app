/**
 * S1 — Splash (design spec §3.1, PRD §7).
 *
 * The silent token refresh itself happens in `AuthProvider`'s boot effect;
 * the root layout withholds the navigator (and keeps the native splash
 * screen up) until `status !== 'loading'`. By the time this route mounts,
 * the decision is already made — its only job is the redirect.
 */

import { Redirect } from 'expo-router';

import { useAppLock } from '@/providers/app-lock-provider';
import { useAuth } from '@/providers/auth-provider';

export default function SplashRedirect() {
  const { status } = useAuth();
  const { locked } = useAppLock();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/landing" />;
  }
  if (locked) {
    return <Redirect href="/unlock" />;
  }
  return <Redirect href="/(app)/(home)" />;
}
