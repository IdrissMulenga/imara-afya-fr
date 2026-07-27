// components/toast.tsx — lightweight toast (no extra dependency).
// Slides in from the top, auto-dismisses, tappable to close.
//
//   const toast = useToast();
//   toast.error('Invalid email or password');   // backend GraphQL message
//   toast.success('Profile saved');
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/constants/theme';

type ToastKind = 'error' | 'success' | 'info';

type ToastState = { message: string; kind: ToastKind } | null;

type ToastApi = {
  show: (message: string, kind?: ToastKind) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastApi>({
  show: () => {},
  error: () => {},
  success: () => {},
  info: () => {},
  hide: () => {},
});

const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const [toast, setToast] = useState<ToastState>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) setToast(null);
      },
    );
  }, [anim]);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      if (!message) return;
      if (timer.current) clearTimeout(timer.current);

      setToast({ message, kind });
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }).start();

      timer.current = setTimeout(hide, DURATION);
    },
    [anim, hide],
  );

  // clear the timer if the provider unmounts
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      error: (m: string) => show(m, 'error'),
      success: (m: string) => show(m, 'success'),
      info: (m: string) => show(m, 'info'),
      hide,
    }),
    [show, hide],
  );

  const palette: Record<ToastKind, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    error: { bg: c.danger, icon: 'alert-circle' },
    success: { bg: c.primary, icon: 'checkmark-circle' },
    info: { bg: c.text, icon: 'information-circle' },
  };

  const tone = palette[toast?.kind ?? 'info'];

  return (
    <ToastContext.Provider value={api}>
      <View style={{ flex: 1 }}>
        {children}

        {!!toast && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.wrap,
              {
                top: insets.top + 8,
                opacity: anim,
                transform: [
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
                ],
              },
            ]}
          >
            <Pressable
              onPress={hide}
              style={[styles.toast, { backgroundColor: tone.bg, borderRadius: radius }]}
            >
              <Ionicons name={tone.icon} size={20} color="#fff" />
              <Text style={styles.text} numberOfLines={3}>
                {toast.message}
              </Text>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 999, elevation: 999 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: { flex: 1, color: '#fff', fontSize: 14.5, fontWeight: '600', lineHeight: 20 },
});

export default ToastProvider;
