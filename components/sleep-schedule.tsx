// Sleep schedule card like Apple Health's: a draggable 24-hour dial, optional weekend
// times, the sleep goal and bedtime reminders.
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, PanResponder } from 'react-native';
import { useMutation } from '@apollo/client/react';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from '@/components/glass';
import { PrimaryButton, LinkText } from '@/components/ui';
import { Divider, SwitchRow } from '@/components/panel';
import { SLEEP_COLOR } from '@/components/habit-art';
import { useNotice } from '@/components/notice';
import { useScrollLock } from '@/components/screen';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, type AppCopy } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import {
  clockMinutes,
  clockText,
  scheduleHours,
  schedulesFrom,
  type SleepSchedule,
  type SleepSchedules,
} from '@/lib/sleep-schedule';
import { useBedtimeReminders } from '@/lib/sleep-reminders';
import { SET_PREFERENCES, type AuthUser } from '@/graphql/auth';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MOON = '#F5C84C';
export const WAKE_COLOR = '#F29B38';
const DEFAULT: SleepSchedule = { bedtime: '22:30', wakeTime: '06:30' };
const STEP = 15;
const SNAP = 5;
const GOAL_STEP = 0.5;
const GOAL_MIN = 3;
const GOAL_MAX = 14;
// A touch this close (in minutes of the dial) to an icon grabs that icon.
const GRAB = 100;

/** "7 h 30 min", "8 h" or "45 min". */
export const durationText = (hours: number): string => {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const goalLine = (schedule: SleepSchedule, goal: number, a: AppCopy) => {
  const diff = goal - scheduleHours(schedule);
  return diff <= 0
    ? { text: a.meetsGoal.replace('{h}', durationText(goal)), good: true }
    : { text: a.shortOfGoal.replace('{h}', durationText(diff)), good: false };
};

// Point on the dial for minutes after midnight (midnight at the top, clockwise).
const point = (minutes: number, radius: number, center: number) => {
  const angle = (minutes / 1440) * 2 * Math.PI - Math.PI / 2;
  return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
};

// Minutes after midnight for a touch on the dial.
const dialMinutes = (x: number, y: number, center: number): number => {
  let angle = Math.atan2(y - center, x - center) + Math.PI / 2;
  if (angle < 0) angle += 2 * Math.PI;
  return (angle / (2 * Math.PI)) * 1440;
};

const snap = (minutes: number) => (((Math.round(minutes / SNAP) * SNAP) % 1440) + 1440) % 1440;

// Minutes between two clock times the short way round.
const clockGap = (x: number, y: number) => {
  const d = Math.abs(x - y) % 1440;
  return Math.min(d, 1440 - d);
};

type Drag = { mode: 'bed' | 'wake' | 'both'; from: number; bed: number; wake: number };

/** 24-hour dial with the time in bed as an arc. With `onChange`, drag an icon to move one
 *  time or the arc to move both, in 5-minute steps. */
function ScheduleDial({
  schedule,
  size,
  onChange,
}: {
  schedule: SleepSchedule;
  size: number;
  onChange?: (next: SleepSchedule) => void;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const lockScroll = useScrollLock();
  const stroke = Math.round(size * 0.11);
  const center = size / 2;
  const radius = center - stroke / 2 - 2;
  const bed = clockMinutes(schedule.bedtime);
  const wake = clockMinutes(schedule.wakeTime);
  const span = (wake - bed + 1440) % 1440 || 1440;
  const from = point(bed, radius, center);
  const to = point(bed + span, radius, center);
  const arc = `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${span > 720 ? 1 : 0} 1 ${to.x} ${to.y}`;
  // Hour numbers only fit on the large dial; the text inside stays clear of them.
  const showHours = size >= 200;
  const labelRadius = radius - stroke / 2 - 18;
  const inner = (showHours ? labelRadius - 12 : radius - stroke / 2 - 8) * 2 * 0.8;

  // Latest values for the gesture handlers, which are created once.
  const latest = useRef({ bed, wake, onChange, lockScroll, center, radius });
  latest.current = { bed, wake, onChange, lockScroll, center, radius };
  const drag = useRef<Drag | null>(null);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const { onChange: change, center: mid, radius: r } = latest.current;
        const { locationX: x, locationY: y } = e.nativeEvent;
        return Boolean(change) && Math.hypot(x - mid, y - mid) > r * 0.55;
      },
      onMoveShouldSetPanResponder: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { bed: b, wake: w, center: mid } = latest.current;
        const m = dialMinutes(e.nativeEvent.locationX, e.nativeEvent.locationY, mid);
        const toBed = clockGap(m, b);
        const toWake = clockGap(m, w);
        const insideArc = (m - b + 1440) % 1440 < (w - b + 1440) % 1440;
        const nearest = toBed <= toWake ? 'bed' : 'wake';
        const mode: Drag['mode'] = Math.min(toBed, toWake) <= GRAB ? nearest : insideArc ? 'both' : nearest;
        drag.current = { mode, from: m, bed: b, wake: w };
        latest.current.lockScroll(true);
        Haptics.selectionAsync().catch(() => {});
      },
      onPanResponderMove: (e) => {
        const d = drag.current;
        const { onChange: change, bed: b, wake: w, center: mid } = latest.current;
        if (!d || !change) return;
        const m = dialMinutes(e.nativeEvent.locationX, e.nativeEvent.locationY, mid);
        let nextBed = b;
        let nextWake = w;
        if (d.mode === 'bed') nextBed = snap(m);
        else if (d.mode === 'wake') nextWake = snap(m);
        else {
          const delta = snap(m - d.from);
          nextBed = snap(d.bed + delta);
          nextWake = snap(d.wake + delta);
        }
        if (nextBed === nextWake || (nextBed === b && nextWake === w)) return;
        if ((d.mode === 'wake' ? nextWake : nextBed) % 15 === 0) Haptics.selectionAsync().catch(() => {});
        change({ bedtime: clockText(nextBed), wakeTime: clockText(nextWake) });
      },
      onPanResponderRelease: () => {
        drag.current = null;
        latest.current.lockScroll(false);
      },
      onPanResponderTerminate: () => {
        drag.current = null;
        latest.current.lockScroll(false);
      },
    }),
  ).current;

  // A round handle centred on the end of the arc, with its icon centred inside.
  const handle = (p: { x: number; y: number }, name: IconName, tint: string) => {
    const box = onChange ? stroke + 8 : stroke;
    return (
      <View
        pointerEvents="none"
        style={[
          styles.handle,
          {
            left: p.x - box / 2,
            top: p.y - box / 2,
            width: box,
            height: box,
            borderRadius: box / 2,
            backgroundColor: c.bg,
            borderWidth: onChange ? 2 : 0,
            borderColor: tint,
          },
        ]}
      >
        <MaterialCommunityIcons name={name} size={Math.round(box * 0.6)} color={tint} />
      </View>
    );
  };

  return (
    <View
      style={{ width: size, height: size }}
      {...(onChange ? responder.panHandlers : {})}
      accessibilityLabel={`${a.bedtimeLabel} ${schedule.bedtime}, ${a.wakeUpLabel} ${schedule.wakeTime}`}
    >
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          <LinearGradient id="scheduleArc" x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={SLEEP_COLOR} />
            <Stop offset="1" stopColor="#4C8DF6" />
          </LinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={radius} stroke={c.track} strokeWidth={stroke} fill="none" />
        {Array.from({ length: 24 }, (_, h) => {
          const outer = point(h * 60, radius - stroke / 2 - 3, center);
          const tick = point(h * 60, radius - stroke / 2 - (h % 6 === 0 ? 9 : 6), center);
          return (
            <Path
              key={h}
              d={`M ${outer.x} ${outer.y} L ${tick.x} ${tick.y}`}
              stroke={c.faint}
              strokeWidth={h % 6 === 0 ? 2 : 1}
            />
          );
        })}
        {showHours
          ? [0, 6, 12, 18].map((h) => {
              const p = point(h * 60, labelRadius, center);
              return (
                <SvgText key={h} x={p.x} y={p.y + 4} fontSize={11} fill={c.muted} textAnchor="middle">
                  {String(h).padStart(2, '0')}
                </SvgText>
              );
            })
          : null}
        <Path d={arc} stroke="url(#scheduleArc)" strokeWidth={stroke} strokeLinecap="round" fill="none" />
      </Svg>
      {handle(from, 'bed', SLEEP_COLOR)}
      {handle(to, 'alarm', WAKE_COLOR)}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dialCenter]}>
        <View style={{ width: inner, alignItems: 'center' }}>
          {onChange ? (
            <Text style={[styles.centerSmall, { color: c.muted }]} numberOfLines={1} adjustsFontSizeToFit>
              {schedule.bedtime} – {schedule.wakeTime}
            </Text>
          ) : null}
          <Text
            style={{ fontFamily: font.displayBold, fontSize: onChange ? 20 : 15, color: c.text }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {durationText(span / 60)}
          </Text>
          <Text style={[styles.centerSmall, { color: c.muted }]} numberOfLines={1} adjustsFontSizeToFit>
            {a.inBedHours.replace('{h}', '').trim()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// A row with an icon, a label, −/+ buttons and the value between them.
function Stepper({
  icon,
  tint,
  label,
  value,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
}: {
  icon: IconName;
  tint: string;
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  const { c } = useTheme();
  const button = (name: 'minus' | 'plus', onPress: () => void, disabled?: boolean) => (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${name === 'minus' ? '−' : '+'}`}
      hitSlop={6}
      style={({ pressed }) => [
        styles.stepButton,
        { backgroundColor: c.track, opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={name} size={20} color={c.text} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      <View style={[styles.stepIcon, { backgroundColor: `${tint}22` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={tint} />
      </View>
      <Text style={[T.body, { color: c.muted, flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      {button('minus', onMinus, minusDisabled)}
      <Text style={[styles.stepValue, { color: c.text }]}>{value}</Text>
      {button('plus', onPlus, plusDisabled)}
    </View>
  );
}

// Two-option switch, e.g. Weekdays | Weekend.
function Segments<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.segments, { backgroundColor: c.track }]}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.segment, on ? { backgroundColor: c.primary } : null]}
          >
            <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: on ? c.onPrimary : c.muted }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type Draft = SleepSchedules & { goal: number; tab: 'weekday' | 'weekend' };

/** The sleep schedule on the sleep page: set it, see it on the dial, and edit it. */
export function SleepScheduleCard() {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const notice = useNotice();
  const { user, setUser } = useSession();
  const reminders = useBedtimeReminders();
  const [setPreferences, { loading }] = useMutation<{ setPreferences: AuthUser }>(SET_PREFERENCES);
  const [draft, setDraft] = useState<Draft | null>(null);

  if (!user) return null;
  const saved = schedulesFrom(user);

  const startEditing = () =>
    setDraft({
      weekday: saved?.weekday ?? DEFAULT,
      weekend: saved?.weekend ?? null,
      goal: user.sleepGoalHours,
      tab: 'weekday',
    });

  const submit = async (next: SleepSchedules | null, goal: number) => {
    try {
      const { data } = await setPreferences({
        variables: {
          input: {
            sleepBedtime: next?.weekday.bedtime ?? null,
            sleepWakeTime: next?.weekday.wakeTime ?? null,
            sleepWeekendBedtime: next?.weekend?.bedtime ?? null,
            sleepWeekendWakeTime: next?.weekend?.wakeTime ?? null,
            sleepGoalHours: goal,
          },
        },
      });
      if (data?.setPreferences) setUser(data.setPreferences);
      setDraft(null);
      notice.success(next ? a.scheduleSaved : a.scheduleRemoved);
    } catch (e) {
      notice.failure(a.sleepScheduleTitle, errorMessage(e, lang));
    }
  };

  const head = (
    <View style={styles.head}>
      <MaterialCommunityIcons name="bed-clock" size={18} color={SLEEP_COLOR} />
      <Text style={[T.label, { color: c.faint, flex: 1 }]}>{a.sleepScheduleTitle}</Text>
      {saved && !draft ? <LinkText label={a.edit} onPress={startEditing} /> : null}
    </View>
  );

  if (draft) {
    const editing = draft.tab === 'weekend' && draft.weekend ? draft.weekend : draft.weekday;
    const change = (next: SleepSchedule) =>
      setDraft(draft.tab === 'weekend' && draft.weekend ? { ...draft, weekend: next } : { ...draft, weekday: next });
    const move = (key: 'bedtime' | 'wakeTime', delta: number) =>
      change({ ...editing, [key]: clockText(clockMinutes(editing[key]) + delta) });
    const goalStatus = goalLine(editing, draft.goal, a);

    return (
      <Glass style={{ padding: 16 }}>
        {head}
        {draft.weekend ? (
          <View style={{ marginTop: 14 }}>
            <Segments
              options={[
                { value: 'weekday', label: a.weekdaysLabel },
                { value: 'weekend', label: a.weekendLabel },
              ]}
              value={draft.tab}
              onChange={(tab) => setDraft({ ...draft, tab })}
            />
          </View>
        ) : null}
        <View style={{ alignItems: 'center', marginVertical: 14 }}>
          <ScheduleDial schedule={editing} size={250} onChange={change} />
          <Text style={[T.fine, { color: c.faint, marginTop: 8, textAlign: 'center' }]}>{a.dragToAdjust}</Text>
        </View>
        <View style={{ gap: 12 }}>
          <Stepper
            icon="bed"
            tint={SLEEP_COLOR}
            label={a.bedtimeLabel}
            value={editing.bedtime}
            onMinus={() => move('bedtime', -STEP)}
            onPlus={() => move('bedtime', STEP)}
          />
          <Stepper
            icon="alarm"
            tint={WAKE_COLOR}
            label={a.wakeUpLabel}
            value={editing.wakeTime}
            onMinus={() => move('wakeTime', -STEP)}
            onPlus={() => move('wakeTime', STEP)}
          />
          <SwitchRow
            label={a.weekendDifferent}
            hint={a.weekendNote}
            value={Boolean(draft.weekend)}
            onChange={(on) =>
              setDraft(
                on
                  ? { ...draft, weekend: { ...draft.weekday }, tab: 'weekend' }
                  : { ...draft, weekend: null, tab: 'weekday' },
              )
            }
          />
          <Divider />
          <Stepper
            icon="target"
            tint={SLEEP_COLOR}
            label={a.sleepGoalShort}
            value={durationText(draft.goal)}
            minusDisabled={draft.goal <= GOAL_MIN}
            plusDisabled={draft.goal >= GOAL_MAX}
            onMinus={() => setDraft({ ...draft, goal: Math.max(GOAL_MIN, draft.goal - GOAL_STEP) })}
            onPlus={() => setDraft({ ...draft, goal: Math.min(GOAL_MAX, draft.goal + GOAL_STEP) })}
          />
          <Text style={[T.fine, { color: goalStatus.good ? '#2FAF62' : '#F07A3A', textAlign: 'center' }]}>
            {goalStatus.text}
          </Text>
          <PrimaryButton
            label={a.saveSchedule}
            busy={loading}
            onPress={() => void submit({ weekday: draft.weekday, weekend: draft.weekend }, draft.goal)}
          />
          <View style={styles.links}>
            <LinkText label={a.cancel} onPress={() => setDraft(null)} />
            {saved ? <LinkText label={a.removeSchedule} onPress={() => void submit(null, draft.goal)} /> : null}
          </View>
        </View>
      </Glass>
    );
  }

  if (!saved) {
    return (
      <Glass style={{ padding: 16 }}>
        {head}
        <View style={styles.empty}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={34} color={MOON} />
          <Text style={[T.fine, { color: c.muted, flex: 1 }]}>{a.sleepScheduleEmpty}</Text>
        </View>
        <PrimaryButton label={a.sleepScheduleSet} onPress={startEditing} />
      </Glass>
    );
  }

  const goalStatus = goalLine(saved.weekday, user.sleepGoalHours, a);
  return (
    <Glass style={{ padding: 16 }}>
      {head}
      <View style={styles.summary}>
        <ScheduleDial schedule={saved.weekday} size={150} />
        <View style={{ flex: 1, gap: 10 }}>
          {saved.weekend ? <Text style={[T.label, { color: c.faint }]}>{a.weekdaysLabel.toUpperCase()}</Text> : null}
          <View>
            <Text style={[T.fine, { color: c.muted }]}>{a.bedtimeLabel}</Text>
            <Text style={[styles.bigTime, { color: SLEEP_COLOR }]}>{saved.weekday.bedtime}</Text>
          </View>
          <View>
            <Text style={[T.fine, { color: c.muted }]}>{a.wakeUpLabel}</Text>
            <Text style={[styles.bigTime, { color: WAKE_COLOR }]}>{saved.weekday.wakeTime}</Text>
          </View>
          <Text style={[T.fine, { color: goalStatus.good ? '#2FAF62' : '#F07A3A' }]}>{goalStatus.text}</Text>
        </View>
      </View>
      {saved.weekend ? (
        <View style={[styles.weekendRow, { backgroundColor: c.track }]}>
          <MaterialCommunityIcons name="calendar-weekend" size={18} color={SLEEP_COLOR} />
          <Text style={[T.fine, { color: c.text, flex: 1, fontFamily: font.bodySemi }]}>{a.weekendLabel}</Text>
          <Text style={[T.fine, { color: c.muted }]}>
            {saved.weekend.bedtime} – {saved.weekend.wakeTime} · {durationText(scheduleHours(saved.weekend))}
          </Text>
        </View>
      ) : null}
      {reminders.supported ? (
        <>
          <Divider />
          <View style={{ paddingTop: 6 }}>
            <BedtimeRemindersSwitch />
          </View>
        </>
      ) : null}
      <Text style={[T.fine, { color: c.faint, marginTop: 10 }]}>{a.sleepFromSchedule}</Text>
    </Glass>
  );
}

/** The bedtime reminders switch, shared by the schedule card and Settings. */
export function BedtimeRemindersSwitch() {
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const notice = useNotice();
  const { user } = useSession();
  const reminders = useBedtimeReminders();
  const hasSchedule = Boolean(user && schedulesFrom(user));

  if (!reminders.supported) return null;
  return (
    <SwitchRow
      label={a.bedtimeReminders}
      hint={hasSchedule ? a.bedtimeRemindersNote : a.bedtimeRemindersNeedsSchedule}
      value={reminders.enabled}
      onChange={(on) => {
        void reminders.set(on).then((result) => {
          if (result === 'denied') notice.failure(a.bedtimeReminders, a.notificationsDenied);
        });
      }}
    />
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handle: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  dialCenter: { alignItems: 'center', justifyContent: 'center' },
  centerSmall: { fontFamily: font.bodySemi, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: font.displayBold, fontSize: 18, minWidth: 74, textAlign: 'center' },
  segments: { flexDirection: 'row', borderRadius: 999, padding: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 18, marginVertical: 14 },
  bigTime: { fontFamily: font.displayBold, fontSize: 26 },
  weekendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, marginBottom: 10 },
});
