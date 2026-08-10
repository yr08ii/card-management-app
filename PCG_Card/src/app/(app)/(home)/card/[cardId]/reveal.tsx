/**
 * S9 — Reveal PAN/CVV (design spec §3.1, PRD F5). Fullscreen modal,
 * screenshot/recording blocked once the real screen lands (F5/AC4 —
 * `expo-screen-capture`, not wired in this stub). No PAN/CVV value may ever
 * reach this file, even in a later phase's implementation, except held in
 * local component state (F5/AC5).
 */

import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function RevealScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();

  return <RouteStub name="S9 — Reveal PAN/CVV" params={{ cardId }} />;
}
