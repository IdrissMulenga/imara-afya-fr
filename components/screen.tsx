// Screen frame: safe area, keyboard handling, pinned header and footer, backdrop.
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '@/components/glass';
import { Toast, useToastState } from '@/components/notice';
import { useTheme } from '@/theme/theme';
import { radius, size } from '@/theme/tokens';
import { AuthBackdrop } from './backdrop';

/** Whether the keyboard is on screen. */
function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const shown = Keyboard.addListener(showEvent, () => setVisible(true));
    const hidden = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return visible;
}

export function Screen({
  children,
  backdrop = true,
  header,
  footer,
  menu,
  onRefresh,
}: {
  children?: React.ReactNode;
  /** Hide the background circles. */
  backdrop?: boolean;
  /** Pinned to the bottom, outside the scroll view. */
  footer?: React.ReactNode;
  /** A floating, fully rounded bar above the bottom edge (the menu bar). */
  menu?: React.ReactNode;
  /** Enables pull-to-refresh; the spinner shows until the promise settles. */
  onRefresh?: () => Promise<unknown>;
  /** Pinned to the top, outside the scroll view. Owns the top safe-area inset. */
  header?: React.ReactNode;
}) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToastState();
  const keyboardUp = useKeyboardVisible();

  const bottomInset = keyboardUp ? 0 : insets.bottom;

  const [footerHeight, setFooterHeight] = useState(0);
  const [menuHeight, setMenuHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      // ignore: each query shows its own error
    } finally {
      setRefreshing(false);
    }
  };
  // Sits just above the home indicator / gesture bar, overlapping part of its
  // empty inset, with a small margin on phones that have none.
  const menuBottom = Math.max(insets.bottom - 10, 10);
  const showMenu = Boolean(menu) && !keyboardUp;
  // The glass rim: a light edge in dark mode, a faint dark one in light mode.
  const rim = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(19,35,58,0.08)';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {backdrop ? <AuthBackdrop /> : null}

      {header}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: header ? 20 : insets.top + 12,
              paddingBottom: showMenu
                ? menuBottom + menuHeight + 24
                : bottomInset + (footer ? 110 : 28),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={c.primary}
                colors={[c.primary]}
                progressBackgroundColor={c.surface}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>

      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          bottom={showMenu ? menuBottom + menuHeight + 12 : footerHeight + 14}
        />
      ) : null}

      {footer ? (
        // Save bar. The shadow is on this wrapper because Glass clips its own; iOS only,
        // since Android elevation shows through the translucent bar.
        <View
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
          style={[styles.footerShadow, Platform.OS === 'ios' ? styles.footerLift : null]}
        >
          <Glass
            intensity={44}
            radius={0}
            style={{
              paddingHorizontal: size.gutter,
              paddingTop: keyboardUp ? 14 : 12,
              paddingBottom: bottomInset + 12,
              borderTopLeftRadius: radius.card,
              borderTopRightRadius: radius.card,
            }}
          >
            {footer}
          </Glass>
        </View>
      ) : null}

      {showMenu ? (
        // Floating glass pill with a light rim. iOS: real blur, shadow on the wrapper
        // (Glass clips). Android: a translucent fill (blur is too slow on low-end phones)
        // carrying its own elevation, since Android draws no shadow without a background.
        <View
          style={[styles.menuDock, { bottom: menuBottom }, Platform.OS === 'ios' ? styles.menuLiftIOS : null]}
          onLayout={(e) => setMenuHeight(e.nativeEvent.layout.height)}
        >
          {Platform.OS === 'ios' ? (
            <Glass
              intensity={80}
              radius={PILL}
              flat
              style={[styles.menuInner, { borderWidth: 1, borderColor: rim }]}
            >
              {menu}
            </Glass>
          ) : (
            <View
              style={[
                styles.menuInner,
                styles.menuLiftAndroid,
                {
                  borderRadius: PILL,
                  backgroundColor: isDark ? 'rgba(38,39,42,0.94)' : 'rgba(255,255,255,0.94)',
                  borderWidth: 1,
                  borderColor: rim,
                },
              ]}
            >
              {menu}
            </View>
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Pushes whatever follows it to the bottom of the screen. */
export const Spacer = () => <View style={{ flexGrow: 1, minHeight: 24 }} />;

/** Vertical space. */
export const Gap = ({ h = 16 }: { h?: number }) => <View style={{ height: h }} />;

// Radius large enough to make the menu a pill whatever its height.
const PILL = 999;

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: size.gutter,
  },
  footerShadow: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  menuDock: { position: 'absolute', left: 36, right: 36 },
  menuInner: { padding: 5 },
  menuLiftIOS: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  menuLiftAndroid: { elevation: 14 },
  footerLift: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    // Negative so the shadow falls upward.
    shadowOffset: { width: 0, height: -4 },
  },
});
