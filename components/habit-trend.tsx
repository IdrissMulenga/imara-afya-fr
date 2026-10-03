// The full history chart: a fixed hours axis, scrolling bars with the goal and average lines,
// dates and months underneath, and the tapped day's value above. Days with no value yet show
// a faint stub, so "not synced" never reads as zero.
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Pressable } from '@/components/pressable';
import { dayLabel } from '@/components/habits';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import type { HabitDay } from '@/graphql/habits';

const AXIS = 34;
const LABELS = 30;

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

// A round axis step and top for values up to max: whole hours for sleep, 1/2/2.5/5 x 10^n beyond.
function scale(max: number): { top: number; step: number } {
  let step: number;
  if (max <= 4) step = 1;
  else if (max <= 12) step = 2;
  else if (max <= 24) step = 4;
  else {
    const rough = max / 4;
    const mag = 10 ** Math.floor(Math.log10(rough));
    const norm = rough / mag;
    step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  }
  return { top: Math.max(step, Math.ceil(max / step) * step), step };
}

// Axis labels short enough for the axis: 2500 -> 2.5k.
const tickText = (n: number): string =>
  n >= 1000 ? `${Number((n / 1000).toFixed(1)).toLocaleString()}k` : n.toLocaleString();

export function HabitTrendChart({
  days,
  goal,
  value,
  format,
  color,
  goalText,
  averageText,
  emptyText,
  height = 200,
}: {
  /** Oldest first. */
  days: HabitDay[];
  goal: number;
  /** null when the day has no value yet. */
  value: (day: HabitDay) => number | null;
  format: (n: number) => string;
  color: string;
  goalText: string;
  averageText: string;
  /** Shown for a tapped day with no value. */
  emptyText: string;
  height?: number;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const scroller = useRef<ScrollView>(null);
  const [areaWidth, setAreaWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const values = days.map(value);
  const known = values.filter((v): v is number => v != null);
  const average = known.length ? known.reduce((sum, v) => sum + v, 0) / known.length : null;
  const { top, step } = scale(Math.max(goal, ...known, 1));
  const y = (v: number) => height - (v / top) * height;

  // Short ranges fill the width; long ones keep bars readable and scroll.
  const minSlot = days.length > 45 ? 12 : 20;
  const slot = areaWidth ? Math.max(minSlot, areaWidth / Math.max(days.length, 1)) : minSlot;
  const width = slot * days.length;
  const barWidth = Math.max(5, Math.min(18, slot * 0.62));
  const everyDay = slot >= 18;

  const selected = days.find((d) => d.day === picked) ?? days[days.length - 1];
  const selectedValue = selected ? value(selected) : null;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const onArea = (e: LayoutChangeEvent) => setAreaWidth(e.nativeEvent.layout.width);

  return (
    <View style={{ gap: 12 }}>
      {selected ? (
        <View style={styles.readout}>
          <View style={{ flex: 1 }}>
            <Text style={[T.fine, { color: c.muted }]}>{dayLabel(selected.day, lang)} · {monthText(selected.day, lang)}</Text>
            <Text style={{ fontFamily: font.displayBold, fontSize: 26, color: c.text }}>
              {selectedValue == null ? emptyText : format(selectedValue)}
            </Text>
          </View>
          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            <Legend swatch={<View style={[styles.dash, { borderColor: c.faint }]} />} text={`${goalText} ${format(goal)}`} />
            {average != null ? (
              <Legend swatch={<View style={[styles.solid, { backgroundColor: color }]} />} text={`${averageText} ${format(average)}`} />
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS, height }}>
          {ticks.map((tick) => (
            <Text
              key={tick}
              style={[T.fine, styles.tick, { color: c.faint, top: Math.min(height - 14, Math.max(0, y(tick) - 7)) }]}
            >
              {tickText(tick)}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }} onLayout={onArea}>
          <ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            // Opens on the newest days, at the right.
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
          >
            <View style={{ width }}>
              <Svg width={width} height={height} pointerEvents="none">
                {ticks.map((tick) => (
                  <Line key={tick} x1={0} x2={width} y1={y(tick)} y2={y(tick)} stroke={c.border} strokeWidth={StyleSheet.hairlineWidth} />
                ))}
                {days.map((d, i) => {
                  const v = values[i];
                  const x = i * slot + (slot - barWidth) / 2;
                  const isPicked = d.day === selected?.day;
                  if (v == null || v === 0) {
                    return <Rect key={d.day} x={x} y={height - 3} width={barWidth} height={3} rx={1.5} fill={c.faint} fillOpacity={0.35} />;
                  }
                  const barHeight = Math.max(4, (v / top) * height);
                  return (
                    <Rect
                      key={d.day}
                      x={x}
                      y={height - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx={Math.min(barWidth / 2, 6)}
                      fill={goal > 0 && v >= goal ? c.successMark : color}
                      fillOpacity={isPicked ? 1 : 0.72}
                      stroke={isPicked ? c.text : 'none'}
                      strokeWidth={isPicked ? 1.5 : 0}
                    />
                  );
                })}
                {goal > 0 ? (
                  <Line x1={0} x2={width} y1={y(goal)} y2={y(goal)} stroke={c.faint} strokeWidth={1.2} strokeDasharray="5 5" />
                ) : null}
                {average != null ? (
                  <Line x1={0} x2={width} y1={y(average)} y2={y(average)} stroke={color} strokeWidth={1.5} strokeOpacity={0.9} />
                ) : null}
              </Svg>

              <View style={styles.hits}>
                {days.map((d, i) => (
                  <Pressable
                    key={d.day}
                    ripple="none"
                    onPress={() => setPicked(d.day)}
                    accessibilityRole="button"
                    accessibilityLabel={`${dayLabel(d.day, lang)}: ${values[i] == null ? emptyText : format(values[i] as number)}`}
                    style={{ width: slot, height: height + LABELS }}
                  />
                ))}
              </View>

              <View style={{ flexDirection: 'row', height: LABELS }} pointerEvents="none">
                {days.map((d, i) => {
                  const date = Number(d.day.slice(8));
                  const fromEnd = days.length - 1 - i;
                  const showDate = everyDay || fromEnd % 7 === 0;
                  const showMonth = date === 1 || i === 0;
                  const isPicked = d.day === selected?.day;
                  return (
                    <View key={d.day} style={{ width: slot, alignItems: 'center', overflow: 'visible' }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.date,
                          { color: isPicked ? c.text : c.faint, fontFamily: isPicked ? font.bodySemi : font.body },
                        ]}
                      >
                        {showDate || isPicked ? date : ''}
                      </Text>
                      {showMonth ? (
                        <Text numberOfLines={1} style={[styles.month, { color: c.muted }]}>
                          {monthText(d.day, lang)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function Legend({ swatch, text }: { swatch: React.ReactNode; text: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.legend}>
      {swatch}
      <Text style={[T.fine, { color: c.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dash: { width: 16, borderTopWidth: 1.5, borderStyle: 'dashed' },
  solid: { width: 16, height: 2, borderRadius: 1 },
  tick: { position: 'absolute', right: 6, fontSize: 10, lineHeight: 14 },
  date: { fontSize: 10, lineHeight: 14 },
  month: { position: 'absolute', top: 14, left: 2, width: 44, fontSize: 9, lineHeight: 12 },
  hits: { position: 'absolute', left: 0, top: 0, flexDirection: 'row' },
});
