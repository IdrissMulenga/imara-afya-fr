// app/(home)/more.tsx — everything that doesn't fit in the tab bar.
// Ramadan mode, guidance, find care, and the profile.
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useMe from '@/hooks/use-me';
import { useToast } from '@/components/toast';
import LanguagePicker from '@/components/language-picker';
import { FadeIn, PressableScale } from '@/components/motion';

function Row({
  icon,
  tint,
  title,
  subtitle,
  onPress,
  disabled,
  badge,
  index = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  disabled?: boolean;
  badge?: string;
  index?: number;
}) {
  const { c } = useTheme();

  return (
    <FadeIn index={index}>
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
      >
        <View style={[styles.icon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={19} color="#0F7A54" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {!!badge && (
          <View style={[styles.badge, { backgroundColor: c.fieldBg }]}>
            <Text style={[styles.badgeText, { color: c.textMuted }]}>{badge}</Text>
          </View>
        )}

        {!disabled && <Ionicons name="chevron-forward" size={18} color={c.textFaint} />}
      </PressableScale>
    </FadeIn>
  );
}

export default function MoreScreen() {
  const { c } = useTheme();
  const { t } = useStrings();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { me } = useMe();

  // Ramadan mode is aimed at Muslim users, but never hide it — someone may
  // fast without having set their religion, and religion is optional.
  const ramadanOn = !!me?.ramadanMode;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />

      {/* fixed header — stays put while the body scrolls */}
      <View style={[styles.hero, { backgroundColor: c.heroMid, paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroTitle}>{t.moreTitle}</Text>
        <Text style={styles.heroSub}>{t.moreSub}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.body}>
          <Row
            icon="folder-outline"
            tint="#DBEAFE"
            title={t.recordsTitle}
            subtitle={t.recordsSub}
            onPress={() => router.push('/(home)/records')}
            index={0}
          />

          <Row
            icon="moon-outline"
            tint="#EDE9FE"
            title={t.ramadanTitle}
            subtitle={ramadanOn ? t.ramadanOn : t.ramadanSub}
            badge={ramadanOn ? 'ON' : undefined}
            onPress={() => router.push('/(home)/ramadan')}
            index={1}
          />

          <Row
            icon="book-outline"
            tint="#DCFCE7"
            title={t.guidanceTitle}
            subtitle={t.guidanceSub}
            badge={t.comingSoon}
            disabled
            index={2}
          />

          <Row
            icon="location-outline"
            tint="#FEF3C7"
            title={t.findCareTitle}
            subtitle={t.findCareSub}
            onPress={() => router.push('/(home)/care')}
            index={3}
          />

          <Row
            icon="person-outline"
            tint="#F3E8FF"
            title={t.myProfile}
            subtitle={me?.plan === 'premium' ? t.planPremium : t.planFree}
            onPress={() => router.push('/(home)/profile')}
            index={4}
          />

          {/* ---------------- language ---------------- */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t.settingsTitle}</Text>

          <View style={[styles.langCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.langHead}>
              <View style={[styles.icon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="language-outline" size={19} color="#0F7A54" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: c.text }]}>{t.languageTitle}</Text>
                <Text style={[styles.subtitle, { color: c.textMuted }]}>{t.languageSub}</Text>
              </View>
            </View>

            <View style={{ height: 14 }} />

            {/* switching re-renders the app straight away and is remembered
                on this device, so it survives a restart */}
            <LanguagePicker onChange={() => toast.success(t.languageChanged)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22, paddingBottom: 26,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '500', marginTop: 6 },

  body: { paddingHorizontal: 22, paddingTop: 22, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderWidth: 1, borderRadius: 16,
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  sectionTitle: {
    fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: 20, marginBottom: 2,
  },
  langCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  langHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
