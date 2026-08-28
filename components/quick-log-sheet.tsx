// components/quick-log-sheet.tsx — everything you might want to record, once.
//
// WHAT THE LOG BUTTON OPENS.
//
// A glass of water is the single most-tapped thing in this app, and it used to
// cost three taps: switch to Habits, find the water card, press +. Now it is
// two from anywhere in the app, and the sheet closes itself afterwards.
//
// The water button writes DIRECTLY — the others navigate, because they need a
// choice (which medicine, how do you feel) that a sheet this size can't ask
// well. Recording one glass needs no choice at all, so it shouldn't ask for
// one.
//
// EVERYTHING YOU RECORD IS IN HERE, and nowhere else. Records, routines and the
// check-in used to be listed on the profile screen as well, which put the same
// four destinations in two places and made neither of them the answer to "where
// do I log something". Profile is now about who you are; this is about what you
// did today.
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import { PressableScale } from '@/components/motion';

type Action = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  wash: string;
  label: string;
  hint: string;
  onPress: () => void;
  busy?: boolean;
};

function Row({ action }: { action: Action }) {
  const { c, radius } = useTheme();

  return (
    <PressableScale
      onPress={action.onPress}
      disabled={action.busy}
      style={[styles.row, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius + 2 }]}
    >
      <View style={[styles.icon, { backgroundColor: action.wash }]}>
        {action.busy
          ? <ActivityIndicator size="small" color={action.tint} />
          : <Ionicons name={action.icon} size={21} color={action.tint} />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: c.text }]}>{action.label}</Text>
        <Text style={[styles.hint, { color: c.textMuted }]} numberOfLines={1}>{action.hint}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
    </PressableScale>
  );
}

export default function QuickLogSheet({
  open, onClose, onLogWater, loggingWater, waterToday, waterGoal,
}: {
  open: boolean;
  onClose: () => void;
  onLogWater: () => Promise<unknown>;
  loggingWater?: boolean;
  waterToday?: number | null;
  waterGoal?: number | null;
}) {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  // navigate THEN close, so the sheet isn't still animating away over the top
  // of the screen it just opened
  const go = (path: string) => {
    router.push(path as never);
    onClose();
  };

  const actions: Action[] = [
    {
      key: 'water',
      icon: 'water',
      tint: '#0F7A54',
      wash: '#DCFCE7',
      label: t.logWater,
      hint: `${waterToday ?? 0} / ${waterGoal ?? 8}`,
      busy: loggingWater,
      // stays open on failure — closing on an error would hide the toast that
      // explains it, and the user would think it worked
      onPress: () => { onLogWater().then(onClose).catch(() => {}); },
    },
    {
      key: 'dose',
      icon: 'medkit',
      tint: '#0F7A54',
      wash: '#DCFCE7',
      label: t.logDose,
      hint: t.medsTitle,
      onPress: () => go('/(home)/medications'),
    },
    {
      key: 'checkin',
      icon: 'happy',
      tint: '#B45309',
      wash: '#FEF3C7',
      label: t.checkInTitle,
      hint: t.checkInRowSub,
      onPress: () => go('/(home)/check-in'),
    },
    {
      key: 'routines',
      icon: 'repeat',
      tint: '#0F7A54',
      wash: '#DCFCE7',
      label: t.routinesTitle,
      hint: t.routinesRowSub,
      onPress: () => go('/(home)/routines'),
    },
    {
      key: 'record',
      icon: 'folder',
      tint: '#B45309',
      wash: '#FEF3C7',
      label: t.recordsTitle,
      hint: t.recordsSub,
      onPress: () => go('/(home)/records'),
    },
  ];

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      {/* tapping the dimmed area closes it — the standard way out of a sheet,
          and the only one that doesn't need a button explaining itself */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View
        style={[
          styles.sheet,
          { backgroundColor: c.bg, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.borderStrong }]} />

        <Text style={[styles.title, { color: c.text }]}>{t.quickLogTitle}</Text>

        <View style={{ gap: 10, marginTop: 14 }}>
          {actions.map((action) => <Row key={action.key} action={action} />)}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9,25,19,0.45)' },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 1 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  hint: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
});
