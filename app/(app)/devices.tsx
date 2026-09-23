// Trusted devices: phones that can sign in without an emailed code.
// The current phone is marked and cannot be removed here. Trust expires after 90 days.
import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { ErrorNote, LinkText, QuietButton } from '@/components/ui';
import { AppHeader } from '@/components/header';
import { Glass } from '@/components/glass';
import { Badge, Divider } from '@/components/panel';
import { FadeIn } from '@/components/motion';
import { useNotice } from '@/components/notice';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T, font } from '@/theme/tokens';
import { APP_COPY, shortDate } from '@/theme/copy-app';
import { errorMessage } from '@/lib/errors';
import { MY_TRUSTED_DEVICES, REVOKE_TRUSTED_DEVICE, type TrustedDevice } from '@/graphql/auth';

export default function Devices() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const a = APP_COPY[lang];
  const notice = useNotice();

  const [error, setError] = useState('');

  // Always fetched from the network. Apollo 4's useQuery returns the error (no onError).
  const { data, loading, error: queryError, refetch } = useQuery<{
    myTrustedDevices: TrustedDevice[];
  }>(MY_TRUSTED_DEVICES, { fetchPolicy: 'network-only' });

  const [revoke, { loading: revoking }] = useMutation(REVOKE_TRUSTED_DEVICE);

  const devices = data?.myTrustedDevices ?? [];
  const others = devices.filter((device) => !device.current);

  const remove = async (id?: string) => {
    if (!id) return;
    setError('');
    try {
      await revoke({ variables: { id } });
      await refetch();
      notice.success(a.revoked, a.trustedDevices);
    } catch (e) {
      setError(errorMessage(e, lang));
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          title={a.trustedDevices}
          subtitle={a.trustedDevicesNote}
          backLabel={t.back}
          onBack={() => router.back()}
        />
      }
    >

      {/* Either the list or a revoke failed; the revoke error takes priority. */}
      {error || queryError ? (
        <View style={{ marginBottom: 16 }}>
          <ErrorNote message={error || errorMessage(queryError, lang)} />
        </View>
      ) : null}

      {loading && devices.length === 0 ? (
        <Glass style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={c.primary} />
        </Glass>
      ) : (
        <FadeIn delay={110}>
          <Glass style={{ padding: 16 }}>
            <View style={{ gap: 14 }}>
              {devices.map((device, index) => (
                <React.Fragment key={device.id}>
                  {index > 0 ? <Divider /> : null}

                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text
                        style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.text, flex: 1 }}
                        numberOfLines={1}
                      >
                        {device.label}
                      </Text>
                      {device.current ? <Badge text={a.thisPhone} tone="good" /> : null}
                    </View>

                    <Text style={[T.fine, { color: c.muted }]}>
                      {a.lastSeen}: {shortDate(device.lastSeenAt, lang) ?? '—'}
                    </Text>
                    <Text style={[T.fine, { color: c.faint }]}>
                      {a.trustEnds}: {shortDate(device.expiresAt, lang) ?? '—'}
                    </Text>

                    {/* No Remove button for the current phone. */}
                    {!device.current ? (
                      <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                        <LinkText
                          label={revoking ? `${a.revoke}…` : a.revoke}
                          onPress={() => remove(device.id)}
                        />
                      </View>
                    ) : null}
                  </View>
                </React.Fragment>
              ))}

              {others.length === 0 && devices.length > 0 ? (
                <>
                  <Divider />
                  <Text style={[T.fine, { color: c.faint }]}>{a.noDevices}</Text>
                </>
              ) : null}
            </View>
          </Glass>
        </FadeIn>
      )}

      <Gap h={20} />
      <QuietButton label={a.retry} onPress={() => void refetch()} />

      <Spacer />
    </Screen>
  );
}
