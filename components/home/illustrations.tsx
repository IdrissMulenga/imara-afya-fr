// components/home/illustrations.tsx — the dashboard artwork.
//
// Drawn as SVG rather than shipped as images, for three reasons that matter on
// an entry-level Android phone in Bujumbura:
//
//   • nothing to download and almost nothing to install — a few hundred bytes
//     of path data instead of a few hundred kilobytes of PNG
//   • sharp on every screen density, with no @2x/@3x variants to bundle
//   • the colours are props, so they follow the theme into dark mode instead of
//     sitting there as a bright rectangle
//
// House style: one soft organic blob behind one simple glyph. Rounded, calm,
// nothing sharp — this is a health companion, not a dashboard readout.
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

type Props = {
  /** the accent colour — usually the tint of the card it sits on */
  color: string;
  size?: number;
};

const DEFAULT_SIZE = 76;

// The blob behind every glyph. Deliberately irregular: a perfect circle reads
// as a button, this reads as illustration.
function Blob({ color, opacity = 0.16 }: { color: string; opacity?: number }) {
  return (
    <Path
      d="M52.6 8.9c10.6 4.4 17.9 15.4 18.9 26.8 1 11.4-4.4 23.2-13.6 29.9-9.2 6.7-22.2 8.3-32.6 3.9C14.9 65.1 7.1 54.7 5.6 43.2 4.1 31.7 8.9 19.1 17.9 12.2 26.9 5.3 42 4.5 52.6 8.9Z"
      fill={color}
      opacity={opacity}
    />
  );
}

/** Water — a glass, part filled. The level is deliberately not full: the card
 *  it sits on is usually showing progress towards a goal, not completion. */
export function WaterArt({ color, size = DEFAULT_SIZE }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76">
      <Blob color={color} />
      <G>
        {/* glass body — tapered, rounded foot */}
        <Path
          d="M26 24h24l-2.6 26.4a5 5 0 0 1-5 4.6h-8.8a5 5 0 0 1-5-4.6L26 24Z"
          fill={color}
          opacity={0.22}
        />
        {/* the water itself */}
        <Path
          d="M28.5 38h19l-1.1 12.4a5 5 0 0 1-5 4.6h-6.8a5 5 0 0 1-5-4.6L28.5 38Z"
          fill={color}
        />
        {/* rim */}
        <Rect x="25" y="21" width="26" height="4.6" rx="2.3" fill={color} />
        {/* a single drop above, so it reads as "drink" not "cup" */}
        <Path
          d="M38 9c2.9 3.4 4.6 6 4.6 8.1a4.6 4.6 0 1 1-9.2 0c0-2.1 1.7-4.7 4.6-8.1Z"
          fill={color}
          opacity={0.55}
        />
      </G>
    </Svg>
  );
}

/** Medicine — a capsule on the diagonal, split into its two halves. */
export function MedsArt({ color, size = DEFAULT_SIZE }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76">
      <Blob color={color} />
      <G>
        {/* lower half, solid */}
        <Path
          d="M46.9 20.3a11.4 11.4 0 0 1 16.1 16.1L38.4 61a11.4 11.4 0 0 1-16.1-16.1l24.6-24.6Z"
          fill={color}
          opacity={0.24}
        />
        {/* upper half, filled — the join line is what makes it read as a pill */}
        <Path
          d="M46.9 20.3a11.4 11.4 0 0 1 16.1 16.1L50.7 48.7 34.6 32.6l12.3-12.3Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}

/** Cycle — a calendar page with a soft crescent, for the period tracker. */
export function CycleArt({ color, size = DEFAULT_SIZE }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76">
      <Blob color={color} />
      <G>
        <Rect x="20" y="22" width="36" height="34" rx="9" fill={color} opacity={0.22} />
        {/* the two hanging rings at the top of a calendar */}
        <Rect x="28" y="16" width="4.4" height="10" rx="2.2" fill={color} />
        <Rect x="43.6" y="16" width="4.4" height="10" rx="2.2" fill={color} />
        {/* crescent rather than a marked date — softer, and it doesn't imply
            a precision the prediction doesn't have */}
        <Path
          d="M43.5 32.5a9.5 9.5 0 1 0 0 17.2 10.6 10.6 0 0 1 0-17.2Z"
          fill={color}
        />
        <Circle cx="47.8" cy="41.1" r="2" fill={color} opacity={0.5} />
      </G>
    </Svg>
  );
}

/** Wellbeing — a heart with a pulse line through it. Used for weight / habits
 *  and as the fallback when there is nothing else to highlight. */
export function WellbeingArt({ color, size = DEFAULT_SIZE }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76">
      <Blob color={color} />
      <G>
        <Path
          d="M38 57.5S19.5 46.8 19.5 34.2a10.3 10.3 0 0 1 18.5-6.2 10.3 10.3 0 0 1 18.5 6.2C56.5 46.8 38 57.5 38 57.5Z"
          fill={color}
          opacity={0.24}
        />
        {/* pulse — the bit that says "health" rather than "favourite" */}
        <Path
          d="M23 38.5h7.2l3.4-7.4 5.2 14.4 4-7h10.2"
          stroke={color}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

/** Records — stacked cards, for the health records highlight. */
export function RecordsArt({ color, size = DEFAULT_SIZE }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76">
      <Blob color={color} />
      <G>
        <Rect x="22" y="30" width="32" height="24" rx="7" fill={color} opacity={0.22} />
        <Rect x="26" y="24" width="32" height="24" rx="7" fill={color} opacity={0.34} />
        {/* a plus, so the stack reads as medical rather than as files */}
        <Rect x="39.6" y="29.5" width="4.8" height="13" rx="2.4" fill={color} />
        <Rect x="35.6" y="33.5" width="12.8" height="4.8" rx="2.4" fill={color} />
      </G>
    </Svg>
  );
}
