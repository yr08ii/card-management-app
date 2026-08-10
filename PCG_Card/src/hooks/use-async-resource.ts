/**
 * Uniform loading/error/data handling for any async call a screen makes
 * against the service layer (design spec §3.3, §4 phase 3). Every screen
 * uses this instead of hand-rolling its own `useState`/`useEffect` trio, so
 * loading, empty, and error states behave the same way everywhere.
 */

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

import { ApiError } from '@/services';

export interface UseAsyncResourceResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** Re-runs `fn` without waiting for a dependency to change. */
  refetch: () => void;
}

/** Wraps a non-`ApiError` throw (a bug, not an expected failure mode) so callers only ever see `ApiError`. */
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  return new ApiError('SERVER_ERROR', message, err);
}

/**
 * Runs `fn` whenever `deps` changes (or `refetch()` is called) and exposes
 * `{ data, error, loading, refetch }`.
 *
 * - `fn` is read through a ref, not included in `deps` itself — same
 *   convention as `useEffect`: callers control re-run timing explicitly via
 *   `deps`, so an inline arrow function passed as `fn` does not cause a
 *   re-fetch loop just because it's a new closure every render.
 * - Results that resolve after the effect has been cleaned up (unmount, or
 *   a newer run superseding it) are discarded instead of calling `setState`
 *   on an unmounted/stale component.
 */
export function useAsyncResource<T>(fn: () => Promise<T>, deps: DependencyList): UseAsyncResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fnRef
      .current()
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(toApiError(err));
        setLoading(false);
      });

    return () => {
      active = false;
    };
    // `deps` is caller-controlled, matching `useEffect`'s own contract — see doc comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, error, loading, refetch };
}
