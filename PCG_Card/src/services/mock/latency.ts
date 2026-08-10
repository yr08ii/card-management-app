/**
 * Simulated network delay for the mock `Api`.
 *
 * Real requests are never instant; screens need to exercise loading states
 * (design spec §6) against something. `latency()` resolves after a jittered
 * delay so those states are actually reachable during manual testing, and
 * can be forced to 0 for unit tests / snapshot runs.
 */

const MIN_MS = 300;
const MAX_MS = 800;

/** Set true to make every `latency()` call resolve immediately (e.g. in tests). */
let disabled = false;

export function setLatencyDisabled(value: boolean): void {
  disabled = value;
}

export function isLatencyDisabled(): boolean {
  return disabled;
}

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/**
 * Resolves after a random delay in `[minMs, maxMs]` (default ~300-800ms),
 * or immediately if latency has been disabled via `setLatencyDisabled(true)`.
 */
export function latency(minMs: number = MIN_MS, maxMs: number = MAX_MS): Promise<void> {
  if (disabled) return Promise.resolve();
  const delay = jitter(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
