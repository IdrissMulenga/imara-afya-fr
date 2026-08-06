// app/(home)/profile.tsx — view + edit your profile.
// Reachable from the dashboard avatar. Lets the user finish a profile they
// skipped, rename themselves, or swap their photo at any time.
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useMe from '@/hooks/use-me';
import useProfile from '@/hooks/use-profile';
import useAuth from '@/hooks/use-auth';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import TextField from '@/components/text-field';
import AvatarPicker from '@/components/profile/avatar-picker';
import NumberField from '@/components/profile/number-field';
import ReligionPicker from '@/components/profile/religion-picker';
import DeleteAccountSheet from '@/components/profile/delete-account-sheet';
import { PressableScale } from '@/components/motion';
import SwipeBack from '@/components/swipe-back';

export default function ProfileScreen() {
  const { c, dark, radius } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { me, loading: loadingMe } = useMe();
  const { completeProfile, deleteAccount, loading: saving } = useProfile();
  const { logout } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [religion, setReligion] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // PREFILL EXACTLY ONCE.
  //
  // `me` is a new object every time any query writes the user back to the cache
  // — and with cache-and-network that happens on mount, on every dashboard
  // refetch, and after each save. Without this guard the effect re-ran mid-edit
  // and overwrote whatever she had typed or the photo she had just picked,
  // which is why editing appeared to do nothing.
  const prefilled = useRef(false);

  useEffect(() => {
    if (!me || prefilled.current) return;

    prefilled.current = true;

    setFirstName(me.firstName ?? '');
    setLastName(me.lastName ?? '');
    setImage(me.image ?? null);
    setHeight(me.height != null ? String(me.height) : '');
    setWeight(me.weight != null ? String(me.weight) : '');
    setReligion(me.religion ?? '');
  }, [me]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t.errName);
      return;
    }
    try {
      await completeProfile({ firstName, lastName, imageUri: image, height, weight, religion });
      toast.success(t.profileSaved);
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const onDelete = async (password: string) => {
    setDeleting(true);
    try {
      await deleteAccount(password);

      // the account no longer exists, so clear the token before navigating —
      // otherwise the next screen fires authed queries against a dead user
      await logout();

      setDeleteOpen(false);
      toast.success(t.accountDeleted);
      router.replace('/(auth)/signup');
    } catch (err) {
      toast.error(errorMessage(err, t.errGeneric));
    } finally {
      setDeleting(false);
    }
  };

  if (loadingMe && !me) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <SwipeBack style={{ backgroundColor: c.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      {/* top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* profile is a tab now — only offer "back" when we actually got here
            from another screen, e.g. the dashboard avatar */}
        {router.canGoBack() ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: c.fieldBg, borderColor: c.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </Pressable>
        ) : (
          <View style={styles.iconBtnSpacer} />
        )}
        <Text style={[styles.topTitle, { color: c.text }]}>{t.myProfile}</Text>
        <Pressable onPress={signOut} hitSlop={8}>
          <Text style={[styles.signOut, { color: c.danger }]}>{t.signOut}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 8, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* photo — tap to change any time */}
        <View style={{ height: 12 }} />
        <AvatarPicker value={image} onPick={setImage} />

        {/* email (read-only — not editable on the backend) */}
        {!!me?.email && (
          <View style={[styles.emailRow, { backgroundColor: c.fieldBg, borderRadius: radius }]}>
            <Ionicons name="mail-outline" size={17} color={c.textFaint} />
            <Text style={[styles.emailText, { color: c.textMuted }]} numberOfLines={1}>
              {me.email}
            </Text>
          </View>
        )}

        {/* names */}
        <View style={{ height: 22 }} />
        <View style={{ gap: 16 }}>
          <TextField
            label={t.firstNameLabel}
            icon="person-outline"
            placeholder={t.firstNameLabel}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextField
            label={t.lastNameLabel}
            icon="person-outline"
            placeholder={t.lastNameLabel}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>

        {/* height + weight */}
        <View style={{ height: 22 }} />
        <View style={styles.row}>
          <NumberField label={t.heightLabel} placeholder={t.heightPh} value={height} onChangeText={setHeight} />
          <NumberField label={t.weightLabel} placeholder={t.weightPh} value={weight} onChangeText={setWeight} />
        </View>

        {/* religion */}
        <View style={{ height: 22 }} />
        <View style={styles.fieldHeadRow}>
          <Text style={[styles.fieldHead, { color: c.textMuted }]}>{t.religionLabel}</Text>
          <Text style={[styles.optional, { color: c.textFaint, backgroundColor: c.fieldBg }]}>{t.optional}</Text>
        </View>
        <View style={{ height: 9 }} />
        <ReligionPicker value={religion} onChange={setReligion} />

        {/* plan */}
        <View style={{ height: 22 }} />
        <View style={[styles.planRow, { backgroundColor: c.fieldBg, borderRadius: radius }]}>
          <Ionicons
            name={me?.plan === 'premium' ? 'star' : 'star-outline'}
            size={18}
            color={c.primary}
          />
          <Text style={[styles.planText, { color: c.text }]}>
            {me?.plan === 'premium' ? t.planPremium : t.planFree}
          </Text>
        </View>

        {/* save */}
        <View style={{ height: 30 }} />
        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.primary,
            {
              backgroundColor: c.primary,
              borderRadius: radius,
              shadowColor: c.primary,
              opacity: saving ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.975 : 1 }],
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <>
              <Text style={[styles.primaryLabel, { color: c.onPrimary }]}>{t.saveChanges}</Text>
              <Ionicons name="checkmark" size={18} color={c.onPrimary} />
            </>
          )}
        </Pressable>

        {/* Required by Google Play for any app with sign-up. Placed last and
            styled as a plain text link — findable, but never mistaken for a
            normal action on a screen full of buttons. */}
        <View style={{ height: 34 }} />
        <PressableScale onPress={() => setDeleteOpen(true)} style={styles.deleteLink}>
          <Ionicons name="trash-outline" size={16} color={c.danger} />
          <Text style={[styles.deleteLinkText, { color: c.danger }]}>{t.deleteAccountAction}</Text>
        </PressableScale>
      </ScrollView>

      <DeleteAccountSheet
        visible={deleteOpen}
        deleting={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
      />
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deleteLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12,
  },
  deleteLinkText: { fontSize: 14, fontWeight: '700' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingBottom: 6, gap: 12,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  //keeps the title centred when there's no back button
  iconBtnSpacer: { width: 40, height: 40 },
  topTitle: { fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  signOut: { fontSize: 14, fontWeight: '700' },

  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14, marginTop: 18,
  },
  emailText: { flex: 1, fontSize: 14, fontWeight: '600' },

  row: { flexDirection: 'row', gap: 12 },
  fieldHead: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  fieldHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optional: { fontSize: 11.5, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 14, paddingHorizontal: 14 },
  planText: { fontSize: 14.5, fontWeight: '700' },

  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 17,
    shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  primaryLabel: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.2 },
});
