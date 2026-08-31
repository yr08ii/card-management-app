/**
 * Deterministic seeded fixture data for the mock `Api` (design spec §3.2):
 * exactly one user, one VIRTUAL card, and ~60 transactions spread over the
 * last 90 days.
 *
 * "Deterministic" here means the *shape* of the generated data — which
 * merchant, amount, category, status, and direction each of the 60
 * transactions gets, and how many days ago each one landed — is produced by
 * a tiny seeded PRNG (no dependency) and is therefore identical on every
 * run. Absolute calendar timestamps are computed relative to `Date.now()`
 * at import time so the date-range filter and "last 30 days" default
 * window (PRD F7/AC2) always have something real to filter against,
 * whichever day the app happens to run.
 *
 * SECURITY (PRD §9.3): this module intentionally does NOT export a
 * ready-made `SensitiveCard`. `deriveSensitiveCard()` computes PAN/CVV
 * on demand from the seed so mock/index.ts can hand it out per-call
 * without a plaintext PAN/CVV constant sitting in module scope waiting to
 * be logged or serialized by accident.
 */

import type {
  Card,
  Transaction,
  TransactionCategory,
  TransactionDirection,
  TransactionStatus,
  User,
  SensitiveCard,
} from '../types';

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — no dependency, deterministic given a seed.
// ---------------------------------------------------------------------------

export type Prng = () => number;

export function createPrng(seed: number): Prng {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max]. */
function randInt(prng: Prng, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min;
}

/** Pick a random element from a non-empty array. */
function pick<T>(prng: Prng, items: readonly T[]): T {
  return items[Math.floor(prng() * items.length)]!;
}

/** Root seed for the whole fixture set. Change to reshuffle deterministically. */
const ROOT_SEED = 20260713;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const seedUser: User = {
  id: 'usr_a1b2c3',
  email: 'jordan.reyes@example.com',
  displayName: 'Jordan Reyes',
  createdAt: '2026-04-02T09:15:00.000Z',
};

/**
 * Mock-only credential for the single seeded user. This is NOT a security
 * mechanism — it exists purely so the mock's `login`/`stepUp` methods have
 * something deterministic to check. Never used outside mock/.
 */
export const MOCK_PASSWORD = 'CardholderPass1!';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export const seedCard: Card = {
  id: 'card_9f8e7d',
  last4: '4242',
  cardholderName: 'Jordan Reyes',
  expiryMonth: 11,
  expiryYear: 2029,
  brand: 'VISA',
  type: 'VIRTUAL',
  status: 'ACTIVE',
  transactionLimit: 500000, // $5,000.00, minor units
  currency: 'USD',
  validFrom: '2026-04-05',
  validUntil: '2029-11-30',
};

export const seedBalanceAvailable = 128034; // $1,280.34, minor units

/**
 * Derives full PAN/CVV for `seedCard` on demand from the fixed seed, so the
 * value is deterministic across runs without ever being stored as a
 * standing exported constant. Callers (mock/index.ts) must hold the result
 * in memory only.
 */
export function deriveSensitiveCard(card: Card): SensitiveCard {
  const prng = createPrng(ROOT_SEED ^ hashString(card.id));
  // 16-digit Visa-shaped PAN: leading "4" + 11 random digits + the card's last4.
  const middle11 = Array.from({ length: 11 }, () => randInt(prng, 0, 9)).join('');
  const pan = `4${middle11}${card.last4}`;
  const cvv = Array.from({ length: 3 }, () => randInt(prng, 0, 9)).join('');
  return {
    id: card.id,
    pan,
    cvv,
    cardholderName: card.cardholderName,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

const MERCHANTS: ReadonlyArray<{ name: string; category: TransactionCategory }> = [
  { name: 'Trader Joe\'s', category: 'GROCERIES' },
  { name: 'Whole Foods Market', category: 'GROCERIES' },
  { name: 'Kroger', category: 'GROCERIES' },
  { name: 'Blue Bottle Coffee', category: 'DINING' },
  { name: 'Chipotle Mexican Grill', category: 'DINING' },
  { name: 'The Corner Bistro', category: 'DINING' },
  { name: 'Sushi Nakazawa', category: 'DINING' },
  { name: 'Uber', category: 'TRANSPORT' },
  { name: 'Lyft', category: 'TRANSPORT' },
  { name: 'Shell Gas Station', category: 'TRANSPORT' },
  { name: 'Metro Transit', category: 'TRANSPORT' },
  { name: 'Amazon.com', category: 'SHOPPING' },
  { name: 'Target', category: 'SHOPPING' },
  { name: 'Best Buy', category: 'SHOPPING' },
  { name: 'Zara', category: 'SHOPPING' },
  { name: 'Netflix', category: 'ENTERTAINMENT' },
  { name: 'Spotify', category: 'ENTERTAINMENT' },
  { name: 'AMC Theatres', category: 'ENTERTAINMENT' },
  { name: 'Steam', category: 'ENTERTAINMENT' },
  { name: 'City Water & Power', category: 'UTILITIES' },
  { name: 'Comcast Xfinity', category: 'UTILITIES' },
  { name: 'Verizon Wireless', category: 'UTILITIES' },
  { name: 'Delta Air Lines', category: 'TRAVEL' },
  { name: 'Marriott Hotels', category: 'TRAVEL' },
  { name: 'Airbnb', category: 'TRAVEL' },
  { name: 'CVS Pharmacy', category: 'HEALTH' },
  { name: 'Walgreens', category: 'HEALTH' },
  { name: 'Peloton', category: 'HEALTH' },
  { name: 'Paycheck Deposit', category: 'OTHER' },
  { name: 'Refund — Zara', category: 'OTHER' },
];

const TRANSACTION_COUNT = 60;

function buildTransactions(cardId: string, nowMs: number): Transaction[] {
  const prng = createPrng(ROOT_SEED ^ hashString(cardId));
  const items: Transaction[] = [];

  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const statusRoll = prng();
    const status: TransactionStatus =
      statusRoll < 0.08 ? 'DECLINED' : statusRoll < 0.17 ? 'PENDING' : 'SETTLED';

    // PENDING transactions are recent (they haven't had time to settle yet);
    // everything else is spread across the full 90-day window.
    const offsetDays = status === 'PENDING' ? randInt(prng, 0, 2) : randInt(prng, 0, 89);
    const offsetMinutes = randInt(prng, 0, 23 * 60 + 59);
    const createdAtMs = nowMs - offsetDays * 24 * 60 * 60 * 1000 - offsetMinutes * 60 * 1000;

    const isCredit = prng() < 0.1;
    const direction: TransactionDirection = isCredit ? 'CREDIT' : 'DEBIT';
    const merchant = isCredit
      ? pick(prng, MERCHANTS.filter((m) => m.category === 'OTHER'))
      : pick(prng, MERCHANTS.filter((m) => m.category !== 'OTHER'));

    const amount = isCredit ? randInt(prng, 1500, 250000) : randInt(prng, 350, 42000);

    const authorizedAt =
      status === 'PENDING' ? null : new Date(createdAtMs + randInt(prng, 5, 600) * 1000).toISOString();

    items.push({
      id: `txn_${String(i + 1).padStart(4, '0')}`,
      cardId,
      merchant: merchant.name,
      description: `${merchant.name} · ${direction === 'CREDIT' ? 'Credit' : 'Purchase'}`,
      amount,
      currency: 'USD',
      direction,
      status,
      category: merchant.category,
      createdAt: new Date(createdAtMs).toISOString(),
      authorizedAt,
      authorization:
        status === 'DECLINED'
          ? null
          : {
              authorizationCode: hashString(`${cardId}:${i}`).toString(16).slice(0, 6).toUpperCase(),
              mcc: String(randInt(prng, 5000, 5999)),
            },
    });
  }

  // Reverse-chronological, matching PRD F7/AC1.
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

/**
 * Builds the ~60-transaction fixture list for a given card, anchored to the
 * moment this is called. Called once at mock-`Api` construction time so a
 * single session sees a stable list.
 */
export function buildSeedTransactions(cardId: string = seedCard.id, now: Date = new Date()): Transaction[] {
  return buildTransactions(cardId, now.getTime());
}
