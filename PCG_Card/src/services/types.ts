/**
 * Domain types for the card-management app service layer.
 *
 * Derived from the PRD (sections 5, 7, 9) and the front-end design spec
 * (section 3.2). This module is pure TypeScript — no React / React Native
 * imports — so it can be shared unchanged between the mock and real
 * implementations of `Api`.
 *
 * SECURITY (PRD §9.3): `Card` intentionally carries no `pan` / `cvv` field.
 * Full PAN/CVV only ever exist on `SensitiveCard`, which is only returned by
 * `Api.getSensitive` and is meant to be held in memory only by callers.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** ISO-8601 timestamp string, e.g. "2026-07-29T14:03:00.000Z". */
export type IsoDateTime = string;

/** ISO-8601 calendar date string, e.g. "2026-07-29". */
export type IsoDate = string;

/** ISO 4217 currency code, e.g. "USD". */
export type CurrencyCode = string;

/**
 * A cursor-paginated page of results.
 * `nextCursor` is `null` when there is no further page.
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// User / session
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: IsoDateTime;
}

/** Result of any auth flow that establishes/refreshes a session (PRD F1, F2). */
export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds, for silent-refresh scheduling. */
  expiresIn: number;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export type CardBrand = 'VISA' | 'MASTERCARD';

export type CardType = 'VIRTUAL';

export type CardStatus = 'ACTIVE' | 'BLOCKED';

/**
 * Masked card metadata only (PRD F3/F4). Deliberately has NO `pan` / `cvv`
 * field so it is impossible to accidentally render a full PAN from a `Card`
 * — the type system enforces the masking boundary, not just convention.
 */
export interface Card {
  id: string;
  last4: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  brand: CardBrand;
  type: CardType;
  status: CardStatus;
  /** Per-transaction limit, minor units (e.g. cents), matching `Transaction.amount`. */
  transactionLimit: number;
  currency: CurrencyCode;
  validFrom: IsoDate;
  validUntil: IsoDate;
}

/**
 * Full sensitive card data (PRD F5). Only ever returned by
 * `Api.getSensitive`, gated by a short-lived reveal token.
 *
 * SECURITY: callers must hold this in memory only — never persist to
 * AsyncStorage, SecureStore, a file, or a log/console call.
 */
export interface SensitiveCard {
  id: string;
  pan: string;
  cvv: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface Balance {
  cardId: string;
  available: number;
  currency: CurrencyCode;
  asOf: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export type TransactionDirection = 'CREDIT' | 'DEBIT';

export type TransactionStatus = 'PENDING' | 'SETTLED' | 'DECLINED';

export type TransactionCategory =
  | 'GROCERIES'
  | 'DINING'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'TRAVEL'
  | 'HEALTH'
  | 'OTHER';

export interface TransactionAuthorization {
  authorizationCode: string;
  /** Masked merchant terminal / acquirer id, non-sensitive. */
  terminalId?: string;
  mcc?: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  merchant: string;
  description: string;
  /** Minor units (e.g. cents). Money is never represented as a float. */
  amount: number;
  currency: CurrencyCode;
  direction: TransactionDirection;
  status: TransactionStatus;
  category: TransactionCategory;
  createdAt: IsoDateTime;
  authorizedAt: IsoDateTime | null;
  authorization: TransactionAuthorization | null;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'INVITE_EXPIRED'
  | 'INVITE_INVALID'
  | 'INVITE_USED'
  | 'SESSION_EXPIRED'
  | 'REVEAL_TOKEN_EXPIRED'
  | 'STEP_UP_FAILED'
  | 'WRONG_CURRENT_PASSWORD'
  | 'WEAK_PASSWORD'
  | 'NETWORK_OFFLINE'
  | 'SERVER_ERROR'
  | 'NOT_FOUND';

/**
 * Machine-readable error carrying a `code` for programmatic handling
 * (e.g. routing SESSION_EXPIRED to the session-expired modal) plus a
 * human-facing `message` suitable for direct display (PRD §10 — error
 * copy must be human, non-technical, actionable; no raw server errors).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** Optional underlying cause (e.g. a caught fetch/network error). Never logged with sensitive data. */
  readonly cause?: unknown;

  constructor(code: ApiErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
