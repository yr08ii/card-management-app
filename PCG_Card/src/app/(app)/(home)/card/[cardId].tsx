/** S8 — Card details (design spec §3.1, PRD F4/AC1). Masked metadata only — no PAN/CVV here (F4/AC2). */

import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function CardDetailsScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();

  return (
    <RouteStub
      name="S8 — Card details"
      params={{ cardId }}
      links={[{ label: 'Reveal PAN/CVV', href: `/(app)/(home)/card/${cardId}/reveal` }]}
    />
  );
}
