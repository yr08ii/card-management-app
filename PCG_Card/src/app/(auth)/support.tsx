/**
 * "Trouble signing in?" support screen (design spec §3.1). PRD §9's known
 * gap: MVP has no self-service password reset, so this is where "Trouble
 * signing in?" routes instead (F1/AC2).
 */

import { RouteStub } from '@/components/route-stub';

export default function SupportScreen() {
  return <RouteStub name="Support — Trouble signing in?" />;
}
