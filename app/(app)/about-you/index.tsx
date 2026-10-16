// "About you": shown once after an account is made with Google or Apple, which skip the signup
// form. Name (prefilled from the provider) and gender are optional; the phone's time zone is saved.
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Heading, PrimaryButton, LinkText } from '@/components/ui';
import { ChoiceTiles, FormField, FormGroup, type TileIcon } from '@/components/native-form';
import { FadeIn } from '@/components/motion';
import { useErrorBanner } from '@/components/notice';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/errors';
import { detectedZone } from '@/lib/reminder-plan';
import { type Choice } from '@/components/ui';
import {
  SET_PREFERENCES,
  UPDATE_PROFILE,
  type AuthUser,
  type Gender,
} from '@/graphql/auth';

export default function AboutYou() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { user, setUser } = useSession();

  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState('');
  useErrorBanner(error);

  const [updateProfile, { loading }] = useMutation<{ updateProfile: AuthUser }>(UPDATE_PROFILE);
  const [setPreferences] = useMutation<{ setPreferences: AuthUser }>(SET_PREFERENCES);

  const genders: readonly (Choice<Gender> & { icon: TileIcon })[] = [
    { value: 'female', label: t.genderFemale, icon: 'female' },
    { value: 'male', label: t.genderMale, icon: 'male' },
    { value: 'unspecified', label: t.genderUnspecified, icon: 'person' },
  ];

  // Days are counted in the phone's time zone; it can be changed later in Preferences.
  const saveZone = async () => {
    const zone = detectedZone();
    if (!zone || zone === user?.timezone) return;
    try {
      const prefs = await setPreferences({ variables: { input: { timezone: zone } } });
      if (prefs.data?.setPreferences) setUser(prefs.data.setPreferences);
    } catch {
      // ignore: the default zone stays until it is changed in Preferences
    }
  };

  const done = () => router.replace('/dashboard');

  const save = async () => {
    setError('');
    const input: { name?: string; gender?: Gender } = {};
    if (name.trim() && name.trim() !== user?.name) input.name = name.trim();
    if (gender) input.gender = gender;
    try {
      if (Object.keys(input).length > 0) {
        const { data } = await updateProfile({ variables: { input } });
        if (data?.updateProfile) setUser(data.updateProfile);
      }
      await saveZone();
      done();
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  const skip = async () => {
    await saveZone();
    done();
  };

  return (
    <Screen>
      <FadeIn>
        <Heading title={t.aboutTitle} sub={t.aboutSub} />
      </FadeIn>

      <Gap h={24} />
      <FadeIn delay={80}>
        <FormGroup>
          <FormField
            label={t.nameLabel}
            value={name}
            onChangeText={setName}
            placeholder={t.nameHint}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={80}
          />
        </FormGroup>
      </FadeIn>

      <Gap h={22} />
      <FadeIn delay={140}>
        <ChoiceTiles<Gender>
          label={t.genderLabel}
          options={genders}
          value={gender}
          onChange={setGender}
          hint={t.genderWhy}
        />
      </FadeIn>

      <Gap h={26} />
      <FadeIn delay={200}>
        <PrimaryButton label={t.aboutCta} onPress={save} busy={loading} />
      </FadeIn>
      <Gap h={16} />
      <View style={{ alignItems: 'center' }}>
        <LinkText label={t.aboutSkip} onPress={skip} />
      </View>

      <Spacer />
      <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]}>{t.legal}</Text>
    </Screen>
  );
}
