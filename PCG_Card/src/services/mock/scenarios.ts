/**
 * Dev-only scenario switches the UI can flip to force particular states
 * out of the mock `Api` (design spec §3.2, §6). Lets every screen's
 * loading / empty / error / offline states be exercised on demand instead
 * of only when they happen to occur naturally in the seeded fixture data.
 *
 * A simple module-level mutable store with getters/setters and a subscribe
 * function — no state-management dependency, matching design spec §3.3.
 */

export interface Scenarios {
  /** Every mock call rejects with a SERVER_ERROR ApiError. */
  forceError: boolean;
  /** List-returning calls (transactions) resolve with zero items. */
  forceEmpty: boolean;
  /** Every mock call rejects with a NETWORK_OFFLINE ApiError, as if the device had no connectivity. */
  forceOffline: boolean;
  /** The seeded card is treated as BLOCKED regardless of prior block/unblock calls. */
  forceBlocked: boolean;
  /** Latency is widened well beyond the normal 300-800ms jitter range. */
  forceSlowNetwork: boolean;
  /** acceptInvite always rejects with INVITE_EXPIRED. */
  forceInviteExpired: boolean;
}

export const defaultScenarios: Scenarios = {
  forceError: false,
  forceEmpty: false,
  forceOffline: false,
  forceBlocked: false,
  forceSlowNetwork: false,
  forceInviteExpired: false,
};

type Listener = (scenarios: Readonly<Scenarios>) => void;

let state: Scenarios = { ...defaultScenarios };
const listeners = new Set<Listener>();

function notify(): void {
  const snapshot = getScenarios();
  for (const listener of listeners) listener(snapshot);
}

/** Current scenario flags (read-only snapshot). */
export function getScenarios(): Readonly<Scenarios> {
  return { ...state };
}

/** Read a single scenario flag. */
export function getScenario<K extends keyof Scenarios>(key: K): Scenarios[K] {
  return state[key];
}

/** Set one or more scenario flags. */
export function setScenarios(partial: Partial<Scenarios>): void {
  state = { ...state, ...partial };
  notify();
}

/** Set a single scenario flag. */
export function setScenario<K extends keyof Scenarios>(key: K, value: Scenarios[K]): void {
  setScenarios({ [key]: value } as Partial<Scenarios>);
}

/** Reset every scenario flag to its default (all off). */
export function resetScenarios(): void {
  state = { ...defaultScenarios };
  notify();
}

/** Subscribe to scenario changes. Returns an unsubscribe function. */
export function subscribeScenarios(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
