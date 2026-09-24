// Building blocks for the in-app screens: sections, rows, avatar, stats, stepper, option list.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Switch,
  StyleSheet,
  Animated,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/glass';
import { useFade, usePop, usePressScale } from '@/components/motion';
import { resolveMedia } from '@/lib/media';
import { useTheme } from '@/theme/theme';
import { radius, size, type as T, font } from '@/theme/tokens';

/** A titled group of rows. */
export function Section({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  return (
    <View style={[{ gap: 10 }, style]}>
      <Text style={[T.label, { color: c.faint, marginLeft: 2 }]}>{title}</Text>
      <Glass style={{ padding: 16 }}>
        <View style={{ gap: 16 }}>{children}</View>
      </Glass>
    </View>
  );
}

/** A label with a value beside it. Read-only — for facts, not fields. */
export function FactRow({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'muted' | 'good' | 'bad';
}) {
  const { c } = useTheme();
  const colour =
    tone === 'good' ? c.success : tone === 'bad' ? c.danger : tone === 'muted' ? c.faint : c.text;

  return (
    <View style={styles.factRow}>
      <Text style={[T.body, { color: c.muted, flexShrink: 0 }]}>{label}</Text>
      <Text
        style={[T.body, { color: colour, fontFamily: font.bodySemi, flex: 1, textAlign: 'right' }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/** A tappable row that goes somewhere. The chevron is drawn, not an icon font. */
export function NavRow({
  label,
  hint,
  value,
  onPress,
  danger = false,
}: {
  label: string;
  hint?: string;
  /** Current value, shown on the right. */
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { c } = useTheme();
  const press = usePressScale(0.985);
  const [down, setDown] = React.useState(false);
  const lit = useFade(down, 110);
  const ink = danger ? c.danger : c.text;

  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
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
        style={styles.navRow}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.navLit, { backgroundColor: c.track, opacity: lit }]}
        />

        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[T.button, { color: ink }]}>{label}</Text>
          {hint ? <Text style={[T.fine, { color: c.faint }]}>{hint}</Text> : null}
        </View>

        {value ? (
          <Text
            style={[T.body, { color: c.muted, maxWidth: 130, textAlign: 'right' }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}

        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 5 L16 12 L9 19"
            stroke={danger ? c.danger : c.faint}
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

/** A labelled on/off row. */
export function SwitchRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[T.button, { color: c.text }]}>{label}</Text>
        {hint ? <Text style={[T.fine, { color: c.faint }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(next) => {
          Haptics.selectionAsync().catch(() => {});
          onChange(next);
        }}
        disabled={disabled}
        trackColor={{ false: c.track, true: c.primary }}
        thumbColor={c.surface}
        ios_backgroundColor={c.track}
      />
    </View>
  );
}

/** The profile photo, or initials when there is none or it fails to load. */
export function Avatar({
  name,
  email,
  photoUrl,
  size: box = 62,
}: {
  name?: string;
  email?: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const { c } = useTheme();
  const [broken, setBroken] = useState(false);

  const uri = broken ? null : resolveMedia(photoUrl);

  // Retry the image when the URL changes.
  useEffect(() => setBroken(false), [photoUrl]);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        onError={() => setBroken(true)}
        accessibilityIgnoresInvertColors
        accessibilityLabel={name || email}
        style={{
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: c.track,
        }}
      />
    );
  }

  const source = (name ?? '').trim() || (email ?? '').trim();
  const initials =
    source
      .split(/[\s.@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?';

  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: box / 2,
        backgroundColor: c.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: font.displayBold, fontSize: box * 0.36, color: c.onPrimary }}>
        {initials}
      </Text>
    </View>
  );
}

/** One number with a caption. */
export function Stat({ value, caption }: { value: string; caption: string }) {
  const { c } = useTheme();
  return (
    <Glass style={styles.stat} radius={radius.chip}>
      <Text style={{ fontFamily: font.displayBold, fontSize: 20, color: c.text }}>{value}</Text>
      <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]} numberOfLines={2}>
        {caption}
      </Text>
    </Glass>
  );
}

/** A small coloured pill — verified / not verified, and the BMI band. */
export function Badge({ text, tone }: { text: string; tone: 'good' | 'bad' | 'neutral' }) {
  const { c } = useTheme();
  const ink = tone === 'good' ? c.success : tone === 'bad' ? c.danger : c.muted;
  const fill = tone === 'good' ? 'transparent' : tone === 'bad' ? c.dangerBg : 'transparent';

  return (
    <View style={[styles.badge, { borderColor: ink, backgroundColor: fill }]}>
      <Text style={[T.fine, { color: ink, fontFamily: font.bodySemi }]}>{text}</Text>
    </View>
  );
}

/** A hairline between rows inside a card. */
export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

const styles = StyleSheet.create({
  factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  navRow: {
    minHeight: size.tap,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    borderRadius: radius.chip,
    overflow: 'hidden',
  },
  navLit: { borderRadius: radius.chip },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: size.tap },
  stat: {
    flex: 1,
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: {
    width: size.tap,
    height: size.tap,
    borderWidth: 1,
    borderRadius: size.tap / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  tickRing: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * A number with minus and plus buttons.
 * Stops at min and max, which match the backend limits.
 */
export function Stepper({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  lessLabel,
  moreLabel,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  /** Accessibility labels for the buttons. */
  lessLabel: string;
  moreLabel: string;
}) {
  const { c } = useTheme();

  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  // Rounded so float steps do not accumulate error.
  const nudge = (by: number) => onChange(Number(clamp(value + by).toFixed(1)));

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={{ gap: 10 }}>
      <Text style={[T.label, { color: c.faint }]}>{label}</Text>

      <View style={styles.stepRow}>
        <StepButton sign="minus" onPress={() => nudge(-step)} disabled={atMin} label={lessLabel} />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: font.displayBold, fontSize: 28, color: c.text }}>
            {value.toLocaleString()}
          </Text>
          {suffix ? <Text style={[T.fine, { color: c.faint }]}>{suffix}</Text> : null}
        </View>

        <StepButton sign="plus" onPress={() => nudge(step)} disabled={atMax} label={moreLabel} />
      </View>

      {hint ? <Text style={[T.fine, { color: c.faint }]}>{hint}</Text> : null}
    </View>
  );
}

/** Round minus/plus button, as used by Stepper. */
export function StepButton({
  sign,
  onPress,
  disabled,
  label,
}: {
  sign: 'minus' | 'plus';
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  const { c } = useTheme();
  const press = usePressScale(0.9);
  const dim = useFade(!disabled, 140);

  return (
    <Animated.View
      style={[press.style, { opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        hitSlop={8}
        style={[styles.stepButton, { borderColor: c.border, backgroundColor: c.field }]}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12 H19" stroke={c.primary} strokeWidth={2.4} strokeLinecap="round" />
          {sign === 'plus' ? (
            <Path d="M12 5 V19" stroke={c.primary} strokeWidth={2.4} strokeLinecap="round" />
          ) : null}
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

/** Single-choice list, one option per row with a tick. */
export function OptionList<V extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: V; label: string; hint?: string }[];
  value: V | null;
  onChange: (next: V) => void;
}) {
  return (
    <View>
      {options.map((option, index) => (
        <React.Fragment key={option.value}>
          {index > 0 ? <Divider /> : null}
          <OptionRow
            label={option.label}
            hint={option.hint}
            on={option.value === value}
            onPress={() => onChange(option.value)}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

function OptionRow({
  label,
  hint,
  on,
  onPress,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const tick = usePop(on);
  const press = usePressScale(0.99);

  return (
    <Animated.View style={press.style}>
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
        style={styles.optionRow}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[T.button, { color: on ? c.primary : c.text }]}>{label}</Text>
          {hint ? <Text style={[T.fine, { color: c.faint }]}>{hint}</Text> : null}
        </View>

        <View style={[styles.tickRing, { borderColor: on ? c.primary : c.border }]}>
          <Animated.View style={tick}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 13 L9.5 17.5 L19 7"
                stroke={c.primary}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** The signed-in person, at the top of settings. */
export function IdentityCard({
  name,
  email,
  photoUrl,
  badge,
  action,
  onPress,
}: {
  name?: string;
  email: string;
  photoUrl?: string | null;
  badge?: React.ReactNode;
  action: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const press = usePressScale(0.99);

  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${name || email} — ${action}`}
      >
        <Glass style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={name} email={email} photoUrl={photoUrl} size={60} />

            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ fontFamily: font.displayBold, fontSize: 18, color: c.text }}
                numberOfLines={1}
              >
                {name || email}
              </Text>
              {name ? (
                <Text style={[T.fine, { color: c.muted }]} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
              {badge}
            </View>

            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 5 L16 12 L9 19"
                stroke={c.faint}
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </Glass>
      </Pressable>
    </Animated.View>
  );
}
