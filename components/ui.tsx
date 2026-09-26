// Building blocks for the auth screens: heading, back button, field, buttons, notes, chips, checkbox.
// Animations use only opacity and transform, so they run on the native thread.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/theme';
import { radius, size, type as T, font } from '@/theme/tokens';
import { Glass } from '@/components/glass';
import { useLang } from '@/theme/i18n';
import { FadeIn, useFade, usePop, usePressScale, useShake } from '@/components/motion';

export function Heading({
  title,
  sub,
  eyebrow,
}: {
  title: string;
  sub?: string;
  /** A short step label above the title, e.g. "STEP 2 OF 3". */
  eyebrow?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {eyebrow ? (
        <View style={styles.eyebrowRow}>
          <View style={[styles.eyebrowBar, { backgroundColor: c.primary }]} />
          <Text style={[T.label, { color: c.primary }]}>{eyebrow}</Text>
        </View>
      ) : null}
      <Text style={[T.h2, { color: c.text }]}>{title}</Text>
      {sub ? <Text style={[T.sub, { color: c.muted, maxWidth: 310 }]}>{sub}</Text> : null}
    </View>
  );
}

export function BackButton({
  onPress,
  label,
  /** Show the word beside the chevron. */
  showLabel = false,
}: {
  onPress: () => void;
  label: string;
  showLabel?: boolean;
}) {
  const { c, isDark } = useTheme();

  const press = usePressScale(0.92);
  const [down, setDown] = useState(false);
  const lit = useFade(down, 120);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      onPressIn={() => {
        setDown(true);
        press.onPressIn();
      }}
      onPressOut={() => {
        setDown(false);
        press.onPressOut();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={{ alignSelf: 'flex-start' }}
    >
      <Animated.View
        style={[
          styles.back,
          showLabel ? styles.backWide : null,
          { borderColor: c.border, backgroundColor: c.surface },
          press.style,
          // Shadow in light mode on iOS only.
          !isDark && Platform.OS === 'ios' ? styles.backLift : null,
          !isDark && Platform.OS === 'android' ? { elevation: 1 } : null,
        ]}
      >
        {/* Pressed state, faded in over the resting one. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.ring,
            { borderColor: c.primary, backgroundColor: c.bg, opacity: lit },
          ]}
        />

        <View>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5 L8 12 L15 19"
              stroke={c.text}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lit }]}>
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 5 L8 12 L15 19"
                stroke={c.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>

        {showLabel ? (
          <View style={{ marginLeft: 2 }}>
            <Text style={[T.button, { color: c.text }]}>{label}</Text>
            <Animated.Text style={[T.button, StyleSheet.absoluteFill, { color: c.primary, opacity: lit }]}>
              {label}
            </Animated.Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  /** Renders the show/hide toggle and starts obscured. */
  secure?: boolean;
  /** Red ring with no words — for a local state like "these do not match". */
  error?: boolean;
  /** Red ring and this message beneath. */
  errorText?: string;
};

/** Labelled text input with focus and error rings; secure adds a show/hide toggle. */
export function Field({
  label,
  secure,
  error,
  errorText,
  style,
  onFocus,
  onBlur,
  ...rest
}: FieldProps) {
  const { c } = useTheme();
  const { t } = useLang();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  const bad = Boolean(error) || Boolean(errorText);

  // Focus and error rings fade in over the resting border.
  const focusRing = useFade(focused && !bad, 150);
  const errorRing = useFade(bad, 150);

  // Shakes once when an error appears.
  const { shake, style: shakeStyle } = useShake();
  const wasBad = useRef(bad);
  useEffect(() => {
    if (bad && !wasBad.current) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    wasBad.current = bad;
  }, [bad, shake]);

  return (
    <Animated.View style={[{ gap: 8 }, shakeStyle]}>
      <View style={styles.labelRow}>
        <View>
          <Text style={[T.label, { color: c.faint }]}>{label}</Text>
          <Animated.Text
            style={[T.label, StyleSheet.absoluteFill, { color: c.primary, opacity: focusRing }]}
          >
            {label}
          </Animated.Text>
          <Animated.Text
            style={[T.label, StyleSheet.absoluteFill, { color: c.danger, opacity: errorRing }]}
          >
            {label}
          </Animated.Text>
        </View>

        {secure ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.show : t.hide}
            hitSlop={12}
          >
            <Text style={[T.label, { color: c.primary }]}>{hidden ? t.show : t.hide}</Text>
          </Pressable>
        ) : null}
      </View>

      <View>
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          secureTextEntry={secure ? hidden : false}
          placeholderTextColor={c.placeholder}
          style={[
            styles.input,
            T.input,
            { color: c.text, backgroundColor: c.field, borderColor: c.border },
            style,
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.fieldRing,
            { borderColor: c.primary, opacity: focusRing },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.fieldRing,
            { borderColor: c.danger, opacity: errorRing },
          ]}
        />
      </View>

      {errorText ? (
        <FadeIn from={-5} duration={200}>
          <Text accessibilityLiveRegion="polite" style={[T.fine, { color: c.danger }]}>
            {errorText}
          </Text>
        </FadeIn>
      ) : null}
    </Animated.View>
  );
}

/** Main action button; shows a spinner while busy. */
export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const off = disabled || busy;

  const press = usePressScale(0.97);
  const [down, setDown] = useState(false);
  const pressed = useFade(down && !off, 110);

  const live = useFade(!off, 180);
  const spinner = useFade(!!busy, 140);
  const word = useFade(!busy, 140);

  return (
    <Animated.View
      style={[
        press.style,
        { opacity: live.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={off}
        onPressIn={() => {
          setDown(true);
          press.onPressIn();
        }}
        onPressOut={() => {
          setDown(false);
          press.onPressOut();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!off, busy: !!busy }}
        style={[styles.control, styles.clip, { backgroundColor: c.primary }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: c.primaryPress, opacity: pressed }]}
        />

        {/* Label and spinner cross-fade. */}
        <Animated.Text style={[T.button, { color: c.onPrimary, opacity: word }]}>
          {label}
        </Animated.Text>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.centre, { opacity: spinner }]}
        >
          <ActivityIndicator color={c.onPrimary} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Secondary button. */
export function QuietButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  const press = usePressScale(0.97);
  const [down, setDown] = useState(false);
  const lit = useFade(down, 110);

  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          setDown(true);
          press.onPressIn();
        }}
        onPressOut={() => {
          setDown(false);
          press.onPressOut();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.control,
          { borderWidth: 1, borderColor: c.border, backgroundColor: 'transparent' },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.quietRing,
            { borderColor: c.primary, opacity: lit },
          ]}
        />
        <Text style={[T.button, { color: c.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Text-only button. */
export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  const press = usePressScale(0.94);
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        hitSlop={10}
      >
        <Text style={[T.button, { color: c.primary }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** An error message box. */
export function ErrorNote({ message }: { message: string }) {
  const { c } = useTheme();
  if (!message) return null;
  return (
    <FadeIn from={-6} duration={220}>
      <View
        accessibilityLiveRegion="polite"
        style={[styles.note, { backgroundColor: c.dangerBg }]}
      >
        <View style={[styles.noteEdge, { backgroundColor: c.danger }]} />
        <Text style={[T.body, { color: c.danger }]}>{message}</Text>
      </View>
    </FadeIn>
  );
}

/** A neutral message box. */
export function InfoNote({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Glass style={styles.note}>
      <Text style={[T.fine, { color: c.muted }]}>{children}</Text>
    </Glass>
  );
}

export function Footnote({
  plain,
  link,
  onPress,
}: {
  plain: string;
  link: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.footnote}>
      <Text style={[T.body, { color: c.muted }]}>{plain} </Text>
      <LinkText label={link} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    minWidth: size.tap,
    height: size.tap,
    borderWidth: 1,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backWide: { paddingRight: 16, gap: 2 },
  backLift: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  ring: { borderWidth: 1, borderRadius: radius.chip },
  quietRing: { borderWidth: 1, borderRadius: radius.button },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowBar: { width: 18, height: 3, borderRadius: 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    height: size.field,
    borderWidth: 1,
    borderRadius: radius.field,
    paddingHorizontal: 16,
  },
  fieldRing: { borderWidth: 2, borderRadius: radius.field },
  control: {
    height: size.control,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clip: { overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  note: { borderRadius: radius.card, padding: 14, paddingLeft: 18, overflow: 'hidden' },
  noteEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: size.tap,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipFill: { borderWidth: 1, borderRadius: radius.chip },
  chipLabel: { paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderWidth: 1.5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFill: { borderWidth: 1.5, borderRadius: 7 },
  footnote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});

export type Choice<T extends string> = { value: T; label: string };

/** A single-select row of chips. */
export function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: readonly Choice<T>[];
  value: T | null;
  onChange: (next: T) => void;
  hint?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[T.label, { color: c.faint }]}>{label}</Text>

      <View style={styles.chipRow}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            on={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>

      {hint ? <Text style={[T.fine, { color: c.faint }]}>{hint}</Text> : null}
    </View>
  );
}

// One chip; a separate component so each has its own animated value.
function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const fill = useFade(on, 180);
  const press = usePressScale(0.95);

  return (
    <Animated.View style={[{ flex: 1 }, press.style]}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={label}
        style={[styles.chip, { backgroundColor: c.field, borderColor: c.border }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.chipFill,
            { backgroundColor: c.primary, borderColor: c.primary, opacity: fill },
          ]}
        />

        <Text
          numberOfLines={1}
          style={[T.body, { color: c.text, fontFamily: font.bodySemi }]}
        >
          {label}
        </Text>

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.chipLabel, { opacity: fill }]}
        >
          <Text
            numberOfLines={1}
            style={[T.body, { color: c.onPrimary, fontFamily: font.bodySemi }]}
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** A checkbox row. Children are the label. */
export function CheckRow({
  checked,
  onToggle,
  children,
  accessibilityLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
}) {
  const { c } = useTheme();
  const fill = useFade(checked, 150);
  const tick = usePop(checked);
  const press = usePressScale(0.88);

  return (
    <View style={styles.checkRow}>
      <Animated.View style={press.style}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onToggle();
          }}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={accessibilityLabel}
          hitSlop={10}
          style={[styles.box, { backgroundColor: c.field, borderColor: c.borderStrong }]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.boxFill,
              { backgroundColor: c.primary, borderColor: c.primary, opacity: fill },
            ]}
          />

          <Animated.View style={tick}>
            <View
              style={{
                width: 6,
                height: 11,
                borderRightWidth: 2,
                borderBottomWidth: 2,
                borderColor: c.onPrimary,
                marginTop: -2,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
