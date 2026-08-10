import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { IconButton } from './icon-button';
import { Text } from './text';

export type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Error message. When set, the border and message use the `danger` token. */
  error?: string;
  /** Helper text shown when there is no error. */
  helperText?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoFocus?: boolean;
  editable?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Labeled text field with error state and, for `secureTextEntry`, a
 * show/hide toggle. Password-specific keyboard props (`autoComplete`,
 * `textContentType`) pass straight through so iOS/Android password managers
 * behave correctly.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry = false,
  keyboardType,
  autoComplete,
  textContentType,
  autoCapitalize = 'none',
  autoFocus,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  style,
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = secureTextEntry && !revealed;
  const hasError = !!error;

  const borderColor = hasError ? theme.danger : focused ? theme.brand : theme.border;

  return (
    <View style={style}>
      <Text variant="subhead" color={hasError ? 'danger' : 'inkMuted'} style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: editable ? theme.surface : theme.bgSubtle,
          },
        ]}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.inkSubtle}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoFocus={autoFocus}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: theme.ink }]}
        />
        {secureTextEntry ? (
          <IconButton
            icon={{
              ios: revealed ? 'eye.slash' : 'eye',
              android: revealed ? 'visibility_off' : 'visibility',
              web: revealed ? 'visibility_off' : 'visibility',
            }}
            size={18}
            color="inkMuted"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((v) => !v)}
            style={styles.eyeButton}
          />
        ) : null}
      </View>
      {error ? (
        <Text variant="footnote" color="danger" style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="footnote" color="inkMuted" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    marginRight: Spacing.xs,
  },
  helper: {
    marginTop: Spacing.xs,
  },
});
