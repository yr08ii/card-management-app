/**
 * Pre-auth stack layout (design spec §3.1). Defends against landing here
 * while already authenticated — e.g. a stale deep link, or `status`
 * flipping to `authenticated` while a screen under this group is still
 * mounted — by redirecting to the appropriate post-auth destination.
 */

import { Redirect, Stack } from 'expo-router';

import { useAppLock } from '@/providers/app-lock-provider';
import { useAuth } from '@/providers/auth-provider';

export default function AuthLayout() {
  const { status } = useAuth();
  const { locked } = useAppLock();

  if (status === 'authenticated') {
    return <Redirect href={locked ? '/unlock' : '/(app)/(home)'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
