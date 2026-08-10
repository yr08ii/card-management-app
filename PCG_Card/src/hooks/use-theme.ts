/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { createElement, createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { Colors, type ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeOverrideContextValue = {
  /** `null` means "follow the OS setting". */
  override: ThemeMode | null;
  setOverride: (mode: ThemeMode | null) => void;
};

const ThemeOverrideContext = createContext<ThemeOverrideContextValue>({
  override: null,
  setOverride: () => {},
});

/**
 * Lets a subtree force light or dark mode regardless of the OS setting —
 * used by the dev-only component gallery so both themes can be reviewed
 * without changing the simulator/device setting. Everywhere else in the app
 * simply omits this provider and `useTheme()` follows the OS scheme.
 */
export function ThemeOverrideProvider({ children }: PropsWithChildren) {
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);

  return createElement(ThemeOverrideContext.Provider, { value }, children);
}

/** Read/write the current theme override — used by the gallery's theme toggle. */
export function useThemeOverride() {
  return useContext(ThemeOverrideContext);
}

export function useThemeMode(): ThemeMode {
  const scheme = useColorScheme();
  const { override } = useContext(ThemeOverrideContext);

  if (override) return override;
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const mode = useThemeMode();
  return Colors[mode];
}
