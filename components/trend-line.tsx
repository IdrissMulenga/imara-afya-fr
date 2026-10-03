// A line over the real dates of a range (gaps between entries keep their length) for values
// logged now and then, like weight and BMI: an axis fitted to the values, optional shaded bands,
// month labels, and the tapped entry's date, value, note and change from the entry before it.
import React, { useState } from 'react';
import { View, Text, StyleSheet, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Pressable } from '@/components/pressable';
import { dateText, daysBetween, addDays } from '@/components/cycle';
import { useLang, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';

const AXIS = 34;
const HEIGHT = 190;
const LABELS = 22;
const PAD = 10;

export type TrendPoint = { day: string; value: number };
/** A shaded stretch of the axis, e.g. a BMI range. */
export type TrendBand = { low: number; high: number; color: string };

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

// A round step and the axis bounds around the values, at least minSpan tall.
function scale(values: number[], minSpan: number): { low: number; high: number; step: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(minSpan, max - min);
  const step = span <= 6 ? 1 : span <= 12 ? 2 : span <= 30 ? 5 : 10;
  const low = Math.floor((min - span * 0.15) / step) * step;
  const high = Math.ceil((max + span * 0.15) / step) * step;
  return { low, high: Math.max(high, low + step * 2), step };
}

export function TrendLineChart({
  points: entries,
  from,
  to,
  color,
  format,
  change,
  note,
  bands = [],
  minSpan = 4,
}: {
  /** Oldest first. */
  points: TrendPoint[];
  /** First and last day of the range. */
  from: string;
  to: string;
  color: string;
  format: (value: number) => string;
  /** The difference from the entry before, e.g. "+1.2 kg". */
  change: (diff: number) => string;
  /** A line under the tapped value, e.g. its BMI range. */
  note?: (value: number) => { text: string; color: string } | null;
  bands?: TrendBand[];
  /** The smallest span the axis covers. */
  minSpan?: number;
}) {
  const { c } = useTheme();
  const { lang } = useLang();
  const gradientId = 'trendFill';
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const span = Math.max(1, daysBetween(from, to));
  const { low, high, step } = scale(entries.map((e) => e.value), minSpan);
  const plotW = Math.max(0, width - PAD * 2);
  const x = (day: string) => PAD + (plotW * daysBetween(from, day)) / span;
  const y = (value: number) => HEIGHT - ((value - low) / (high - low)) * HEIGHT;
  const ticks = Array.from({ length: Math.round((high - low) / step) + 1 }, (_, i) => low + i * step);

  const points = entries.map((e) => ({ ...e, px: x(e.day), py: y(e.value) }));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ');
  const area =
    points.length > 1
      ? `${line} L${points[points.length - 1].px.toFixed(1)} ${HEIGHT} L${points[0].px.toFixed(1)} ${HEIGHT} Z`
      : '';

  const selectedIndex = Math.max(0, picked ? entries.findIndex((e) => e.day === picked) : entries.length - 1);
  const selected = entries[selectedIndex];
  const previous = selectedIndex > 0 ? entries[selectedIndex - 1] : null;
  const selectedNote = selected && note ? note(selected.value) : null;

  // Month labels at the range start and each month start, skipping any too close to the last.
  const months: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (d !== from && !d.endsWith('-01')) continue;
    const last = months[months.length - 1];
    if (last && x(d) - x(last) < 38) {
      if (d.endsWith('-01') && last === from) months[months.length - 1] = d;
      continue;
    }
    months.push(d);
  }

  const onPress = (e: GestureResponderEvent) => {
    const tapX = e.nativeEvent.locationX;
    let best = points[0];
    for (const p of points) if (Math.abs(p.px - tapX) < Math.abs(best.px - tapX)) best = p;
    if (best) setPicked(best.day);
  };

  return (
    <View style={{ gap: 12 }}>
      {selected ? (
        <View style={styles.readout}>
          <View style={{ flex: 1 }}>
            <Text style={[T.fine, { color: c.muted }]}>{dateText(selected.day, lang, true)}</Text>
            <Text style={{ fontFamily: font.displayBold, fontSize: 26, color: c.text }}>{format(selected.value)}</Text>
            {selectedNote ? (
              <Text style={[T.fine, { color: selectedNote.color, fontFamily: font.bodySemi }]}>{selectedNote.text}</Text>
            ) : null}
          </View>
          {previous ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[T.fine, { color: c.faint }]}>{dateText(previous.day, lang)}</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.text }}>
                {change(selected.value - previous.value)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS, height: HEIGHT + LABELS }}>
          {ticks.map((tick) => (
            <Text key={tick} style={[styles.tick, { color: c.faint, top: Math.min(HEIGHT - 14, Math.max(0, y(tick) - 7)) }]}>
              {tick}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 ? (
            <Pressable
              ripple="none"
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={selected ? `${dateText(selected.day, lang)}: ${format(selected.value)}` : undefined}
            >
              <View pointerEvents="none">
                <Svg width={width} height={HEIGHT}>
                  <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2={HEIGHT} gradientUnits="userSpaceOnUse">
                      <Stop offset="0" stopColor={color} stopOpacity={0.25} />
                      <Stop offset="1" stopColor={color} stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  {bands.map((band) => {
                    const top = Math.min(high, band.high);
                    const bottom = Math.max(low, band.low);
                    if (top <= bottom) return null;
                    return (
                      <Rect
                        key={`${band.low}-${band.high}`}
                        x={0}
                        y={y(top)}
                        width={width}
                        height={y(bottom) - y(top)}
                        fill={band.color}
                        fillOpacity={0.12}
                      />
                    );
                  })}
                  {ticks.map((tick) => (
                    <Line key={tick} x1={0} x2={width} y1={y(tick)} y2={y(tick)} stroke={c.border} strokeWidth={StyleSheet.hairlineWidth} />
                  ))}
                  {selected ? (
                    <Line x1={x(selected.day)} x2={x(selected.day)} y1={0} y2={HEIGHT} stroke={c.faint} strokeWidth={1} />
                  ) : null}
                  {area && bands.length === 0 ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
                  {points.length > 1 ? (
                    <Path d={line} stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
                  ) : null}
                  {points.map((p) => {
                    const on = p.day === selected?.day;
                    return (
                      <Circle
                        key={p.day}
                        cx={p.px}
                        cy={p.py}
                        r={on ? 6 : points.length > 40 ? 2.5 : 4}
                        fill={on ? color : c.bg}
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  })}
                </Svg>
                <View style={{ height: LABELS }}>
                  {months.map((d) => (
                    <Text key={d} numberOfLines={1} style={[styles.month, { color: c.muted, left: Math.min(width - 40, x(d)) }]}>
                      {monthText(d, lang)}
                    </Text>
                  ))}
                </View>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, minHeight: 52 },
  tick: { position: 'absolute', right: 6, fontSize: 10, lineHeight: 14 },
  month: { position: 'absolute', top: 4, width: 40, fontSize: 10, lineHeight: 14 },
});
