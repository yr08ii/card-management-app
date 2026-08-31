/**
 * Design tokens for the card-management app.
 *
 * Palette is extracted from the PCG brand marketing site (light) and derived
 * for a dark theme that stays in the brand family (deep navy, not neutral
 * black). See docs/superpowers/specs/2026-07-29-card-app-frontend-design.md
 * §2 for provenance of every value below — do not hand-tune these colors
 * without updating that spec first.
 *
 * There are many other ways to style an app (Nativewind, Tamagui, Unistyles,
 * etc.) — this project extends this token file + React Native `StyleSheet`,
 * per the confirmed decision in the design spec §1.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    bg: '#FFFFFF',
    bgSubtle: '#F6F9FC',
    surface: '#FFFFFF',
    surfaceSunken: '#F6F9FC',
    border: '#E6EBF1',
    // Functional outline (inputs, focus). Darkened from the original #CFDBE6,
    // which sat at 1.41:1 — WCAG 1.4.11 requires 3:1 for UI component boundaries.
    borderStrong: '#7F8FA1',
    ink: '#0A2540',
    // Brand site uses #6B7C93, which is 4.26:1 on white — just under AA.
    // Darkened the minimum amount to clear 4.5:1 on both bg and bgSubtle.
    inkMuted: '#647389',
    // Was #9AABBF (2.35:1). Placeholder text has to stay readable.
    inkSubtle: '#8391A2',
    brand: '#003D5D',
    brandPressed: '#002B42',
    onBrand: '#FFFFFF',
    // Was #2E7CD6 (4.23:1).
    accent: '#2B73C7',
    success: '#0E7C66',
    danger: '#C0362C',
    warning: '#9A6100',
  },
  dark: {
    bg: '#061520',
    bgSubtle: '#0A2035',
    surface: '#0F2A40',
    surfaceSunken: '#081A28',
    border: '#1C3D57',
    // Was #2A5375 (2.28:1). Same WCAG 1.4.11 rule as the light theme.
    borderStrong: '#346690',
    ink: '#EAF2F8',
    inkMuted: '#94A9BE',
    inkSubtle: '#6B8299',
    brand: '#4A9FD4',
    brandPressed: '#3A87B8',
    onBrand: '#04121C',
    accent: '#5FB0E8',
    success: '#3DBE9A',
    danger: '#FF6B5E',
    warning: '#E5A33D',
  },
} as const;

export type ThemeMode = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * The card tile is theme-independent — it renders the same in light and dark
 * mode, the way a physical card does. See design spec §2.4.
 */
export const CardArtColors = {
  active: {
    gradient: ['#0A2540', '#003D5D', '#01507A'] as const,
    innerBorder: 'rgba(255,255,255,0.14)',
  },
  blocked: {
    gradient: ['#2C3A47', '#46545F'] as const,
    innerBorder: 'rgba(255,255,255,0.08)',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

type TypographyToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

/**
 * System font throughout — no custom font dependency. Amounts, PAN, and
 * expiry should additionally set `fontVariant: ['tabular-nums']` (see the
 * `tabular` prop on `<Text>`) so digits do not shift width while a countdown
 * runs or a list scrolls.
 */
export const Typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  title3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TypographyToken>;

export type TypographyVariant = keyof typeof Typography;

/** 4-based spacing scale. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 20,
  pill: 999,
} as const;

type ElevationToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/** Three elevation levels — iOS `shadow*` + Android `elevation` in one object each. */
/**
 * Shadows tint toward the brand ink rather than pure black — a neutral-black
 * shadow reads as dirty against the navy surfaces. Theme-independent.
 */
export const ShadowColor = '#0A2540';

/**
 * Backdrop behind modals and bottom sheets. Theme-independent: a scrim
 * darkens whatever is behind it, so it does not flip with the color scheme.
 * Opacity is applied at the call site.
 */
export const Scrim = '#000000';

/**
 * Opacity the scrim is drawn at. Apply it to a sibling view that sits behind
 * the dialog, never to a parent — a parent with opacity fades its children
 * along with the backdrop.
 */
export const ScrimOpacity = 0.5;

export const Elevation = {
  level1: {
    shadowColor: ShadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: ShadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  level3: {
    shadowColor: ShadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
} satisfies Record<string, ElevationToken>;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
