// Placeholder for the Terms and Privacy pages until the real text exists.
import React from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Spacer } from '@/components/screen';
import { Heading, BackButton, InfoNote } from '@/components/ui';
import { useLang } from '@/theme/i18n';

export default function Legal() {
  const router = useRouter();
  const { t } = useLang();
  const { doc } = useLocalSearchParams<{ doc?: 'terms' | 'privacy' }>();

  const title = doc === 'privacy' ? t.privacyLink : t.termsLink;

  return (
    <Screen>
      <BackButton onPress={() => router.back()} label={t.back} />
      <View style={{ height: 26 }} />
      <Heading title={title} />
      <View style={{ height: 20 }} />
      <InfoNote>{t.legalPending}</InfoNote>
      <Spacer />
    </Screen>
  );
}
