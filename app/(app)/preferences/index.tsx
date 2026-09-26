// Preferences: language, units, time zone and cycle tracking.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { Field, PrimaryButton, ErrorNote, LinkText } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, OptionList, SwitchRow, Divider } from '@/components/panel';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { useLang, LANGS, COPY, type Lang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { SET_PREFERENCES, type AuthUser, type Units } from '@/graphql/auth';

/** The time zone the phone reports, or null if unavailable. */
const detectedZone = (): string | null => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && zone !== 'UTC' ? zone : null;
  } catch {
    return null;
  }
};

// Time zones offered in the list.
const REGION_ZONES = [
  'Africa/Bujumbura',
  'Africa/Kigali',
  'Africa/Kinshasa',
  'Africa/Dar_es_Salaam',
  'Africa/Nairobi',
  'Africa/Kampala',
  'Europe/Brussels',
  'Europe/Paris',
  'UTC',
] as const;

export default function Preferences() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const { c } = useTheme();
  const { user, setUser } = useSession();
  const notice = useNotice();

  const a = APP_COPY[lang];

  const [language, setLanguage] = useState<Lang>(user?.language ?? lang);
  const [units, setUnits] = useState<Units>(user?.units ?? 'metric');
  const [zone, setZone] = useState(user?.timezone ?? '');
  const [cycle, setCycle] = useState(Boolean(user?.cycleTrackingEnabled));
  // Cycle (period) tracking is only offered to women.
  const showCycle = user?.gender === 'female';
  const [typing, setTyping] = useState(false);

  const [error, setError] = useState('');

  const [setPreferences, { loading }] = useMutation<{ setPreferences: AuthUser }>(SET_PREFERENCES);

  // Leaving without saving restores the account language.
  const accountLanguage = useRef(user?.language);
  accountLanguage.current = user?.language;
  useEffect(
    () => () => {
      if (accountLanguage.current) setLang(accountLanguage.current);
    },
    [setLang],
  );

  const detected = useMemo(detectedZone, []);

  // Detected zone first, then the region, then the current value if it is none of those.
  const zoneOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string; hint?: string }[] = [];

    const add = (value: string, hint?: string) => {
      if (!value || seen.has(value)) return;
      seen.add(value);
      list.push({ value, label: value.replace(/_/g, ' ').replace('/', ' / '), hint });
    };

    if (detected) add(detected, a.useDetectedZone);
    REGION_ZONES.forEach((value) => add(value));
    if (user?.timezone) add(user.timezone);

    return list;
  }, [detected, user?.timezone, a.useDetectedZone]);

  const languages = useMemo(
    () => LANGS.map((code) => ({ value: code, label: COPY[code].label })),
    [],
  );

  const unitOptions: readonly { value: Units; label: string; hint: string }[] = [
    { value: 'metric', label: a.unitsMetric, hint: 'kg · cm' },
    { value: 'imperial', label: a.unitsImperial, hint: 'lb · ft' },
  ];

  const dirty = useMemo(
    () =>
      Boolean(user) &&
      (language !== user!.language ||
        units !== user!.units ||
        zone !== user!.timezone ||
        cycle !== user!.cycleTrackingEnabled),
    [user, language, units, zone, cycle],
  );

  const changed = useMemo((): string[] => {
    if (!user) return [];
    const list: string[] = [];
    if (language !== user.language) list.push(COPY[language].label);
    if (units !== user.units) list.push(units === 'metric' ? a.unitsMetric : a.unitsImperial);
    if (zone !== user.timezone) list.push(zone);
    if (cycle !== user.cycleTrackingEnabled) {
      list.push(`${a.cycleTracking}: ${cycle ? 'on' : 'off'}`);
    }
    return list;
  }, [user, language, units, zone, cycle, a]);

  const reset = () => {
    if (!user) return;
    setLanguage(user.language);
    setUnits(user.units);
    setZone(user.timezone);
    setCycle(user.cycleTrackingEnabled);
    setTyping(false);
    setError('');
    // Also restore the app language, which the picker previews live.
    setLang(user.language);
  };

  if (!user) return <Screen />;

  const save = async () => {
    setError('');
    const fields = changed;

    try {
      const { data } = await setPreferences({
        variables: {
          input: {
            language,
            units,
            ...(zone.trim() ? { timezone: zone.trim() } : {}),
            cycleTrackingEnabled: showCycle ? cycle : false,
          },
        },
      });
      if (data?.setPreferences) {
        setUser(data.setPreferences);
        notice.success(a.saved, a.appPreferences);
        notice.toast(fields.length ? fields.join(' · ') : a.saved);
      }
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {dirty ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[T.fine, { color: c.muted }]}>{a.unsaved}</Text>
              <LinkText label={a.discard} onPress={reset} />
            </View>
          ) : null}
          <PrimaryButton label={a.save} onPress={save} busy={loading} disabled={!dirty} />
        </View>
      }
      header={
        <AppHeader title={a.appPreferences} backLabel={t.back} onBack={() => router.back()} />
      }
    >

      <FadeIn delay={100}>
        <Section title={a.language}>
          {/* Changing the language applies it immediately, before Save. */}
          <OptionList<Lang>
            options={languages}
            value={language}
            onChange={(next) => {
              setLanguage(next);
              setLang(next, false);
            }}
          />
        </Section>
      </FadeIn>

      <Gap h={18} />

      <FadeIn delay={150}>
        <Section title={a.units}>
          <OptionList<Units> options={unitOptions} value={units} onChange={setUnits} />
        </Section>
      </FadeIn>

      <Gap h={18} />

      <FadeIn delay={200}>
        <Section title={a.timezone}>
          <Text style={[T.fine, { color: c.faint }]}>{a.timezoneNote}</Text>

          {typing ? (
            <Field
              label={a.timezone}
              value={zone}
              onChangeText={setZone}
              placeholder="Africa/Bujumbura"
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <OptionList options={zoneOptions} value={zone} onChange={setZone} />
          )}

          <Divider />
          <LinkText
            label={typing ? a.cancel : a.otherZone}
            onPress={() => setTyping((v) => !v)}
          />
        </Section>
      </FadeIn>

      {showCycle ? (
        <>
          <Gap h={18} />
          <FadeIn delay={250}>
            <Section title={a.cycleTracking}>
              <SwitchRow label={a.cycleTracking} hint={a.cycleNote} value={cycle} onChange={setCycle} />
            </Section>
          </FadeIn>
        </>
      ) : null}

      {error ? (
        <View style={{ marginTop: 18 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

    </Screen>
  );
}
