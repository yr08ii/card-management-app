/**
 * Service layer entry point (design spec §3.2).
 *
 * Screens import from '@/services' and never reach into './mock' or
 * './http' directly — that keeps the real-API swap a one-line change here
 * instead of a find-and-replace across the app.
 */

import { httpApi } from './http';
import { mockApi } from './mock';
import type { Api } from './api';

/**
 * Flips between the mock and real backends. Reads `EXPO_PUBLIC_USE_MOCKS`
 * (inlined by Expo's env support, no import required) so it can be
 * overridden per-environment without touching source; defaults to mocks
 * since there is no backend integration in this phase (design spec §5).
 */
export const USE_MOCKS: boolean = process.env.EXPO_PUBLIC_USE_MOCKS !== 'false';

export const api: Api = USE_MOCKS ? mockApi : httpApi;

export type { Api } from './api';
export type {
  AcceptInviteInput,
  ChangePasswordInput,
  GetTransactionsQuery,
  LoginInput,
  StepUpInput,
  StepUpResult,
} from './api';
export type {
  Balance,
  Card,
  CardBrand,
  CardStatus,
  CardType,
  CurrencyCode,
  IsoDate,
  IsoDateTime,
  Page,
  Session,
  SensitiveCard,
  Transaction,
  TransactionAuthorization,
  TransactionCategory,
  TransactionDirection,
  TransactionStatus,
  User,
  ApiErrorCode,
} from './types';
export { ApiError } from './types';

export {
  defaultScenarios,
  getScenario,
  getScenarios,
  resetScenarios,
  setScenario,
  setScenarios,
  subscribeScenarios,
} from './mock/scenarios';
export type { Scenarios } from './mock/scenarios';
