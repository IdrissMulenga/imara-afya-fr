// app/(auth)/profile.tsx — profile setup screen.
// Fields match the backend `completeProfile` input: image, height, weight, religion.
// (Gender is collected at signup, so it isn't here.)
// The photo is downsized to a small avatar and stored inline on the user.
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useProfile from '@/hooks/use-profile';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';
import AvatarPicker from '@/components/profile/avatar-picker';
import NumberField from '@/components/profile/number-field';
import ReligionPicker from '@/components/profile/religion-picker';

export default function ProfileScreen() {
  const { c, dark, radius } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();

  // these map 1:1 to the backend CompleteProfileInput
  const [image, setImage] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [religion, setReligion] = useState('');

  const { completeProfile, loading, error } = useProfile();
  const toast = useToast();

  const finish = async () => {
    try {
      // downsizes the photo to a small avatar, then saves the profile
      await completeProfile({ imageUri: image, height, weight, religion });
      toast.success(t.profileSaved);
      router.replace('/(home)');
    } catch (err) {
      // show the backend's GraphQL message
      toast.error(errorMessage(err, t.errGeneric));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      {/* top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.iconBtn, { backgroundColor: c.fieldBg, borderColor: c.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Pressable hitSlop={8} onPress={() => router.replace('/(home)')}>
          <Text style={[styles.skip, { color: c.primary }]}>{t.skip}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: c.text }]}>{t.profileTitle}</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>{t.profileSub}</Text>

        {/* photo */}
        <View style={{ height: 26 }} />
        <AvatarPicker value={image} onPick={setImage} />

        {/* height + weight */}
        <View style={{ height: 26 }} />
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

        {!!error && (
          <View style={styles.errRow}>
            <Ionicons name="alert-circle" size={14} color={c.danger} />
            <Text style={[styles.errText, { color: c.danger }]}>{error}</Text>
          </View>
        )}

        <View style={{ height: 34 }} />
        <Pressable
          onPress={finish}
          disabled={loading}
          style={({ pressed }) => [
            styles.primary,
            {
              backgroundColor: c.primary,
              borderRadius: radius,
              shadowColor: c.primary,
              transform: [{ scale: pressed ? 0.975 : 1 }],
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <>
              <Text style={[styles.primaryLabel, { color: c.onPrimary }]}>{t.finish}</Text>
              <Ionicons name="arrow-forward" size={18} color={c.onPrimary} />
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  skip: { fontSize: 14, fontWeight: '700' },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  sub: { marginTop: 9, fontSize: 15, fontWeight: '500', lineHeight: 21 },
  row: { flexDirection: 'row', gap: 12 },
  fieldHead: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  fieldHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optional: { fontSize: 11.5, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 17,
    shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  primaryLabel: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.2 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  errText: { fontSize: 12.5, fontWeight: '600', flexShrink: 1 },
});
