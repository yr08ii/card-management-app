/**
 * `AppLockProvider` — the app-unlock gate (PRD F2/AC3, §9.2) and the
 * biometric step-up orchestration for reveal (PRD F5, §8, design spec
 * §3.3).
 *
 * LAYERING (see the phase-3 task brief): the service layer's
 * `api.stepUp({ password })` is UI-agnostic — it only knows how to verify a
 * password. The PRD's actual flow is "biometrics unlock a securely-stored
 * credential which then satisfies step-up, with password re-entry as the
 * fallback." That orchestration belongs here, in the provider, not in
 * `src/services/`.
 *
 * Two distinct uses of the platform biometric APIs, deliberately kept
 * separate:
 *   - `unlock()` — a pure *presence* check via `expo-local-authentication`.
 *     The app-unlock gate (S6) doesn't need a secret, just proof the person
 *     holding the device is who it thinks it is.
 *   - `stepUpWithBiometrics()` — a biometric-gated *secret retrieval* via
 *     `expo-secure-store`'s `requireAuthentication` option. Enabling
 *     biometrics (F9/AC1) stores the account password behind that gate;
 *     revealing PAN/CVV reads it back (which itself triggers the OS
 *     biometric prompt) and feeds it to `api.stepUp`.
 *
 * SECURITY: the step-up credential never leaves `expo-secure-store` except
 * as a local variable passed straight into `api.stepUp`; it is never logged
 * and never assigned to component state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { api } from '@/services';
import { useAuth } from './auth-provider';

/** PRD §9.2 — default auto-lock window: how long the app may sit backgrounded before the next foreground requires an unlock. */
export const AUTO_LOCK_DELAY_MS = 2 * 60 * 1000;

const STEP_UP_CREDENTIAL_KEY = 'applock_step_up_credential';
/**
 * Non-sensitive on/off preference (F9/AC1). There is no plain-storage
 * dependency in this project (e.g. `AsyncStorage`) and installing one is out
 * of scope for this phase, so this flag is persisted in `expo-secure-store`
 * too — the only persistent key/value store available — but WITHOUT
 * `requireAuthentication`, since the preference itself isn't sensitive. The
 * credential it gates (`STEP_UP_CREDENTIAL_KEY`) is the one biometric-gated
 * value.
 */
const BIOMETRICS_PREF_KEY = 'applock_biometrics_enabled';

export interface AppLockContextValue {
  /** While `true`, no `(app)` screen may render — enforced in `(app)/_layout.tsx`. */
  locked: boolean;
  /** User preference (F9/AC1). */
  biometricsEnabled: boolean;
  /** Whether the device currently has usable biometric hardware + enrollment, for the Settings toggle to gate on. */
  biometricsAvailable: boolean;
  /** Presence-only biometric unlock, with device passcode as the OS-level fallback. Resolves `true` on success. */
  unlock: () => Promise<boolean>;
  /** Fallback path for S6 when biometrics are off/unavailable (F9/AC1): re-verifies the account password. */
  unlockWithPassword: (password: string) => Promise<boolean>;
  /** Opts into biometric step-up: stores `password` behind a biometric-gated SecureStore entry. */
  enableBiometrics: (password: string) => Promise<void>;
  disableBiometrics: () => Promise<void>;
  /**
   * PRD §8 reveal step-up: biometric prompt → stored credential →
   * `api.stepUp`. When biometrics are off/unavailable/cancelled, or no
   * credential has been enrolled yet, calls `onRequirePassword` to obtain
   * the account password instead (the UI-owned fallback prompt) and
   * completes step-up with that. Resolves the reveal token — never PAN/CVV
   * itself.
   */
  stepUpWithBiometrics: (onRequirePassword: () => Promise<string>) => Promise<string>;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const auth = useAuth();

  const [locked, setLocked] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  const backgroundedAtRef = useRef<number | null>(null);

  // Load the biometrics preference + hardware availability once on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [pref, hasHardware, isEnrolled] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRICS_PREF_KEY).catch(() => null),
        LocalAuthentication.hasHardwareAsync().catch(() => false),
        LocalAuthentication.isEnrolledAsync().catch(() => false),
      ]);
      if (cancelled) return;
      setBiometricsEnabled(pref === 'true');
      setBiometricsAvailable(hasHardware && isEnrolled);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Daily-use flow (PRD §8): a session resumed silently on cold launch
  // requires an unlock before the first `(app)` screen. A session
  // established interactively in this app session (login/accept-invite)
  // does not.
  useEffect(() => {
    if (auth.status === 'authenticated' && auth.resumedFromSilentRefresh) {
      setLocked(true);
    }
  }, [auth.status, auth.resumedFromSilentRefresh]);

  // A fresh login shouldn't inherit a stale `locked: true` from a previous session.
  useEffect(() => {
    if (auth.status === 'unauthenticated') {
      setLocked(false);
      backgroundedAtRef.current = null;
    }
  }, [auth.status]);

  // PRD §9.2 — background-timer auto-lock.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAtRef.current = Date.now();
        return;
      }
      if (next === 'active') {
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (backgroundedAt !== null && Date.now() - backgroundedAt >= AUTO_LOCK_DELAY_MS) {
          setLocked(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!biometricsEnabled) return false;

    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock PCG Card',
      disableDeviceFallback: false, // device passcode is the OS-level fallback (PRD §2)
    });
    if (result.success) {
      setLocked(false);
      return true;
    }
    return false;
  }, [biometricsEnabled]);

  const unlockWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      const email = auth.user?.email;
      if (!email) return false;
      try {
        await api.login({ email, password });
        setLocked(false);
        return true;
      } catch {
        return false;
      }
    },
    [auth.user],
  );

  const enableBiometrics = useCallback(async (password: string): Promise<void> => {
    const supported = SecureStore.canUseBiometricAuthentication();
    if (!supported) {
      throw new Error('Biometric authentication is not available on this device.');
    }
    await SecureStore.setItemAsync(STEP_UP_CREDENTIAL_KEY, password, {
      requireAuthentication: true,
      authenticationPrompt: 'Verify it’s you to enable biometric reveal',
    });
    await SecureStore.setItemAsync(BIOMETRICS_PREF_KEY, 'true');
    setBiometricsEnabled(true);
  }, []);

  const disableBiometrics = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(STEP_UP_CREDENTIAL_KEY).catch(() => {});
    await SecureStore.setItemAsync(BIOMETRICS_PREF_KEY, 'false');
    setBiometricsEnabled(false);
  }, []);

  const stepUpWithBiometrics = useCallback(
    async (onRequirePassword: () => Promise<string>): Promise<string> => {
      if (biometricsEnabled) {
        try {
          // Reading this key itself triggers the OS biometric prompt
          // (`requireAuthentication: true` was set when the entry was
          // written in `enableBiometrics`).
          const storedPassword = await SecureStore.getItemAsync(STEP_UP_CREDENTIAL_KEY, {
            requireAuthentication: true,
            authenticationPrompt: 'Verify it’s you to reveal your card',
          });
          if (storedPassword) {
            const { revealToken } = await api.stepUp({ password: storedPassword });
            return revealToken;
          }
        } catch {
          // Biometric prompt failed/cancelled, or the key was invalidated
          // (e.g. enrolled biometrics changed since it was stored) — fall
          // through to the password prompt rather than surfacing a raw
          // error (PRD §10).
        }
      }

      const password = await onRequirePassword();
      const { revealToken } = await api.stepUp({ password });
      return revealToken;
    },
    [biometricsEnabled],
  );

  const value = useMemo<AppLockContextValue>(
    () => ({
      locked,
      biometricsEnabled,
      biometricsAvailable,
      unlock,
      unlockWithPassword,
      enableBiometrics,
      disableBiometrics,
      stepUpWithBiometrics,
    }),
    [
      locked,
      biometricsEnabled,
      biometricsAvailable,
      unlock,
      unlockWithPassword,
      enableBiometrics,
      disableBiometrics,
      stepUpWithBiometrics,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    throw new Error('useAppLock() must be called within an <AppLockProvider>');
  }
  return ctx;
}
