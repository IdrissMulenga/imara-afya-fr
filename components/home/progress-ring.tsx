// components/home/progress-ring.tsx — circular progress with a value in the middle.
import Svg, { Circle } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '@/constants/theme';

export default function ProgressRing({
  progress,
  size = 62,
  stroke = 6,
  color,
  trackColor,
  label,
  sublabel,
}: {
  // 0 to 1; values above 1 are clamped so an over-achieving day still reads full
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor?: string;
  label: string;
  sublabel?: string;
}) {
  const { c } = useTheme();

  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? c.fieldBg}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          // start at 12 o'clock rather than 3
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        {!!sublabel && <Text style={[styles.sublabel, { color: c.textFaint }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '800', letterSpacing: -0.4 },
  sublabel: { fontSize: 9, fontWeight: '700', marginTop: -1 },
});
