// lib/tab-visibility.ts — which routes get a tab, and why it is this awkward.
//
// THE TRAP THIS EXISTS TO AVOID.
//
// Screens are hidden from the bar with expo-router's `href: null`. But
// expo-router treats `href` as a shortcut prop and destructures it OUT of the
// options before React Navigation ever sees them — see TabsClient.js:
//
//     const { href, ...options } = screen.options;
//     ...
//     tabBarItemStyle: href == null ? { display: 'none' } : options.tabBarItemStyle
//
// So `options.href` is ALWAYS undefined inside a custom tab bar, and a filter
// written against it hides nothing at all. That shipped: men kept seeing the
// cycle tab, and women saw settings next to it, because both `href: null`s were
// quietly ignored. The DEFAULT bar never had the problem because it honours
// `tabBarItemStyle`; a custom one has to do the same.
//
// PLAIN TYPESCRIPT, NO REACT NATIVE IMPORT. That is the point of the file: this
// rule is worth a real test, and a module that pulls in `react-native` can't be
// imported by one. The first version of this check lived in the component and
// its "test" re-typed the logic by hand — so the test passed while the app was
// broken, which is worse than having no test.

/** The routes that get a tab, and the icon each one uses. */
export const TAB_ICONS: Record<string, string> = {
  index: 'home',
  habits: 'water',
  medications: 'medkit',
  // Cycle and settings share the fourth slot — cycle for women, settings for
  // everyone else. Exactly one of the two is ever visible.
  cycle: 'calendar',
  settings: 'settings',
};

// React Native's StyleProp allows false, null, undefined and arbitrary nesting,
// so this takes `unknown` and narrows rather than pretending the shape is
// simpler than it is.
/** Same job as StyleSheet.flatten, without needing react-native. */
const flatten = (style: unknown): { display?: string } | undefined => {
  if (!style || typeof style !== 'object') return undefined;

  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flatten).filter(Boolean));
  }

  return style as { display?: string };
};

export function isVisibleTab(
  name: string,
  options: { tabBarItemStyle?: unknown },
): boolean {
  if (!TAB_ICONS[name]) return false;

  return flatten(options.tabBarItemStyle)?.display !== 'none';
}
