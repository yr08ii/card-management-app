/** S3 — Login (design spec §3.1, PRD §7). */

import { RouteStub } from '@/components/route-stub';

export default function LoginScreen() {
  return <RouteStub name="S3 — Login" links={[{ label: 'Trouble signing in?', href: '/(auth)/support' }]} />;
}
