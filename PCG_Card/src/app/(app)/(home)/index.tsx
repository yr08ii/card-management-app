/** S7 — Home / Card overview (design spec §3.1, PRD F3/AC1). */

import { RouteStub } from '@/components/route-stub';
import { useAuth } from '@/providers/auth-provider';

// Matches `seedCard.id` in `src/services/mock/fixtures.ts` — only used here
// so the stub nav link below has somewhere real to go; the real screen
// gets this from `api.getCards()`, not a hardcoded id.
const DEMO_CARD_ID = 'card_9f8e7d';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <RouteStub
      name="S7 — Home / Card overview"
      debug={{ email: user?.email ?? null }}
      links={[{ label: 'Card details', href: `/(app)/(home)/card/${DEMO_CARD_ID}` }]}
    />
  );
}
