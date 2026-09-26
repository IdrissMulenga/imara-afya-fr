// In-app notices: a banner that drops in from the top, and a toast at the bottom.
// NoticeProvider is mounted once in app/_layout.tsx, above the router.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { usePathname } from 'expo-router';
import { useReducedMotion } from '@/components/motion';
import { useTheme } from '@/theme/theme';
import { radius, size, type as T, font } from '@/theme/tokens';

type Tone = 'success' | 'error' | 'info';

type Notice = {
  /** A new id on every show, so the same message twice still re-animates. */
  id: number;
  tone: Tone;
  title: string;
  detail?: string;
};

/** The bottom toast: says what was saved. */
type ToastState = { id: number; message: string } | null;

type NoticeApi = {
  show: (tone: Tone, title: string, detail?: string) => void;
  success: (title: string, detail?: string) => void;
  failure: (title: string, detail?: string) => void;
  dismiss: () => void;
  /** Shows a toast with what changed. */
  toast: (message: string) => void;
};

const NoticeContext = createContext<NoticeApi>({
  show: () => {},
  success: () => {},
  failure: () => {},
  dismiss: () => {},
  toast: () => {},
});

// Read by <Screen>, which positions the toast above its footer.
const ToastContext = createContext<ToastState>(null);
/** The toast currently showing (read by Screen). */
export const useToastState = () => useContext(ToastContext);

// How long each tone stays on screen.
const HOLD_MS: Record<Tone, number> = { success: 3200, error: 5200, info: 4000 };

// How long a toast stays in state: its animation in, hold and fade out.
const TOAST_MS = 4400;

/** Provides notices and toasts to the app. */
export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [toastState, setToastState] = useState<ToastState>(null);
  const nextId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const dismiss = useCallback(() => setNotice(null), []);

  const clearToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToastState(null);
  }, []);

  // Shown once, on the screen that raised it: cleared when done, so screens
  // opened later do not replay it.
  const toast = useCallback(
    (message: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      nextId.current += 1;
      setToastState({ id: nextId.current, message });
      toastTimer.current = setTimeout(clearToast, TOAST_MS);
    },
    [clearToast],
  );

  // Leaving the screen drops its toast.
  useEffect(() => {
    clearToast();
  }, [pathname, clearToast]);

  useEffect(() => clearToast, [clearToast]);

  const show = useCallback((tone: Tone, title: string, detail?: string) => {
    nextId.current += 1;
    setNotice({ id: nextId.current, tone, title, detail });

    // Haptic feedback that matches the tone.
    const feedback =
      tone === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Success;
    Haptics.notificationAsync(feedback).catch(() => {});
  }, []);

  const api = useMemo<NoticeApi>(
    () => ({
      show,
      success: (title, detail) => show('success', title, detail),
      failure: (title, detail) => show('error', title, detail),
      dismiss,
      toast,
    }),
    [show, dismiss, toast],
  );

  return (
    <NoticeContext.Provider value={api}>
      <ToastContext.Provider value={toastState}>{children}</ToastContext.Provider>
      {/* A new notice replaces the current one. */}
      {notice ? <Banner key={notice.id} notice={notice} onDone={dismiss} /> : null}
    </NoticeContext.Provider>
  );
}

/** Shows success and failure notices, and toasts. */
export const useNotice = () => useContext(NoticeContext);

function Banner({ notice, onDone }: { notice: Notice; onDone: () => void }) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Held in a ref so the pan responder always calls the current handler.
  const leave = useRef(() => {});

  leave.current = () => {
    if (timer.current) clearTimeout(timer.current);

    if (reduced) {
      onDone();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone();
    });
  };

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
    } else {
      Animated.spring(progress, {
        toValue: 1,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
    }

    timer.current = setTimeout(() => leave.current(), HOLD_MS[notice.tone]);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [progress, reduced, notice.tone]);

  // Swipe up to dismiss.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy < -6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -20) leave.current();
      },
    }),
  ).current;

  const accent =
    notice.tone === 'error' ? c.danger : notice.tone === 'success' ? c.successMark : c.primary;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-150, 0],
              }),
            },
          ],
        },
      ]}
      {...pan.panHandlers}
    >
      <Pressable
        onPress={() => leave.current()}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${notice.title}${notice.detail ? `. ${notice.detail}` : ''}`}
        style={[
          styles.card,
          {
            backgroundColor: c.surface,
            borderColor: isDark ? c.border : 'rgba(19,35,58,0.08)',
          },
          Platform.OS === 'ios' ? styles.lift : { elevation: 8 },
        ]}
      >
        <View style={[styles.edge, { backgroundColor: accent }]} />

        <View style={[styles.icon, { backgroundColor: accent }]}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            {notice.tone === 'error' ? (
              <>
                <Path d="M12 6 V14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
                <Path d="M12 18 V18" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" />
              </>
            ) : (
              <Path
                d="M5 13 L9.5 17.5 L19 7"
                stroke="#FFFFFF"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.text }} numberOfLines={2}>
            {notice.title}
          </Text>
          {notice.detail ? (
            <Text style={[T.fine, { color: c.muted }]} numberOfLines={3}>
              {notice.detail}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    zIndex: 1000,
  },
  card: {
    minHeight: size.tap + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 18,
    paddingRight: 16,
    borderWidth: 1,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lift: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 900,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 999,
    maxWidth: '100%',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

/** The toast. Rendered by <Screen>, which knows how tall its footer is. */
export function Toast({ message, bottom }: { message: string; bottom: number }) {
  const { c, isDark } = useTheme();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      const id = setTimeout(() => progress.setValue(0), 4000);
      return () => clearTimeout(id);
    }

    let out: ReturnType<typeof setTimeout> | null = null;

    Animated.spring(progress, {
      toValue: 1,
      speed: 16,
      bounciness: 8,
      useNativeDriver: true,
    }).start(() => {
      out = setTimeout(() => {
        Animated.timing(progress, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();
      }, 3600);
    });

    return () => {
      if (out) clearTimeout(out);
    };
  }, [progress, reduced]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastWrap,
        {
          bottom,
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: isDark ? c.surface : '#13233A',
            borderColor: isDark ? c.border : 'transparent',
          },
          Platform.OS === 'ios' ? styles.lift : { elevation: 6 },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: c.successMark }]} />
        <Text
          style={{ fontFamily: font.bodySemi, fontSize: 12.5, letterSpacing: 0.3, color: '#F6F7F9', flexShrink: 1 }}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
