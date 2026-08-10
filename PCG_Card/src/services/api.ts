/**
 * The `Api` interface — one method per PRD endpoint, nothing more.
 *
 * Mirrors the PRD's traceability table (§13) and design spec §3.2 exactly,
 * so a screen written against this interface does not change when
 * `src/services/index.ts` swaps the mock implementation for `HttpApi`.
 */

import type {
  Balance,
  Card,
  Page,
  Session,
  SensitiveCard,
  Transaction,
  User,
} from './types';

export interface AcceptInviteInput {
  email: string;
  token: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface StepUpInput {
  password: string;
}

export interface StepUpResult {
  revealToken: string;
  /** Reveal-token lifetime in seconds (PRD F5/AC2 — ≤ 90s, `APP_REVEAL_TTL`). */
  expiresIn: number;
}

export interface ChangePasswordInput {
  current: string;
  next: string;
}

export interface GetTransactionsQuery {
  cursor?: string;
  from?: string;
  to?: string;
}

export interface Api {
  // F1 — Invite activation. POST /app/auth/accept-invite
  acceptInvite(input: AcceptInviteInput): Promise<Session>;

  // F2 — Authentication & session. POST /app/auth/login
  login(input: LoginInput): Promise<Session>;

  // F2 — Authentication & session. POST /app/auth/refresh
  refresh(refreshToken: string): Promise<Session>;

  // F5 — Reveal PAN/CVV step-up. POST /app/auth/step-up
  stepUp(input: StepUpInput): Promise<StepUpResult>;

  // F8 — Change password. POST /app/auth/change-password
  changePassword(input: ChangePasswordInput): Promise<void>;

  // F8 — Profile. GET /app/me
  getMe(): Promise<User>;

  // F3 — Card overview. GET /app/cards
  getCards(): Promise<Card[]>;

  // F4 — Card details. GET /app/cards/:cardId
  getCard(cardId: string): Promise<Card>;

  // F3 — Card overview balance. GET /app/cards/balance
  getBalance(): Promise<Balance>;

  // F5 — Reveal PAN/CVV. GET /app/cards/:cardId/sensitive
  getSensitive(cardId: string, revealToken: string): Promise<SensitiveCard>;

  // F6 — Block card. POST /app/cards/:cardId/block
  blockCard(cardId: string): Promise<Card>;

  // F6 — Unblock card. POST /app/cards/:cardId/unblock
  unblockCard(cardId: string): Promise<Card>;

  // F7 — Transaction history. GET /app/transactions
  getTransactions(q?: GetTransactionsQuery): Promise<Page<Transaction>>;
}
