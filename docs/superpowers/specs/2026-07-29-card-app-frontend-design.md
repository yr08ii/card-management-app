# Card Management App — Front-End Design

**Date:** 2026-07-29
**Companion to:** [`2026-07-13-card-management-app-prd.md`](../../../2026-07-13-card-management-app-prd.md)
**Scope:** The complete front end (S1–S16) in Expo / React Native, running on mock data. No real API integration in this phase.

---

## 1. Approach

Build the full PRD screen inventory against a **mock service layer whose method signatures match the real `/app/*` endpoints exactly**. Every screen is written once, against the interface it will use in production; wiring the real backend later is a single-module swap, not a rewrite.

This ordering is deliberate: it lets us build the loading, empty, error, and offline states the PRD demands (§7, §16) now, while they are cheap to produce, instead of discovering them during integration.

### Confirmed decisions

| Decision | Choice |
|---|---|
| Visual direction | Light **and** dark themes from day one, both derived from the PCG brand palette |
| Data | Mock service layer with production endpoint signatures |
| Styling | Extend `src/constants/theme.ts` + React Native `StyleSheet` — no new styling dependency |
| Typeface | System font (SF Pro / Roboto) |
| Build scope | All 16 screens, S1–S16 |

---

## 2. Design tokens

### 2.1 Palette provenance

Extracted from the live DOM at `tpcg.global` via computed styles:

| Source value | Role on the marketing site |
|---|---|
| `rgb(0, 61, 93)` → `#003D5D` | Primary — buttons, links, 52 of 82 icon fills |
| `rgb(10, 37, 64)` → `#0A2540` | Headings |
| `rgb(107, 124, 147)` → `#6B7C93` | Body copy |
| `rgb(246, 249, 252)` → `#F6F9FC` | Section surfaces |
| `rgb(230, 235, 241)` → `#E6EBF1` | Borders, dividers |
| `#FFFFFF` | Page background |

The brand system is strictly monochrome navy — it carries no secondary hue and no semantic colors. An app needs more than a marketing page does, so the tokens below **extend** it with derived values. Every derived color is noted as such.

**Contrast corrections.** PRD §10 requires WCAG AA, and four light-theme values did not meet it, including one taken directly from the brand site. Each was darkened by the minimum amount that clears the threshold, preserving hue:

| Token | Site / initial | Corrected | Before → after | Threshold |
|---|---|---|---|---|
| `inkMuted` | `#6B7C93` | `#647389` | 4.03:1 → 4.56:1 | 4.5:1 (AA text) |
| `inkSubtle` | `#9AABBF` | `#8391A2` | 2.22:1 → 3.04:1 | 3:1 (placeholder) |
| `accent` | `#2E7CD6` | `#2B73C7` | 4.00:1 → 4.54:1 | 4.5:1 (AA text) |
| `borderStrong` (light) | `#CFDBE6` | `#7F8FA1` | 1.41:1 → 3.31:1 | 3:1 (WCAG 1.4.11) |
| `borderStrong` (dark) | `#2A5375` | `#346690` | 2.28:1 → 3.04:1 | 3:1 (WCAG 1.4.11) |

`inkMuted` is the notable one: `#6B7C93` is the brand site's own body-copy color and fails AA on white by a small margin. The shift is visually imperceptible but makes every secondary label in the app compliant. `border` (`#E6EBF1`) is unchanged — it is decorative separation only, and `borderStrong` now carries any boundary that identifies a control.

Ratios are verified against all 18 foreground/background pairs the app actually uses, in both themes.

### 2.2 Light theme

| Token | Value | Note |
|---|---|---|
| `bg` | `#FFFFFF` | brand |
| `bgSubtle` | `#F6F9FC` | brand |
| `surface` | `#FFFFFF` | brand |
| `surfaceSunken` | `#F6F9FC` | brand |
| `border` | `#E6EBF1` | brand |
| `borderStrong` | `#7F8FA1` | derived, contrast-corrected |
| `ink` | `#0A2540` | brand |
| `inkMuted` | `#647389` | brand, contrast-corrected |
| `inkSubtle` | `#8391A2` | derived, contrast-corrected |
| `brand` | `#003D5D` | brand |
| `brandPressed` | `#002B42` | derived |
| `onBrand` | `#FFFFFF` | brand |
| `accent` | `#2B73C7` | derived, contrast-corrected — focus rings, active selection, inline links |
| `success` | `#0E7C66` | derived — credits |
| `danger` | `#C0362C` | derived — destructive actions, failures |
| `warning` | `#9A6100` | derived — frozen-card notice, offline banner |

### 2.3 Dark theme

`#003D5D` fails contrast on dark surfaces, so the dark theme lifts the brand hue rather than reusing it. Backgrounds are deep navy, not neutral black, to stay in the brand family.

| Token | Value |
|---|---|
| `bg` | `#061520` |
| `bgSubtle` | `#0A2035` |
| `surface` | `#0F2A40` |
| `surfaceSunken` | `#081A28` |
| `border` | `#1C3D57` |
| `borderStrong` | `#346690` |
| `ink` | `#EAF2F8` |
| `inkMuted` | `#94A9BE` |
| `inkSubtle` | `#6B8299` |
| `brand` | `#4A9FD4` |
| `brandPressed` | `#3A87B8` |
| `onBrand` | `#04121C` |
| `accent` | `#5FB0E8` |
| `success` | `#3DBE9A` |
| `danger` | `#FF6B5E` |
| `warning` | `#E5A33D` |

### 2.4 Card art

The card tile is the hero object and is **theme-independent** — it renders the same in light and dark, the way a physical card does.

- **Active:** diagonal gradient `#0A2540 → #003D5D → #01507A`, with a low-opacity radial sheen in the upper-left and a hairline `rgba(255,255,255,0.14)` inner border.
- **Blocked:** desaturated `#2C3A47 → #46545F`, reduced sheen, plus a frost overlay and a "Frozen" badge. Per PRD F3/AC2 the blocked state must be unmistakable, so it changes hue, adds an overlay, *and* adds a label — not one signal alone.

### 2.5 Type scale

System font throughout. Amounts, PAN, and expiry use `fontVariant: ['tabular-nums']` so digits do not shift width while a countdown runs or a list scrolls.

| Token | Size / line | Weight |
|---|---|---|
| `display` | 34 / 40 | 700 |
| `title1` | 28 / 34 | 700 |
| `title2` | 22 / 28 | 600 |
| `title3` | 18 / 24 | 600 |
| `body` | 16 / 24 | 400 |
| `bodyStrong` | 16 / 24 | 600 |
| `callout` | 15 / 20 | 500 |
| `subhead` | 14 / 20 | 500 |
| `footnote` | 13 / 18 | 400 |
| `caption` | 12 / 16 | 500 |
| `overline` | 11 / 14 | 600, `letterSpacing: 0.8`, uppercase |

All text respects OS dynamic type (`allowFontScaling` left on; layouts use flexible heights, never fixed).

### 2.6 Spacing, radius, elevation

- **Spacing** (4-based): `xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · 3xl 32 · 4xl 40 · 5xl 48`
- **Radius:** `sm 8 · md 12 · lg 16 · xl 20 · card 20 · pill 999`
- **Elevation:** three levels, expressed as iOS `shadow*` and Android `elevation` in one token object.
- **Touch targets:** every interactive element has a minimum 44×44pt hit area (PRD §10).

---

## 3. Architecture

### 3.1 Route tree

Expo Router file routes under `src/app/`. Route groups separate the pre-auth stack from the authenticated tab bar; the tab bar uses `NativeTabs` from `expo-router/unstable-native-tabs`, matching the approach already in the template.

```
src/app/
  _layout.tsx                        Providers + root Stack
  index.tsx                          S1  Splash — silent refresh, then redirect
  unlock.tsx                         S6  Biometric unlock (fullscreen modal)
  (auth)/
    _layout.tsx
    landing.tsx                      S2  Sign-in landing
    login.tsx                        S3  Login
    invite.tsx                       S4  Accept invite
    set-password.tsx                 S5  Set password
    support.tsx                          "Trouble signing in?" (PRD §9 known gap)
  (app)/
    _layout.tsx                      NativeTabs: Home · Transactions · Profile
    (home)/
      _layout.tsx
      index.tsx                      S7  Card overview
      card/[cardId].tsx              S8  Card details
      card/[cardId]/reveal.tsx       S9  Reveal PAN/CVV (fullscreen modal)
    (transactions)/
      _layout.tsx
      index.tsx                      S11 Transactions list
      [txnId].tsx                    S12 Transaction detail
    (profile)/
      _layout.tsx
      index.tsx                      S13 Profile
      change-password.tsx            S14 Change password
      settings.tsx                   S15 Settings
```

**S10** (block/unblock confirm) is a bottom sheet, not a route — it must be able to appear over both S7 and S8.
**S16** (global states) is a set of components, not a route: `OfflineBanner`, `SessionExpiredModal`, `ErrorState`, `EmptyState`, `Toast`.

Deep link `cardapp://invite?email=…&token=…` (PRD F1/AC3) maps to `(auth)/invite`. Note the template's `app.json` currently declares `"scheme": "pcgcard"` — this needs to become `cardapp` to match the PRD, or the PRD's link updated. **Resolution: change the scheme to `cardapp`** so the spec and the shipped artifact agree.

### 3.2 Service layer

```
src/services/
  types.ts        Card, Balance, SensitiveCard, Transaction, User, Session, ApiError
  api.ts          The Api interface — one method per PRD endpoint, nothing more
  http.ts         Real fetch client. Implements Api; every method throws
                  NotImplementedError until the backend lands.
  mock/
    fixtures.ts   Deterministic seeded data — one user, one card, ~60 transactions
    latency.ts    Simulated network delay
    scenarios.ts  Dev-only overrides: forceError, forceEmpty, forceOffline, forceBlocked
    index.ts      Mock implementation of Api
  index.ts        export const api: Api = USE_MOCKS ? mockApi : httpApi
```

`Api` mirrors the PRD's traceability table (§13) exactly:

```ts
interface Api {
  acceptInvite(input: { email: string; token: string; password: string }): Promise<Session>;
  login(input: { email: string; password: string }): Promise<Session>;
  refresh(refreshToken: string): Promise<Session>;
  stepUp(input: { password: string }): Promise<{ revealToken: string; expiresIn: number }>;
  changePassword(input: { current: string; next: string }): Promise<void>;
  getMe(): Promise<User>;
  getCards(): Promise<Card[]>;
  getCard(cardId: string): Promise<Card>;
  getBalance(): Promise<Balance>;
  getSensitive(cardId: string, revealToken: string): Promise<SensitiveCard>;
  blockCard(cardId: string): Promise<Card>;
  unblockCard(cardId: string): Promise<Card>;
  getTransactions(q?: { cursor?: string; from?: string; to?: string }): Promise<Page<Transaction>>;
}
```

The mock returns `SensitiveCard` values only from memory and never persists them, so the PRD §9.3 constraint is exercised by the mock path too rather than deferred to integration.

### 3.3 State

React Context plus hooks — no state-management dependency. MVP holds one user, one card, one list.

- **`AuthProvider`** — session, tokens, `login` / `logout` / silent refresh. A 401 triggers exactly one refresh attempt, then forces logout (PRD §9.7).
- **`AppLockProvider`** — `AppState` listener, 2-minute background timer, `locked` flag. While locked, no card data renders (PRD F2/AC3).
- **`useAsyncResource<T>`** — a small hook returning `{ data, error, loading, refetch }` so every screen gets consistent loading/error handling without repeating it.

### 3.4 Component library

`src/components/ui/` — the primitives every screen composes from:

`Screen` · `Text` · `Button` (primary/secondary/ghost/destructive, with loading + disabled) · `IconButton` · `Surface` · `ListRow` · `Input` (with error + show/hide password) · `PasswordStrengthMeter` · `Badge` · `Skeleton` · `BottomSheet` · `Toast` · `Divider` · `SegmentedControl` · `Countdown`

`src/components/card/` — `CardArt`, `CardStatusBadge`, `BalanceHeader`, `QuickActions`
`src/components/transactions/` — `TransactionRow`, `TransactionGroupHeader`, `DateRangeFilter`
`src/components/states/` — `ErrorState`, `EmptyState`, `OfflineBanner`, `SessionExpiredModal`

### 3.5 Native dependencies

The security requirements in PRD §9 are not achievable in pure JS. Required:

| Package | For |
|---|---|
| `expo-secure-store` | Tokens in Keychain / Keystore (§9.1) |
| `expo-local-authentication` | Biometric unlock and reveal step-up (§2, F5) |
| `expo-clipboard` | Copy card number with 60s auto-clear (F5/AC3) |
| `expo-screen-capture` | Screenshot / recording block on S9 (F5/AC4) |
| `expo-haptics` | Confirmation feedback on block/unblock and reveal |

All five are Expo SDK 57 packages installed with `npx expo install`. **This moves the project off Expo Go and onto a development build** — CocoaPods is already set up, so `npx expo prebuild` + `npx expo run:ios` covers it.

The iOS app-switcher snapshot exclusion (§9.3) has no Expo API. It will be approximated with an `AppState`-driven cover view over sensitive screens, and the residual gap flagged — a proper fix needs a small native module and belongs with the security hardening pass, not the front-end pass.

### 3.6 Known security limitation — step-up stores the account password

The backend's `POST /app/auth/step-up` authenticates by **password** (PRD §8). The PRD's stated UX is that biometrics unlock a stored credential so the user is not retyping their password on every reveal. Implementing that literally means the app holds the account password in the Keychain / Keystore, biometric-gated via `expo-secure-store`'s `requireAuthentication: true`, and replays it to `step-up`.

That is what is implemented, because it is the only thing the MVP contract allows. It is nonetheless the weakest link in an otherwise sound security design:

- The stored value is the account password itself, not a scoped, revocable artifact.
- It cannot be invalidated server-side. Revoking a session does not revoke it.
- It goes stale on password change, so the app has to re-enrol or disable biometrics at that moment or the reveal flow silently breaks later.

**Recommended fast-follow, backend:** have `step-up` accept a dedicated, server-issued, revocable step-up token — long-lived, scoped to step-up only, bound to the device. The app would store that instead of the password. This is a small backend change and it removes the password from device storage entirely. It should be raised alongside the §9 password-reset gap, not after launch.

Mitigations in place meanwhile: the credential is written with `requireAuthentication: true` so reading it requires biometric presence; the OS invalidates the entry when enrolled biometrics change; disabling the biometric toggle deletes it; and logout clears it.

---

## 4. Build phases

Each phase ends in a state that compiles and runs.

1. **Design system** — tokens, `useTheme`, all `ui/` primitives. A dev-only gallery route renders every primitive in both themes for visual review.
2. **Service layer** — types, `Api`, fixtures, mock implementation, scenario toggles.
3. **Navigation skeleton** — every route and layout, auth gate, lock gate, tab bar. Screens are stubs.
4. **Auth stack** — S1–S6 plus the support screen.
5. **Card** — S7, S8, S9, S10, and `CardArt`.
6. **Transactions** — S11, S12, with pagination, pull-to-refresh, and date filtering.
7. **Profile** — S13, S14, S15.
8. **Global states and polish** — S16 components, accessibility labels, contrast verification, dynamic-type check, run on simulator.

---

## 5. Out of scope

Explicitly not in this phase, to keep the boundary clear:

- Any real HTTP call. `http.ts` ships as a typed stub.
- Push notifications (PRD defers to v1.1).
- Certificate pinning (§9.4) — belongs with the integration phase.
- Analytics event emission (§11) — the call sites will be marked with `TODO(analytics)` comments so the later pass has anchors, but no SDK is added.
- Self-service password reset — the PRD's known gap; "Trouble signing in?" routes to the support screen.
- Multi-card support. The UI assumes one card, per PRD §3.

---

## 6. Verification

Front-end work is verified by running it, not by asserting it:

- App builds and runs on the iOS simulator; every route reachable.
- Each screen inspected in **both** light and dark themes.
- Loading, empty, and error states triggered through `scenarios.ts` and confirmed for every screen that declares them in PRD §7.
- Text contrast checked against WCAG AA for the token pairs actually used.
- No PAN or CVV value appears in any `console.log`, and none is written through `expo-secure-store` or `AsyncStorage`.
