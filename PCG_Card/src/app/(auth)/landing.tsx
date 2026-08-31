/** S2 — Sign-in landing (design spec §3.1, PRD §7). */

import { RouteStub } from '@/components/route-stub';

export default function LandingScreen() {
  return (
    <RouteStub
      name="S2 — Sign-in landing"
      links={[
        { label: 'Log in', href: '/(auth)/login' },
        { label: 'Activate invite', href: '/(auth)/invite' },
      ]}
    />
  );
}
