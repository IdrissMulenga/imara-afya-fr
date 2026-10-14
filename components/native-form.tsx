// Form controls in each phone's own design: Apple's on iOS, Material 3 on Android. Colours come
// from the theme, so both look like the rest of the app.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { Pressable } from '@/components/pressable';
import { FadeIn, useShake } from '@/components/motion';
import { Glass } from '@/components/glass';
import type { Choice } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { useLang } from '@/theme/i18n';
import { font, type as T } from '@/theme/tokens';

const IOS = Platform.OS === 'ios';

// Material icon paths, 24 x 24.
const ARROW_BACK = 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z';
const CHECK = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
const EYE =
  'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const EYE_OFF =
  'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z';

function Icon({ d, size = 24, color }: { d: string; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} />
    </Svg>
  );
}

/** "EMAIL" to "Email": the copy stores field labels in capitals. */
const sentence = (s: string) => s.charAt(0) + s.slice(1).toLocaleLowerCase();

/** Shakes the field once, with a warning buzz, when an error appears. */
function useErrorShake(bad: boolean) {
  const { shake, style } = useShake();
  const wasBad = useRef(bad);
  useEffect(() => {
    if (bad && !wasBad.current) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    wasBad.current = bad;
  }, [bad, shake]);
  return style;
}

/** Back control: the iOS chevron and word, or the Material back arrow. */
export function NavBack({ onPress, label }: { onPress: () => void; label: string }) {
  const { c, isDark } = useTheme();

  if (IOS) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={10}
        style={({ pressed }) => [styles.iosBack, { opacity: pressed ? 0.35 : 1 }]}
      >
        <SymbolView name="chevron.left" size={21} weight="semibold" tintColor={c.primary} />
        <Text style={[styles.iosBackLabel, { color: c.primary }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{
        color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(19,35,58,0.12)',
        borderless: true,
        radius: 24,
      }}
      style={styles.androidBack}
    >
      <Icon d={ARROW_BACK} color={c.text} />
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  /** Hides the text, with a button to show it. */
  secure?: boolean;
  /** Error colour with no words. */
  error?: boolean;
  /** Error colour and this message beneath. */
  errorText?: string;
};

/** Fields in one block: an iOS grouped list on a glass card, or stacked on Android. */
export function FormGroup({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const rows = React.Children.toArray(children);

  if (!IOS) return <View style={{ gap: 16 }}>{rows}</View>;

  return (
    <Glass>
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 ? <View style={[styles.iosSeparator, { backgroundColor: c.border }]} /> : null}
          {row}
        </View>
      ))}
    </Glass>
  );
}

/** Text field: a row of an iOS grouped list, or a Material 3 outlined field. */
export function FormField(props: FieldProps) {
  return IOS ? <IosField {...props} /> : <MaterialField {...props} />;
}

function IosField({ label, secure, error, errorText, style, placeholder, ...rest }: FieldProps) {
  const { c } = useTheme();
  const { t } = useLang();
  const [hidden, setHidden] = useState(true);
  const bad = Boolean(error) || Boolean(errorText);
  const shakeStyle = useErrorShake(bad);

  return (
    <Animated.View style={shakeStyle}>
      <View style={styles.iosRow}>
        <TextInput
          {...rest}
          placeholder={sentence(label)}
          accessibilityLabel={sentence(label)}
          accessibilityHint={placeholder}
          secureTextEntry={secure ? hidden : false}
          clearButtonMode={secure ? 'never' : 'while-editing'}
          placeholderTextColor={bad ? c.danger : c.placeholder}
          selectionColor={c.primary}
          style={[styles.iosInput, { color: c.text }, style]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.show : t.hide}
            hitSlop={6}
            style={({ pressed }) => [styles.iosEye, { opacity: pressed ? 0.35 : 1 }]}
          >
            <SymbolView name={hidden ? 'eye' : 'eye.slash'} size={20} tintColor={c.muted} />
          </Pressable>
        ) : null}
      </View>

      {errorText ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[T.fine, styles.iosError, { color: c.danger }]}
        >
          {errorText}
        </Text>
      ) : null}
    </Animated.View>
  );
}

function MaterialField({
  label,
  secure,
  error,
  errorText,
  style,
  value,
  placeholder,
  onFocus,
  onBlur,
  ...rest
}: FieldProps) {
  const { c, isDark } = useTheme();
  const { t } = useLang();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const bad = Boolean(error) || Boolean(errorText);
  const shakeStyle = useErrorShake(bad);

  // The label sits in the field until it is focused or filled, then moves into the outline.
  const raised = focused || Boolean(value);
  const [float] = useState(() => new Animated.Value(raised ? 1 : 0));
  useEffect(() => {
    const run = Animated.timing(float, {
      toValue: raised ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [raised, float]);

  const outline = bad ? c.danger : focused ? c.primary : c.borderStrong;
  const ink = bad ? c.danger : focused ? c.primary : c.muted;
  const thick = focused || bad ? 2 : 1;
  // The gap left in the top edge for the raised label.
  const gap = raised && labelWidth > 0 ? labelWidth * 0.75 + 8 : 0;

  return (
    <Animated.View style={shakeStyle}>
      <View style={styles.mBox}>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.mOutline,
            { borderColor: outline, borderWidth: thick, borderTopWidth: gap ? 0 : thick },
          ]}
        />
        {gap ? (
          <>
            <View
              pointerEvents="none"
              style={[styles.mEdge, { left: 0, width: 12, height: thick, backgroundColor: outline }]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.mEdge,
                { left: 12 + gap, right: 0, height: thick, backgroundColor: outline },
              ]}
            />
          </>
        ) : null}

        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
          style={[
            styles.mLabel,
            {
              color: ink,
              transform: [
                { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
                { scale: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] }) },
              ],
            },
          ]}
        >
          {sentence(label)}
        </Animated.Text>

        <TextInput
          {...rest}
          value={value}
          placeholder={focused ? placeholder : undefined}
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
          selectionColor={c.primary}
          cursorColor={c.primary}
          style={[styles.mInput, { color: c.text }, style]}
        />

        {secure ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.show : t.hide}
            android_ripple={{
              color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(19,35,58,0.12)',
              borderless: true,
              radius: 20,
            }}
            style={styles.mEye}
          >
            <Icon d={hidden ? EYE : EYE_OFF} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      {errorText ? (
        <FadeIn from={-4} duration={200}>
          <Text
            accessibilityLiveRegion="polite"
            style={[T.fine, styles.mSupport, { color: c.danger }]}
          >
            {errorText}
          </Text>
        </FadeIn>
      ) : null}
    </Animated.View>
  );
}

const isLong = (label: string) => label.length > 9;

/** Short labels keep their width on one line; long ones share what is left and wrap. */
function segmentFlex(label: string, labels: readonly { label: string }[]): ViewStyle {
  if (isLong(label) || !labels.some((o) => isLong(o.label))) return { flex: 1 };
  return { flexGrow: 0, flexShrink: 0 };
}

type SegmentColours = {
  track: string;
  thumb: string;
  text: string;
  textOn: string;
};

/** iOS segmented control; the selected segment slides. Nothing is selected while value is null. */
export function IosSegmented<V extends string>({
  options,
  value,
  onChange,
  colours,
  height = 36,
  fontSize = 13,
}: {
  options: readonly Choice<V>[];
  value: V | null;
  onChange: (next: V) => void;
  colours: SegmentColours;
  height?: number;
  fontSize?: number;
}) {
  // Segments are as wide as their words, so the highlight follows each one's measured frame.
  const [frames, setFrames] = useState<Record<number, { x: number; width: number }>>({});
  const index = options.findIndex((o) => o.value === value);
  const target = index >= 0 ? frames[index] : undefined;
  const [left] = useState(() => new Animated.Value(0));
  const [span] = useState(() => new Animated.Value(0));
  const shown = useRef(false);

  useEffect(() => {
    if (!target) return;
    // The first selection appears in place; later ones slide.
    if (!shown.current) {
      left.setValue(target.x);
      span.setValue(target.width);
      shown.current = true;
      return;
    }
    const spring = { speed: 22, bounciness: 0, useNativeDriver: false };
    Animated.parallel([
      Animated.spring(left, { toValue: target.x, ...spring }),
      Animated.spring(span, { toValue: target.width, ...spring }),
    ]).start();
  }, [target, left, span]);

  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.iosTrack, { minHeight: height, backgroundColor: colours.track }]}
    >
      {target ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.iosThumb, { left, width: span, backgroundColor: colours.thumb }]}
        />
      ) : null}

      {options.map((option, i) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              setFrames((all) =>
                all[i]?.x === x && all[i]?.width === width ? all : { ...all, [i]: { x, width } },
              );
            }}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={option.label}
            style={[styles.iosSegment, segmentFlex(option.label, options)]}
          >
            <Text
              numberOfLines={isLong(option.label) ? 2 : 1}
              style={{
                fontSize,
                textAlign: 'center',
                fontFamily: on ? font.bodySemi : font.bodyMedium,
                color: on ? colours.textOn : colours.text,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type TileIcon = 'female' | 'male' | 'person';

/** Line icons for the choice tiles, drawn on a 24 x 24 grid. */
function TileGlyph({ icon, color }: { icon: TileIcon; color: string }) {
  const line = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      {icon === 'female' ? (
        <>
          <Circle cx={12} cy={9} r={5} {...line} />
          <Path d="M12 14v7M9 18h6" {...line} />
        </>
      ) : icon === 'male' ? (
        <>
          <Circle cx={10} cy={14} r={5} {...line} />
          <Path d="M13.6 10.4L19 5M14.5 5H19v4.5" {...line} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Circle cx={12} cy={8} r={3.5} {...line} />
          <Path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" {...line} />
        </>
      )}
    </Svg>
  );
}

/** One choice from a few, as tiles in a row: an icon over the label; the chosen tile is tinted. */
export function ChoiceTiles<V extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: readonly (Choice<V> & { icon: TileIcon })[];
  value: V | null;
  onChange: (next: V) => void;
  hint?: string;
}) {
  const { c } = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.iosLabel, { color: c.muted }]}>{sentence(label)}</Text>

      <View accessibilityRole="radiogroup" style={styles.tiles}>
        {options.map((option) => {
          const on = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                if (on) return;
                Haptics.selectionAsync().catch(() => {});
                onChange(option.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.tile,
                on
                  ? { borderColor: c.primary, borderWidth: 2, backgroundColor: c.primary + '1A' }
                  : { borderColor: c.border, borderWidth: 1, backgroundColor: c.field },
                IOS && pressed ? { opacity: 0.6 } : null,
              ]}
            >
              <TileGlyph icon={option.icon} color={on ? c.primary : c.muted} />
              <Text
                numberOfLines={2}
                style={[
                  styles.tileLabel,
                  { color: on ? c.primary : c.text, fontFamily: on ? font.bodySemi : font.bodyMedium },
                ]}
              >
                {option.label}
              </Text>

              {on ? (
                <View style={[styles.tileBadge, { backgroundColor: c.primary }]}>
                  <Icon d={CHECK} size={12} color={c.onPrimary} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {hint ? <Text style={[T.fine, { color: c.faint }]}>{hint}</Text> : null}
    </View>
  );
}

/** Agreement tick: the iOS round checkmark or the Material 3 checkbox. Children are the label. */
export function AgreeRow({
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
  const { c, isDark } = useTheme();
  const toggle = () => {
    Haptics.selectionAsync().catch(() => {});
    onToggle();
  };

  if (IOS) {
    return (
      <View style={styles.agreeRow}>
        <Pressable
          onPress={toggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={accessibilityLabel}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <SymbolView
            name={checked ? 'checkmark.circle.fill' : 'circle'}
            size={24}
            tintColor={checked ? c.primary : c.borderStrong}
            animationSpec={checked ? { effect: { type: 'bounce' } } : undefined}
          />
        </Pressable>
        <View style={{ flex: 1, paddingTop: 2 }}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.agreeRow, { marginLeft: -11, gap: 4 }]}>
      <Pressable
        onPress={toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        android_ripple={{
          color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(19,35,58,0.12)',
          borderless: true,
          radius: 20,
        }}
        style={styles.mCheckTarget}
      >
        <View
          style={[
            styles.mCheck,
            checked
              ? { backgroundColor: c.primary, borderColor: c.primary }
              : { borderColor: c.muted },
          ]}
        >
          {checked ? <Icon d={CHECK} size={14} color={c.onPrimary} /> : null}
        </View>
      </Pressable>
      <View style={{ flex: 1, paddingTop: 9 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  iosBack: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 44,
    marginLeft: -6,
    gap: 4,
  },
  iosBackLabel: { fontFamily: font.body, fontSize: 17 },
  androidBack: {
    width: 48,
    height: 48,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosLabel: { fontFamily: font.bodyMedium, fontSize: 13, marginLeft: 2 },
  iosSeparator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  iosRow: { flexDirection: 'row', alignItems: 'center', minHeight: 50 },
  iosInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontFamily: font.body,
    fontSize: 17,
  },
  iosEye: { height: 50, paddingHorizontal: 14, justifyContent: 'center' },
  iosError: { paddingHorizontal: 16, paddingBottom: 10, marginTop: -4 },
  mBox: { height: 56, flexDirection: 'row', alignItems: 'center' },
  mOutline: { borderRadius: 4 },
  mEdge: { position: 'absolute', top: 0 },
  mLabel: {
    position: 'absolute',
    left: 16,
    top: 18,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 20,
    transformOrigin: 'left center',
  },
  mInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontFamily: font.body,
    fontSize: 16,
  },
  mEye: {
    width: 48,
    height: 48,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mSupport: { marginTop: 4, paddingHorizontal: 16 },
  iosTrack: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  iosThumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iosSegment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    minHeight: 96,
    borderRadius: IOS ? 16 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  tileLabel: { fontSize: 13, lineHeight: 17, textAlign: 'center' },
  tileBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mCheckTarget: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mCheck: {
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
