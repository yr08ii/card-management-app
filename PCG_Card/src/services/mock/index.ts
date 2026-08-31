/**
 * Mock implementation of `Api` (design spec §3.2). Backs every screen
 * during the front-end-only phase with deterministic fixture data, honours
 * the dev-only scenario switches in `./scenarios`, and enforces the same
 * shape of rules the real backend will (reveal-token TTL, cursor
 * pagination, date filtering) so screens do not need to change when
 * `HttpApi` takes over.
 *
 * SECURITY (PRD §9.3, §9.5): PAN/CVV are computed on demand and returned
 * once per `getSensitive` call. They are never assigned to a field that
 * outlives the call, never logged, and never written to any storage.
 */

import type {
  Api,
  AcceptInviteInput,
  ChangePasswordInput,
  GetTransactionsQuery,
  LoginInput,
  StepUpInput,
  StepUpResult,
} from '../api';
import type {
  Balance,
  Card,
  Page,
  Session,
  SensitiveCard,
  Transaction,
  User,
} from '../types';
import { ApiError } from '../types';
import {
  MOCK_PASSWORD,
  buildSeedTransactions,
  deriveSensitiveCard,
  seedBalanceAvailable,
  seedCard,
  seedUser,
} from './fixtures';
import { latency } from './latency';
import { getScenarios } from './scenarios';

const PAGE_SIZE = 20;
const REVEAL_TOKEN_TTL_MS = 90 * 1000; // PRD F5/AC2 — ≤ 90s, matches APP_REVEAL_TTL.
const SLOW_NETWORK_MIN_MS = 3000;
const SLOW_NETWORK_MAX_MS = 6000;

function randomToken(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function isValidPassword(password: string): boolean {
  // Matches the PRD's stated rule: min 8 chars (F1/AC1, F8/AC2). A strength
  // *meter* is a UI concern; the mock only enforces the hard minimum.
  return password.length >= 8;
}

export class MockApi implements Api {
  private user: User = { ...seedUser };
  private card: Card = { ...seedCard };
  private transactions: Transaction[] = buildSeedTransactions(seedCard.id);
  private balanceAvailable: number = seedBalanceAvailable;

  /** Current session's refresh token, so `refresh()` can validate it. */
  private currentRefreshToken: string | null = null;
  /** Mutable only via `changePassword`; mock-only, never persisted. */
  private currentPassword: string = MOCK_PASSWORD;
  /** revealToken -> expiry timestamp (ms). Cleared on expiry/consumption is not required; TTL check is sufficient. */
  private revealTokens = new Map<string, number>();

  // -- scenario helpers -----------------------------------------------------

  private async guard(): Promise<void> {
    const scenarios = getScenarios();
    const [minMs, maxMs] = scenarios.forceSlowNetwork
      ? [SLOW_NETWORK_MIN_MS, SLOW_NETWORK_MAX_MS]
      : [undefined, undefined];
    await latency(minMs, maxMs);

    if (scenarios.forceOffline) {
      throw new ApiError('NETWORK_OFFLINE', 'You appear to be offline. Check your connection and try again.');
    }
    if (scenarios.forceError) {
      throw new ApiError('SERVER_ERROR', 'Something went wrong on our end. Please try again.');
    }
  }

  private effectiveCard(): Card {
    const scenarios = getScenarios();
    return scenarios.forceBlocked ? { ...this.card, status: 'BLOCKED' } : { ...this.card };
  }

  private issueSession(): Session {
    const accessToken = randomToken('access');
    const refreshToken = randomToken('refresh');
    this.currentRefreshToken = refreshToken;
    return {
      user: { ...this.user },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  // -- Api --------------------------------------------------------------------

  async acceptInvite(input: AcceptInviteInput): Promise<Session> {
    await this.guard();
    const scenarios = getScenarios();

    if (scenarios.forceInviteExpired) {
      throw new ApiError('INVITE_EXPIRED', 'This invite link has expired. Ask your administrator to resend it.');
    }
    if (!input.token) {
      throw new ApiError('INVITE_INVALID', 'This invite link is not valid.');
    }
    if (!input.email || input.email.toLowerCase() !== this.user.email.toLowerCase()) {
      throw new ApiError('INVITE_INVALID', 'This invite link is not valid.');
    }
    if (!isValidPassword(input.password)) {
      throw new ApiError('WEAK_PASSWORD', 'Password must be at least 8 characters.');
    }

    this.currentPassword = input.password;
    return this.issueSession();
  }

  async login(input: LoginInput): Promise<Session> {
    await this.guard();

    const emailMatches = input.email.toLowerCase() === this.user.email.toLowerCase();
    const passwordMatches = input.password === this.currentPassword;
    if (!emailMatches || !passwordMatches) {
      throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    return this.issueSession();
  }

  async refresh(refreshToken: string): Promise<Session> {
    await this.guard();

    if (!refreshToken || refreshToken !== this.currentRefreshToken) {
      throw new ApiError('SESSION_EXPIRED', 'Your session has expired. Please log in again.');
    }

    return this.issueSession();
  }

  async stepUp(input: StepUpInput): Promise<StepUpResult> {
    await this.guard();

    if (input.password !== this.currentPassword) {
      throw new ApiError('STEP_UP_FAILED', 'We could not verify it’s you. Please try again.');
    }

    const revealToken = randomToken('reveal');
    const expiresAt = Date.now() + REVEAL_TOKEN_TTL_MS;
    this.revealTokens.set(revealToken, expiresAt);
    return { revealToken, expiresIn: REVEAL_TOKEN_TTL_MS / 1000 };
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await this.guard();

    if (input.current !== this.currentPassword) {
      throw new ApiError('WRONG_CURRENT_PASSWORD', 'Your current password is incorrect.');
    }
    if (!isValidPassword(input.next)) {
      throw new ApiError('WEAK_PASSWORD', 'Password must be at least 8 characters.');
    }

    this.currentPassword = input.next;
  }

  async getMe(): Promise<User> {
    await this.guard();
    return { ...this.user };
  }

  async getCards(): Promise<Card[]> {
    await this.guard();
    return [this.effectiveCard()];
  }

  async getCard(cardId: string): Promise<Card> {
    await this.guard();
    if (cardId !== this.card.id) {
      throw new ApiError('NOT_FOUND', 'Card not found.');
    }
    return this.effectiveCard();
  }

  async getBalance(): Promise<Balance> {
    await this.guard();
    return {
      cardId: this.card.id,
      available: this.balanceAvailable,
      currency: this.card.currency,
      asOf: new Date().toISOString(),
    };
  }

  async getSensitive(cardId: string, revealToken: string): Promise<SensitiveCard> {
    await this.guard();

    if (cardId !== this.card.id) {
      throw new ApiError('NOT_FOUND', 'Card not found.');
    }

    const expiresAt = this.revealTokens.get(revealToken);
    if (!expiresAt || Date.now() > expiresAt) {
      this.revealTokens.delete(revealToken);
      throw new ApiError('REVEAL_TOKEN_EXPIRED', 'This reveal session has expired. Verify it’s you again to view the card number.');
    }

    // SECURITY: computed on demand, returned once, never assigned to a
    // field on `this` — nothing sensitive persists past this call frame.
    return deriveSensitiveCard(this.effectiveCard());
  }

  async blockCard(cardId: string): Promise<Card> {
    await this.guard();
    if (cardId !== this.card.id) {
      throw new ApiError('NOT_FOUND', 'Card not found.');
    }
    this.card = { ...this.card, status: 'BLOCKED' };
    return this.effectiveCard();
  }

  async unblockCard(cardId: string): Promise<Card> {
    await this.guard();
    if (cardId !== this.card.id) {
      throw new ApiError('NOT_FOUND', 'Card not found.');
    }
    this.card = { ...this.card, status: 'ACTIVE' };
    return this.effectiveCard();
  }

  async getTransactions(q?: GetTransactionsQuery): Promise<Page<Transaction>> {
    await this.guard();
    const scenarios = getScenarios();

    if (scenarios.forceEmpty) {
      return { items: [], nextCursor: null };
    }

    let filtered = this.transactions;
    if (q?.from) {
      const fromMs = new Date(q.from).getTime();
      filtered = filtered.filter((t) => new Date(t.createdAt).getTime() >= fromMs);
    }
    if (q?.to) {
      // Treat `to` as inclusive of the whole day when given a bare date.
      const toMs = new Date(q.to).getTime() + (isDateOnly(q.to) ? 24 * 60 * 60 * 1000 - 1 : 0);
      filtered = filtered.filter((t) => new Date(t.createdAt).getTime() <= toMs);
    }

    const startIndex = decodeCursor(q?.cursor);
    const page = filtered.slice(startIndex, startIndex + PAGE_SIZE);
    const nextIndex = startIndex + PAGE_SIZE;
    const nextCursor = nextIndex < filtered.length ? encodeCursor(nextIndex) : null;

    return { items: page, nextCursor };
  }
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function encodeCursor(index: number): string {
  return `c_${index}`;
}

function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  const match = /^c_(\d+)$/.exec(cursor);
  if (!match) return 0;
  return Number(match[1]);
}

export const mockApi: Api = new MockApi();
