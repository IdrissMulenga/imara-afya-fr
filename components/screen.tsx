// Screen frame: safe area, keyboard handling, pinned header and footer, backdrop.
import React, { createContext, useContext, useEffect, useState } from 'react';
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
import { useMenuSpace } from './menu-bar';

// Lets a control that is dragged (like the sleep schedule dial) stop the page scrolling.
const ScrollLockContext = createContext<(locked: boolean) => void>(() => {});

/** Call with true while a drag is in progress, false when it ends. */
export const useScrollLock = () => useContext(ScrollLockContext);

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

/** Page frame: safe area, pinned header and footer, scrolling content, pull-to-refresh, toast. */
export function Screen({
  children,
  backdrop = true,
  header,
  footer,
  tabbed,
  onRefresh,
}: {
  children?: React.ReactNode;
  /** Hide the background circles. */
  backdrop?: boolean;
  /** Pinned to the bottom, outside the scroll view. */
  footer?: React.ReactNode;
  /** One of the main tabs: leaves room for the floating menu at the bottom. */
  tabbed?: boolean;
  /** Enables pull-to-refresh; the spinner shows until the promise settles. */
  onRefresh?: () => Promise<unknown>;
  /** Pinned to the top, outside the scroll view. Owns the top safe-area inset. */
  header?: React.ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToastState();
  const keyboardUp = useKeyboardVisible();

  const bottomInset = keyboardUp ? 0 : insets.bottom;

  const [footerHeight, setFooterHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);

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
  const menuSpace = useMenuSpace();
  const showMenu = Boolean(tabbed) && !keyboardUp;

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
                ? menuSpace.bottom + menuSpace.height + 24
                : bottomInset + (footer ? 110 : 28),
            },
          ]}
          scrollEnabled={!scrollLocked}
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
          <ScrollLockContext.Provider value={setScrollLocked}>{children}</ScrollLockContext.Provider>
        </ScrollView>
      </TouchableWithoutFeedback>

      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          bottom={showMenu ? menuSpace.bottom + menuSpace.height + 12 : footerHeight + 14}
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

    </KeyboardAvoidingView>
  );
}

/** Pushes whatever follows it to the bottom of the screen. */
export const Spacer = () => <View style={{ flexGrow: 1, minHeight: 24 }} />;

/** Vertical space. */
export const Gap = ({ h = 16 }: { h?: number }) => <View style={{ height: h }} />;

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: size.gutter,
  },
  footerShadow: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  footerLift: {
    shadowColor: '#0C1A2E',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    // Negative so the shadow falls upward.
    shadowOffset: { width: 0, height: -4 },
  },
});
