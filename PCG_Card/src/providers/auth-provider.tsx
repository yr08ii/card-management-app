/**
 * `AuthProvider` — session, tokens, `login` / `acceptInvite` / `logout` /
 * silent refresh (design spec §3.3, PRD F1, F2).
 *
 * SECURITY (PRD §9.1): the access and refresh tokens live in
 * `expo-secure-store` ONLY — never `AsyncStorage`, never a plain module
 * variable that could be serialized (e.g. by a persistence/devtools
 * integration). Nothing here ever `console.log`s a token, password, or
 * session object.
 *
 * PRD §9.7: a `SESSION_EXPIRED` `ApiError` from anywhere triggers exactly
 * ONE silent refresh attempt; if that (or the retried call) also fails, the
 * app force-logs-out to the sign-in stack with a session-expired message.
 * That rule lives in exactly one place — `withSessionGuard` below — so
 * later phases route their `api.*` calls through it instead of
 * reimplementing the retry per screen.
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
import * as SecureStore from 'expo-secure-store';

import { api, ApiError } from '@/services';
import type { AcceptInviteInput, ChangePasswordInput, LoginInput, Session, User } from '@/services';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  /**
   * Set once by a forced logout triggered from `withSessionGuard` (PRD
   * §9.7). The login screen (S3) should surface it once as a "Session
   * expired" message, then call `clearSessionExpiredMessage`.
   */
  sessionExpiredMessage: string | null;
  clearSessionExpiredMessage: () => void;
  /**
   * True on the render(s) immediately after boot re-established a session
   * via the silent refresh, as opposed to an interactive `login`/
   * `acceptInvite` completed in this app session. `AppLockProvider` reads
   * this once to decide whether the very first `(app)` screen requires an
   * unlock gate (PRD daily-use flow: Splash → Unlock → Home) or not
   * (activation flow: Set password → Home, no immediate re-auth).
   */
  resumedFromSilentRefresh: boolean;
  login: (input: LoginInput) => Promise<void>;
  acceptInvite: (input: AcceptInviteInput) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  /**
   * Runs `fn`. If it rejects with a `SESSION_EXPIRED` `ApiError`, attempts
   * exactly one silent refresh and retries `fn` once; if the refresh or the
   * retry also fails, forces logout with a session-expired message before
   * rethrowing. Every other error passes through untouched.
   */
  withSessionGuard: <T>(fn: () => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(session: Session): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
  ]);
}

/** PRD F2/AC4 — logout (forced or user-initiated) clears every token from secure storage. */
async function clearPersistedSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
  ]);
}

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [resumedFromSilentRefresh, setResumedFromSilentRefresh] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // `withSessionGuard`'s retry needs the latest refresh token without
  // depending on (and thus recreating itself around) `session` state.
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const applySession = useCallback((next: Session, opts?: { silent?: boolean }) => {
    sessionRef.current = next;
    setSession(next);
    setUser(next.user);
    setResumedFromSilentRefresh(Boolean(opts?.silent));
    setStatus('authenticated');
  }, []);

  const forceLogoutWithMessage = useCallback(async (message: string) => {
    await clearPersistedSession();
    sessionRef.current = null;
    setSession(null);
    setUser(null);
    setResumedFromSilentRefresh(false);
    setStatus('unauthenticated');
    setSessionExpiredMessage(message);
  }, []);

  // Boot: silent refresh from whatever refresh token (if any) is already in
  // secure storage (S1 Splash — design spec §3.1, PRD §7).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
      if (!storedRefreshToken) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }

      try {
        const refreshed = await api.refresh(storedRefreshToken);
        if (cancelled) return;
        await persistSession(refreshed);
        applySession(refreshed, { silent: true });
      } catch {
        if (cancelled) return;
        await clearPersistedSession();
        setStatus('unauthenticated');
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once on mount only — this is the app-launch bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const next = await api.login(input);
      await persistSession(next);
      applySession(next);
    },
    [applySession],
  );

  const acceptInvite = useCallback(
    async (input: AcceptInviteInput) => {
      const next = await api.acceptInvite(input);
      await persistSession(next);
      applySession(next);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await clearPersistedSession();
    sessionRef.current = null;
    setSession(null);
    setUser(null);
    setResumedFromSilentRefresh(false);
    setStatus('unauthenticated');
  }, []);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    await api.changePassword(input);
  }, []);

  const clearSessionExpiredMessage = useCallback(() => setSessionExpiredMessage(null), []);

  const withSessionGuard = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (!(err instanceof ApiError) || err.code !== 'SESSION_EXPIRED') {
          throw err;
        }

        const currentRefreshToken = sessionRef.current?.refreshToken;
        if (!currentRefreshToken) {
          await forceLogoutWithMessage(SESSION_EXPIRED_MESSAGE);
          throw err;
        }

        // The single refresh attempt (PRD §9.7).
        try {
          const refreshed = await api.refresh(currentRefreshToken);
          await persistSession(refreshed);
          applySession(refreshed);
        } catch (refreshErr) {
          await forceLogoutWithMessage(SESSION_EXPIRED_MESSAGE);
          throw refreshErr;
        }

        // The single retry.
        try {
          return await fn();
        } catch (retryErr) {
          if (retryErr instanceof ApiError && retryErr.code === 'SESSION_EXPIRED') {
            await forceLogoutWithMessage(SESSION_EXPIRED_MESSAGE);
          }
          throw retryErr;
        }
      }
    },
    [applySession, forceLogoutWithMessage],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      status,
      sessionExpiredMessage,
      clearSessionExpiredMessage,
      resumedFromSilentRefresh,
      login,
      acceptInvite,
      logout,
      changePassword,
      withSessionGuard,
    }),
    [
      session,
      user,
      status,
      sessionExpiredMessage,
      clearSessionExpiredMessage,
      resumedFromSilentRefresh,
      login,
      acceptInvite,
      logout,
      changePassword,
      withSessionGuard,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called within an <AuthProvider>');
  }
  return ctx;
}
