import { useEffect, useRef, useState } from 'react';

import type { ThemeColor, TypographyVariant } from '@/constants/theme';

import { Text } from './text';

export type CountdownProps = {
  /** Total seconds to count down from. */
  seconds: number;
  /** Called once, when the countdown reaches zero. */
  onExpire?: () => void;
  variant?: TypographyVariant;
  color?: ThemeColor;
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Ticking countdown timer — used by the PAN reveal screen to show the
 * remaining reveal window. Digits are `tabular` so the layout doesn't jitter
 * every second.
 */
export function Countdown({ seconds, onExpire, variant = 'bodyStrong', color = 'ink' }: CountdownProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // Only (re)start the interval when the countdown target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return (
    <Text
      variant={variant}
      color={color}
      tabular
      accessibilityRole="text"
      accessibilityLabel={`${remaining} seconds remaining`}>
      {formatTime(remaining)}
    </Text>
  );
}
