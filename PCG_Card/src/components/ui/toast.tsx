import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

export type ToastVariant = 'default' | 'success' | 'danger';

type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_COLOR: Record<ToastVariant, ThemeColor> = {
  default: 'accent',
  success: 'success',
  danger: 'danger',
};

const DEFAULT_DURATION_MS = 3000;

/**
 * Mount once near the root. Screens call `useToast().show(message)` — no
 * need to render `<Toast>` themselves.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant = 'default') => {
    if (timer.current) clearTimeout(timer.current);
    const id = nextId.current++;
    setToast({ id, message, variant });
    timer.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, DEFAULT_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() must be called within a <ToastProvider>');
  }
  return ctx;
}

export type ToastProps = {
  message: string;
  variant?: ToastVariant;
};

/** Presentational toast — normally rendered by `ToastProvider`, not directly. */
export function Toast({ message, variant = 'default' }: ToastProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + Spacing.lg }]}>
      <Animated.View
        entering={FadeInDown.duration(180)}
        exiting={FadeOutDown.duration(150)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.toast, { backgroundColor: theme.ink }]}>
        <View style={[styles.dot, { backgroundColor: theme[VARIANT_COLOR[variant]] }]} />
        <Text variant="subhead" style={{ color: theme.bg }}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 480,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
