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
}: {
  children?: React.ReactNode;
  /** Hide the background circles. */
  backdrop?: boolean;
  /** Pinned to the bottom, outside the scroll view. */
  footer?: React.ReactNode;
  /** Pinned to the top, outside the scroll view. Owns the top safe-area inset. */
  header?: React.ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToastState();
  const keyboardUp = useKeyboardVisible();

  const bottomInset = keyboardUp ? 0 : insets.bottom;

  const [footerHeight, setFooterHeight] = useState(0);

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
              paddingBottom: bottomInset + (footer ? 110 : 28),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>

      {toast ? <Toast key={toast.id} message={toast.message} bottom={footerHeight + 14} /> : null}

      {footer ? (
        // Save bar. The shadow is on this wrapper because Glass clips its own.
        <View
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
          style={[
            styles.footerShadow,
            Platform.OS === 'ios' ? styles.footerLift : { elevation: 12 },
          ]}
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
