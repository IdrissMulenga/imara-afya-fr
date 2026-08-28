// lib/layout.ts — layout constants shared between the tab navigator and the
// screens inside it.
//
// Lives in its own file rather than in the layout because the screens need it
// too, and importing the layout from a screen would be circular.
// The floating pill in components/tab-bar.tsx is 64 tall; the rest is the gap
// under it and a little air above the last card. Same on both platforms now
// that the bar floats on both — if you resize the pill, resize this.
export const TAB_BAR_HEIGHT = 76;

// Breathing room at the bottom of every scrolling screen, so the last card
// doesn't sit flush against the tab bar.
export const SCROLL_BOTTOM_GAP = 32;
