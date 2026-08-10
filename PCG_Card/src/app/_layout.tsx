/**
 * Root layout — providers + root Stack (design spec §3.1, §3.3).
 *
 * Provider order: SafeArea → Theme → Auth → AppLock → Toast. `AppLockProvider`
 * is nested inside `AuthProvider` because it reads `useAuth()` (it needs to
 * know when a session was silently resumed vs. established interactively —
 * see `src/providers/app-lock-provider.tsx`).
 *
 * Routing gate: `index.tsx` (S1 splash) performs the actual redirect once
 * `AuthProvider`'s silent refresh has resolved — unauthenticated → `(auth)`,
 * authenticated+locked → `/unlock`, authenticated+unlocked → `(app)`. The
 * locked case is re-asserted defensively in `(app)/_layout.tsx` itself
 * (PRD F2/AC3 — no `(app)` screen may render while locked, including via a
 * deep link that bypasses `index.tsx`).
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/toast';
import { ThemeOverrideProvider } from '@/hooks/use-theme';
import { AppLockProvider } from '@/providers/app-lock-provider';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeOverrideProvider>
        <AuthProvider>
          <AppLockProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </AppLockProvider>
        </AuthProvider>
      </ThemeOverrideProvider>
    </SafeAreaProvider>
  );
}

/**
 * Keeps the native splash screen up until the auth bootstrap (silent
 * refresh) resolves, then mounts the real navigator.
 */
function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="unlock"
        options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
