// The cycle history chart: one bar per cycle, oldest first, as tall as the cycle with its period
// days solid at the bottom; the usual 24-38 day range shaded, the typical cycle as a dashed line,
// the current cycle dashed as in progress, and the tapped cycle's dates and lengths above.
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Pressable } from '@/components/pressable';
import { CYCLE_COLOR, CYCLE_COLOR_TO, daysBetween, rangeText, addDays } from '@/components/cycle';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import type { CycleSummary } from '@/graphql/cycle';

const AXIS = 28;
const LABELS = 32;
const HEIGHT = 210;
const STEP = 7;
/** The usual range of cycle lengths, matching the backend's notes. */
export const USUAL_CYCLE = [24, 38] as const;

export type CycleBar = {
  start: string;
  /** Last day of the cycle: the day before the next period, or today for the current one. */
  last: string;
  /** Days of bleeding; for an open period, so far. */
  periodDays: number;
  /** Days in the cycle; for the current one, so far. */
  cycleDays: number;
  inProgress: boolean;
};

/** One bar per logged period, oldest first, from the cycle summary. */
export function cycleBars(s: CycleSummary, today: string): CycleBar[] {
  return [...s.periods].reverse().map((p) => {
    const inProgress = p.cycleLength == null;
    const cycleDays = p.cycleLength ?? Math.max(1, daysBetween(p.start, today) + 1);
    const periodDays = p.lengthDays ?? Math.min(cycleDays, Math.max(1, daysBetween(p.start, s.currentEnd ?? today) + 1));
    return {
      start: p.start,
      last: inProgress ? today : addDays(p.start, cycleDays - 1),
      periodDays: Math.min(periodDays, cycleDays),
      cycleDays,
      inProgress,
    };
  });
}

const monthText = (day: string, lang: Lang): string => {
  try {
    return new Date(`${day}T12:00:00Z`).toLocaleDateString(lang === 'rn' ? 'fr' : lang, {
      month: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return day.slice(5, 7);
  }
};

export function CycleHistoryChart({ bars, typical }: { bars: CycleBar[]; typical: number }) {
  const { c } = useTheme();
  const { lang } = useLang();
  const a = APP_COPY[lang];
  const scroller = useRef<ScrollView>(null);
  const [areaWidth, setAreaWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const top = Math.ceil(Math.max(USUAL_CYCLE[1] + 4, typical, ...bars.map((b) => b.cycleDays)) / STEP) * STEP;
  const y = (days: number) => HEIGHT - (days / top) * HEIGHT;
  const ticks = Array.from({ length: top / STEP + 1 }, (_, i) => i * STEP);

  // A few cycles fill the width; many keep bars readable and scroll.
  const slot = areaWidth ? Math.max(34, areaWidth / Math.max(bars.length, 1)) : 34;
  const width = slot * bars.length;
  const barWidth = Math.min(26, slot * 0.6);

  const selected = bars.find((b) => b.start === picked) ?? bars[bars.length - 1];
  const onArea = (e: LayoutChangeEvent) => setAreaWidth(e.nativeEvent.layout.width);

  const cycleLine = (b: CycleBar) => {
    const text = b.inProgress
      ? a.cycleInProgress.replace('{n}', String(b.cycleDays))
      : a.cycleOfN.replace('{n}', String(b.cycleDays));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const periodLine = (b: CycleBar) => `${a.avgPeriod}: ${a.daysN.replace('{n}', String(b.periodDays))}`;

  return (
    <View style={{ gap: 12 }}>
      {selected ? (
        <View style={{ gap: 2, minHeight: 64 }}>
          <Text style={[T.fine, { color: c.muted }]}>{rangeText(selected.start, selected.last, lang)}</Text>
          <Text style={{ fontFamily: font.displayBold, fontSize: 22, color: c.text }}>{cycleLine(selected)}</Text>
          <Text style={[T.fine, { color: CYCLE_COLOR, fontFamily: font.bodySemi }]}>{periodLine(selected)}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS, height: HEIGHT }}>
          {ticks.map((tick) => (
            <Text
              key={tick}
              style={[styles.tick, { color: c.faint, top: Math.min(HEIGHT - 14, Math.max(0, y(tick) - 7)) }]}
            >
              {tick}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }} onLayout={onArea}>
          <ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            // Opens on the newest cycles, at the right.
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
          >
            <View style={{ width: Math.max(width, areaWidth) }}>
              <Svg width={Math.max(width, areaWidth)} height={HEIGHT} pointerEvents="none">
                <Rect
                  x={0}
                  y={y(USUAL_CYCLE[1])}
                  width={Math.max(width, areaWidth)}
                  height={y(USUAL_CYCLE[0]) - y(USUAL_CYCLE[1])}
                  fill={c.successMark}
                  fillOpacity={0.1}
                />
                {ticks.map((tick) => (
                  <Line
                    key={tick}
                    x1={0}
                    x2={Math.max(width, areaWidth)}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={c.border}
                    strokeWidth={StyleSheet.hairlineWidth}
                  />
                ))}
                {bars.map((b, i) => {
                  const x = i * slot + (slot - barWidth) / 2;
                  const isPicked = b.start === selected?.start;
                  const cycleTop = y(b.cycleDays);
                  const periodTop = y(b.periodDays);
                  const r = Math.min(barWidth / 2, 6);
                  return (
                    <React.Fragment key={b.start}>
                      <Rect
                        x={x}
                        y={cycleTop}
                        width={barWidth}
                        height={HEIGHT - cycleTop}
                        rx={r}
                        fill={CYCLE_COLOR_TO}
                        fillOpacity={b.inProgress ? 0.25 : isPicked ? 0.75 : 0.5}
                        stroke={b.inProgress ? CYCLE_COLOR : isPicked ? c.text : 'none'}
                        strokeWidth={b.inProgress || isPicked ? 1.5 : 0}
                        strokeDasharray={b.inProgress ? '4 4' : undefined}
                      />
                      <Rect
                        x={x}
                        y={periodTop}
                        width={barWidth}
                        height={HEIGHT - periodTop}
                        rx={r}
                        fill={CYCLE_COLOR}
                        fillOpacity={isPicked ? 1 : 0.85}
                      />
                    </React.Fragment>
                  );
                })}
                <Line
                  x1={0}
                  x2={Math.max(width, areaWidth)}
                  y1={y(typical)}
                  y2={y(typical)}
                  stroke={CYCLE_COLOR}
                  strokeWidth={1.2}
                  strokeDasharray="5 5"
                />
              </Svg>

              <View style={styles.hits}>
                {bars.map((b) => (
                  <Pressable
                    key={b.start}
                    ripple="none"
                    onPress={() => setPicked(b.start)}
                    accessibilityRole="button"
                    accessibilityLabel={`${rangeText(b.start, b.last, lang)}: ${cycleLine(b)}, ${periodLine(b)}`}
                    style={{ width: slot, height: HEIGHT + LABELS }}
                  />
                ))}
              </View>

              <View style={{ flexDirection: 'row', height: LABELS }} pointerEvents="none">
                {bars.map((b) => {
                  const isPicked = b.start === selected?.start;
                  return (
                    <View key={b.start} style={{ width: slot, alignItems: 'center' }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.date, { color: isPicked ? c.text : c.faint, fontFamily: isPicked ? font.bodySemi : font.body }]}
                      >
                        {Number(b.start.slice(8))}
                      </Text>
                      <Text numberOfLines={1} style={[styles.month, { color: c.muted }]}>
                        {monthText(b.start, lang)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.legend}>
        <Legend swatch={<View style={[styles.box, { backgroundColor: CYCLE_COLOR }]} />} text={a.chartPeriod} />
        <Legend swatch={<View style={[styles.box, { backgroundColor: CYCLE_COLOR_TO, opacity: 0.6 }]} />} text={a.chartCycle} />
        <Legend
          swatch={<View style={[styles.dash, { borderColor: CYCLE_COLOR }]} />}
          text={`${a.typicalCycle} · ${a.daysN.replace('{n}', String(typical))}`}
        />
        <Legend swatch={<View style={[styles.box, { backgroundColor: c.successMark, opacity: 0.25 }]} />} text={a.usualRange} />
      </View>
    </View>
  );
}

function Legend({ swatch, text }: { swatch: React.ReactNode; text: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.legendItem}>
      {swatch}
      <Text style={[T.fine, { color: c.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hits: { position: 'absolute', left: 0, top: 0, flexDirection: 'row' },
  tick: { position: 'absolute', right: 6, fontSize: 10, lineHeight: 14 },
  date: { fontSize: 10, lineHeight: 14 },
  month: { fontSize: 9, lineHeight: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  box: { width: 12, height: 12, borderRadius: 3 },
  dash: { width: 16, borderTopWidth: 1.5, borderStyle: 'dashed' },
});
