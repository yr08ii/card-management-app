/** S15 — Settings (design spec §3.1, PRD F9). */

import { RouteStub } from '@/components/route-stub';
import { useAppLock } from '@/providers/app-lock-provider';

export default function SettingsScreen() {
  const { biometricsEnabled, biometricsAvailable } = useAppLock();

  return <RouteStub name="S15 — Settings" debug={{ biometricsEnabled, biometricsAvailable }} />;
}
