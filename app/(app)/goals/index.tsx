// Goals: steps, water and sleep, set with steppers.
// Limits match the backend: steps 500-100,000, water 1-30, sleep 3-14.
import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Gap } from '@/components/screen';
import { PrimaryButton, ErrorNote, LinkText } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Section, Stepper } from '@/components/panel';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { APP_COPY } from '@/theme/copy-app';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { SET_PREFERENCES, type AuthUser } from '@/graphql/auth';

export default function Goals() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, setUser } = useSession();
  const notice = useNotice();

  const a = APP_COPY[lang];

  const [steps, setSteps] = useState(user?.stepGoal ?? 8000);
  const [water, setWater] = useState(user?.waterGoalGlasses ?? 8);
  const [sleep, setSleep] = useState(user?.sleepGoalHours ?? 8);

  const [error, setError] = useState('');

  const [setPreferences, { loading }] = useMutation<{ setPreferences: AuthUser }>(SET_PREFERENCES);

  const dirty = useMemo(
    () =>
      Boolean(user) &&
      (steps !== user!.stepGoal || water !== user!.waterGoalGlasses || sleep !== user!.sleepGoalHours),
    [user, steps, water, sleep],
  );

  // Each changed goal with its new value, for the confirmation.
  const changed = useMemo((): string[] => {
    if (!user) return [];
    const list: string[] = [];
    if (steps !== user.stepGoal) list.push(`${steps.toLocaleString()} ${a.steps}`);
    if (water !== user.waterGoalGlasses) list.push(`${water} ${a.glasses}`);
    if (sleep !== user.sleepGoalHours) list.push(`${sleep} ${a.hours}`);
    return list;
  }, [user, steps, water, sleep, a]);

  const reset = () => {
    if (!user) return;
    setSteps(user.stepGoal);
    setWater(user.waterGoalGlasses);
    setSleep(user.sleepGoalHours);
    setError('');
  };

  if (!user) return <Screen />;

  const save = async () => {
    setError('');
    const fields = changed;

    try {
      const { data } = await setPreferences({
        variables: {
          input: { stepGoal: steps, waterGoalGlasses: water, sleepGoalHours: sleep },
        },
      });
      if (data?.setPreferences) {
        setUser(data.setPreferences);
        notice.success(a.saved, a.dailyGoals);
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
        <AppHeader
          title={a.dailyGoals}
          subtitle={a.stepGoalNote}
          backLabel={t.back}
          onBack={() => router.back()}
        />
      }
    >

      <FadeIn delay={100}>
        <Section title={a.sectionGoals}>
          <Stepper
            label={a.stepGoal}
            hint={a.stepGoalNote}
            value={steps}
            onChange={setSteps}
            min={500}
            max={100_000}
            step={500}
            suffix={`${a.steps} ${a.perDay}`}
            lessLabel={`${a.less} — ${a.stepGoal}`}
            moreLabel={`${a.more} — ${a.stepGoal}`}
          />
        </Section>
      </FadeIn>

      <Gap h={18} />

      <FadeIn delay={150}>
        <Section title={a.waterGoal}>
          <Stepper
            label={a.waterGoal}
            hint={a.waterGoalNote}
            value={water}
            onChange={setWater}
            min={1}
            max={30}
            step={1}
            suffix={`${a.glasses} ${a.perDay}`}
            lessLabel={`${a.less} — ${a.waterGoal}`}
            moreLabel={`${a.more} — ${a.waterGoal}`}
          />
        </Section>
      </FadeIn>

      <Gap h={18} />

      <FadeIn delay={200}>
        <Section title={a.sleepGoal}>
          <Stepper
            label={a.sleepGoal}
            hint={a.sleepGoalNote}
            value={sleep}
            onChange={setSleep}
            min={3}
            max={14}
            step={0.5}
            suffix={`${a.hours} ${a.perNight}`}
            lessLabel={`${a.less} — ${a.sleepGoal}`}
            moreLabel={`${a.more} — ${a.sleepGoal}`}
          />
        </Section>
      </FadeIn>

      {error ? (
        <View style={{ marginTop: 18 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

    </Screen>
  );
}
