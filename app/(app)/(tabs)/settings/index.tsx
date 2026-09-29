// Settings hub: each row shows its current value and opens a screen for that group.
import React from 'react';
import { View, Text, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { QuietButton, ChoiceRow } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { NavRow, Badge, Divider, IdentityCard, SwitchRow, OptionList } from '@/components/panel';
import { useNotice } from '@/components/notice';
import { supported as notificationsSupported, useNotificationsBlocked } from '@/lib/notifications';
import { useWaterReminders, sendTestWaterReminder } from '@/lib/water-reminders';
import { useCheckInNotifications } from '@/lib/checkin-reminders';
import { BedtimeRemindersSwitch } from '@/components/sleep-schedule';
import { useCycleReminders } from '@/lib/cycle-reminders';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang, COPY, LANGS, type Lang } from '@/theme/i18n';
import { useTheme, THEME_MODES, type ThemeMode } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY, ageFrom } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { SET_PREFERENCES, type AuthUser } from '@/graphql/auth';

const LANGUAGE_OPTIONS = LANGS.map((code) => ({ value: code, label: COPY[code].label }));

/** A small grey heading above a group. */
function SectionTitle({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <Text style={[T.label, { color: c.faint, marginLeft: 2, marginBottom: 10 }]}>{text}</Text>
  );
}

/** A card of rows with dividers between them. */
function Group({ children }: { children: React.ReactNode }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <Glass style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
      {rows.map((row, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <Divider /> : null}
          <View style={{ paddingVertical: 6 }}>{row}</View>
        </React.Fragment>
      ))}
    </Glass>
  );
}

export default function Settings() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const { c, mode, setMode } = useTheme();
  const { user, setUser, signOut, refreshUser } = useSession();
  const notice = useNotice();
  const reminders = useWaterReminders();
  const checkInNotes = useCheckInNotifications();
  const cycleReminders = useCycleReminders();
  const blocked = useNotificationsBlocked();
  const [savePreferences] = useMutation<{ setPreferences: AuthUser }>(SET_PREFERENCES);

  const a = APP_COPY[lang];

  if (!user) return <Screen />;

  const themeOptions = THEME_MODES.map((value) => ({
    value,
    label: { system: a.themeSystem, light: a.themeLight, dark: a.themeDark }[value],
  }));

  // Shows the new language at once and saves it to the account; goes back if saving fails.
  const changeLanguage = async (next: Lang) => {
    if (next === user.language) return;
    setLang(next, false);
    try {
      const { data } = await savePreferences({ variables: { input: { language: next } } });
      if (data?.setPreferences) setUser(data.setPreferences);
    } catch (e) {
      setLang(user.language, false);
      notice.failure(a.language, errorMessage(e, user.language));
    }
  };

  // Row subtitles come from the stored values.
  const age = ageFrom(user.birthDate);
  const personal =
    [
      user.name || null,
      age != null ? `${age} ${a.years}` : null,
      user.heightCm != null ? `${user.heightCm}cm` : null,
      user.weightKg != null ? `${user.weightKg}kg` : null,
    ]
      .filter(Boolean)
      .join(' · ') || a.notSet;

  const goals = `${user.stepGoal.toLocaleString()} ${a.steps} · ${user.waterGoalGlasses} ${a.glasses} · ${user.sleepGoalHours}${a.hours.slice(0, 1)}`;

  const units = user.units === 'metric' ? a.unitsMetric : a.unitsImperial;

  return (
    <Screen
      onRefresh={refreshUser}
      header={<AppHeader title={a.settings} />}
      tabbed
    >

      <FadeIn delay={100}>
        <IdentityCard
          name={user.name}
          email={user.email}
          photoUrl={user.photoUrl}
          action={a.personalDetails}
          onPress={() => router.push('/(app)/profile')}
          badge={
            user.emailVerified ? (
              <Badge text={a.verified} tone="good" />
            ) : (
              <Badge text={a.unverifiedShort} tone="bad" />
            )
          }
        />
      </FadeIn>

      {!user.emailVerified ? (
        <FadeIn delay={140}>
          <Gap h={12} />
          <QuietButton
            label={a.confirmNow}
            onPress={() =>
              router.push({
                pathname: '/(auth)/verify',
                params: { email: user.email, masked: user.email, purpose: 'SIGNUP' },
              })
            }
          />
        </FadeIn>
      ) : null}

      <Gap h={26} />

      <FadeIn delay={180}>
        <SectionTitle text={a.youSection} />
        <Group>
          <NavRow
            label={a.personalDetails}
            hint={personal}
            onPress={() => router.push('/(app)/profile')}
          />
          <NavRow label={a.dailyGoals} hint={goals} onPress={() => router.push('/(app)/goals')} />
        </Group>
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={220}>
        <SectionTitle text={a.appearanceSection} />
        <Group>
          <ChoiceRow<ThemeMode>
            label={a.theme}
            options={themeOptions}
            value={mode}
            onChange={setMode}
            hint={a.themeNote}
          />
          <View style={{ gap: 4 }}>
            <Text style={[T.label, { color: c.faint, marginTop: 4 }]}>{a.language}</Text>
            <OptionList<Lang>
              options={LANGUAGE_OPTIONS}
              value={lang}
              onChange={(next) => void changeLanguage(next)}
            />
          </View>
        </Group>
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={260}>
        <SectionTitle text={a.remindersSection} />
        <Group>
          {!notificationsSupported ? (
            <Text style={[T.fine, { color: c.faint, paddingVertical: 8 }]}>
              {a.remindersNeedApp}
            </Text>
          ) : null}
          {blocked ? (
            <NavRow
              label={a.notificationsBlocked}
              hint={a.openPhoneSettings}
              danger
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
          {__DEV__ && notificationsSupported ? (
            // Development only, so it never reaches the store build.
            <NavRow
              label="Send a test reminder"
              hint="Shows a water reminder in 5 seconds. Leave the app to see it arrive."
              onPress={() => {
                void sendTestWaterReminder(lang).then((result) => {
                  if (result === 'denied') notice.failure(a.waterReminders, a.notificationsDenied);
                  else notice.toast('Reminder in 5 seconds');
                });
              }}
            />
          ) : null}
          {reminders.supported ? (
            <SwitchRow
              label={a.waterReminders}
              hint={a.waterRemindersNote}
              value={reminders.enabled}
              onChange={(on) => {
                if (!on) {
                  void reminders.disable();
                  return;
                }
                void reminders.enable().then((result) => {
                  if (result === 'denied') notice.failure(a.waterReminders, a.notificationsDenied);
                });
              }}
            />
          ) : null}
          {checkInNotes.supported ? (
            <SwitchRow
              label={a.moodReminders}
              hint={a.moodRemindersNote}
              value={checkInNotes.mood}
              onChange={(on) => {
                void checkInNotes.setMood(on).then((result) => {
                  if (result === 'denied') notice.failure(a.moodReminders, a.notificationsDenied);
                });
              }}
            />
          ) : null}
          {checkInNotes.supported ? (
            <SwitchRow
              label={a.warmMessages}
              hint={a.warmMessagesNote}
              value={checkInNotes.warm}
              onChange={(on) => {
                void checkInNotes.setWarm(on).then((result) => {
                  if (result === 'denied') notice.failure(a.warmMessages, a.notificationsDenied);
                });
              }}
            />
          ) : null}
          {checkInNotes.supported ? <BedtimeRemindersSwitch /> : null}
          {cycleReminders.supported && user.gender === 'female' ? (
            <SwitchRow
              label={a.cycleReminders}
              hint={a.cycleRemindersNote}
              value={cycleReminders.enabled}
              onChange={(on) => {
                void cycleReminders.set(on).then((result) => {
                  if (result === 'denied') notice.failure(a.cycleReminders, a.notificationsDenied);
                });
              }}
            />
          ) : null}
        </Group>
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={300}>
        <SectionTitle text={a.appSection} />
        <Group>
          <NavRow
            label={a.appPreferences}
            hint={user.timezone}
            value={units}
            onPress={() => router.push('/(app)/preferences')}
          />
        </Group>
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={340}>
        <SectionTitle text={a.sectionSecurity} />
        <Group>
          <NavRow
            label={a.changePassword}
            hint={a.changePasswordNote}
            onPress={() => router.push('/(app)/password')}
          />
          <NavRow
            label={a.trustedDevices}
            hint={a.trustedDevicesNote}
            onPress={() => router.push('/(app)/devices')}
          />
        </Group>
      </FadeIn>

      <Gap h={22} />

      <FadeIn delay={380}>
        <SectionTitle text={a.sectionAccount} />
        <Group>
          <NavRow label={t.signOut} onPress={signOut} />
          <NavRow
            label={a.deleteAccount}
            hint={a.deleteAccountNote}
            danger
            onPress={() => router.push('/(app)/delete-account')}
          />
        </Group>
      </FadeIn>

      <Spacer />
      <Gap h={22} />
      <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]}>{t.legalPending}</Text>
    </Screen>
  );
}
