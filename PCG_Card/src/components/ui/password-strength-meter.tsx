import { StyleSheet, View } from 'react-native';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Text } from './text';

export type PasswordStrengthMeterProps = {
  password: string;
};

type Strength = {
  /** 0–4 segments filled. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: ThemeColor;
};

const MIN_LENGTH = 8;

/**
 * Scores a password on length + character-class variety. Minimum viable
 * password is 8 characters (score 1); each additional character class
 * (upper, lower, digit, symbol) and extra length pushes the score up.
 */
export function scorePassword(password: string): Strength {
  if (password.length < MIN_LENGTH) {
    return { score: 0, label: password.length === 0 ? 'Enter a password' : 'Too short', color: 'inkSubtle' };
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  const lengthBonus = password.length >= 12 ? 1 : 0;

  const raw = classes + lengthBonus; // 1..5
  const score = Math.min(4, Math.max(1, raw - 1)) as 1 | 2 | 3 | 4;

  if (score <= 1) return { score, label: 'Weak', color: 'danger' };
  if (score === 2) return { score, label: 'Fair', color: 'warning' };
  if (score === 3) return { score, label: 'Good', color: 'accent' };
  return { score, label: 'Strong', color: 'success' };
}

/** 4-segment strength bar + label, driven by `scorePassword`. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const theme = useTheme();
  const strength = scorePassword(password);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Password strength: ${strength.label}`}>
      <View style={styles.segments}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < strength.score ? theme[strength.color] : theme.border },
            ]}
          />
        ))}
      </View>
      <Text variant="caption" color={strength.color} style={styles.label}>
        {strength.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  segments: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.sm,
  },
  label: {
    marginTop: Spacing.xs,
  },
});
