/** S5 — Set password (design spec §3.1, PRD F1/AC1). */

import { useLocalSearchParams } from 'expo-router';

import { RouteStub } from '@/components/route-stub';

export default function SetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  return <RouteStub name="S5 — Set password" params={params} />;
}
