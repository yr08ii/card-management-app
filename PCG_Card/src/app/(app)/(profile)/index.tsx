/** S13 — Profile (design spec §3.1, PRD F8/AC1). */

import { RouteStub } from '@/components/route-stub';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <RouteStub
      name="S13 — Profile"
      debug={{ displayName: user?.displayName ?? null, email: user?.email ?? null }}
      links={[
        { label: 'Change password', href: '/(app)/(profile)/change-password' },
        { label: 'Settings', href: '/(app)/(profile)/settings' },
      ]}
    />
  );
}
