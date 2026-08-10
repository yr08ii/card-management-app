/**
 * Real backend client — implements `Api` against the `/app/*` endpoints
 * defined by the backend implementation plan (see PRD §13 traceability
 * table). This is a typed stub for the front-end-only phase (design spec
 * §5 "Out of scope"): every method throws `NotImplementedError`.
 *
 * This file is the seam the real integration drops into. When that work
 * starts:
 *   1. Fill in `request()` to actually call `fetch` against `BASE_URL + ROUTES[...]`.
 *   2. Wire `AuthTokenProvider` to the real `AuthProvider` (design spec §3.3)
 *      so `Authorization: Bearer <accessToken>` is attached automatically.
 *   3. Implement the single-refresh-then-logout rule from PRD §9.7 inside
 *      `request()`'s 401 handling, using `refresh()` below.
 *   4. Replace each method body with the corresponding fetch call, mapping
 *      non-2xx responses to `ApiError` with the appropriate `ApiErrorCode`.
 *
 * No method here should ever log request/response bodies — PAN, CVV,
 * tokens, and passwords may flow through this layer (PRD §9.5).
 */

import type { Api, AcceptInviteInput, ChangePasswordInput, GetTransactionsQuery, LoginInput, StepUpInput, StepUpResult } from './api';
import type { Balance, Card, Page, Session, SensitiveCard, Transaction, User } from './types';
import { ApiError } from './types';

/**
 * Route map — one entry per `Api` method, taken verbatim from the PRD §13
 * traceability table / screen inventory (§7). Kept as a constant so the
 * eventual `fetch` calls have a single source of truth for paths, and so a
 * reviewer can diff this map against the backend plan directly.
 */
export const ROUTES = {
  acceptInvite: 'POST /app/auth/accept-invite',
  login: 'POST /app/auth/login',
  refresh: 'POST /app/auth/refresh',
  stepUp: 'POST /app/auth/step-up',
  changePassword: 'POST /app/auth/change-password',
  getMe: 'GET /app/me',
  getCards: 'GET /app/cards',
  getCard: 'GET /app/cards/:cardId',
  getBalance: 'GET /app/cards/balance',
  getSensitive: 'GET /app/cards/:cardId/sensitive',
  blockCard: 'POST /app/cards/:cardId/block',
  unblockCard: 'POST /app/cards/:cardId/unblock',
  getTransactions: 'GET /app/transactions',
} as const satisfies Record<keyof Api, string>;

/** Thrown by every `HttpApi` method until the real integration lands. */
export class NotImplementedError extends Error {
  constructor(route: string) {
    super(`HttpApi: not implemented yet (${route}). See src/services/http.ts.`);
    this.name = 'NotImplementedError';
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

/**
 * Supplies the current access token (and a way to trigger a refresh) to the
 * HTTP layer without the HTTP layer owning session state itself — that
 * stays in `AuthProvider` (design spec §3.3). A no-op placeholder today;
 * wired to the real provider during integration.
 */
export interface AuthTokenProvider {
  getAccessToken(): string | null;
  /** Called by `request()` on a single 401 retry attempt (PRD §9.7). */
  refreshAccessToken(): Promise<string | null>;
  /** Called when refresh also fails — forces logout to S3 (PRD §9.7). */
  onSessionExpired(): void;
}

const noopAuthTokenProvider: AuthTokenProvider = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onSessionExpired: () => {},
};

export interface HttpApiConfig {
  /** API origin, e.g. "https://api.example.com". No path/trailing slash. */
  baseUrl: string;
  authTokenProvider?: AuthTokenProvider;
}

export class HttpApi implements Api {
  private readonly baseUrl: string;
  private readonly authTokenProvider: AuthTokenProvider;

  constructor(config: HttpApiConfig) {
    this.baseUrl = config.baseUrl;
    this.authTokenProvider = config.authTokenProvider ?? noopAuthTokenProvider;
  }

  /**
   * Sketch of the shared request path every method will eventually route
   * through: attach the bearer token, do the fetch, map errors, and on a
   * 401 perform exactly one silent refresh-and-retry before giving up
   * (PRD §9.7). Left unimplemented deliberately — see file header.
   */
  private async request<T>(route: string, _init?: RequestInit): Promise<T> {
    // const token = this.authTokenProvider.getAccessToken();
    // const res = await fetch(`${this.baseUrl}${path}`, {
    //   ...init,
    //   headers: { ...init?.headers, Authorization: token ? `Bearer ${token}` : '' },
    // });
    // if (res.status === 401) { ... single refresh + retry, else onSessionExpired() + ApiError('SESSION_EXPIRED', ...) }
    // if (!res.ok) { throw ApiError.from(res) }
    // return res.json();
    throw new NotImplementedError(route);
  }

  acceptInvite(_input: AcceptInviteInput): Promise<Session> {
    return this.request(ROUTES.acceptInvite);
  }

  login(_input: LoginInput): Promise<Session> {
    return this.request(ROUTES.login);
  }

  refresh(_refreshToken: string): Promise<Session> {
    return this.request(ROUTES.refresh);
  }

  stepUp(_input: StepUpInput): Promise<StepUpResult> {
    return this.request(ROUTES.stepUp);
  }

  changePassword(_input: ChangePasswordInput): Promise<void> {
    return this.request(ROUTES.changePassword);
  }

  getMe(): Promise<User> {
    return this.request(ROUTES.getMe);
  }

  getCards(): Promise<Card[]> {
    return this.request(ROUTES.getCards);
  }

  getCard(_cardId: string): Promise<Card> {
    return this.request(ROUTES.getCard);
  }

  getBalance(): Promise<Balance> {
    return this.request(ROUTES.getBalance);
  }

  getSensitive(_cardId: string, _revealToken: string): Promise<SensitiveCard> {
    return this.request(ROUTES.getSensitive);
  }

  blockCard(_cardId: string): Promise<Card> {
    return this.request(ROUTES.blockCard);
  }

  unblockCard(_cardId: string): Promise<Card> {
    return this.request(ROUTES.unblockCard);
  }

  getTransactions(_q?: GetTransactionsQuery): Promise<Page<Transaction>> {
    return this.request(ROUTES.getTransactions);
  }
}

// Re-exported so callers can reference the error type without importing
// from './types' directly if they only need this module.
export { ApiError };

/**
 * Default `HttpApi` instance for `src/services/index.ts` to select when
 * `USE_MOCKS` is false. `baseUrl` is a placeholder — real integration wires
 * this to an environment-driven config plus the real `AuthTokenProvider`.
 */
export const httpApi: Api = new HttpApi({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.invalid',
});
