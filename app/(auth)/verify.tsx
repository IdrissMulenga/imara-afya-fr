// Six-digit code screen for all three purposes:
//   LOGIN   verifyLoginOtp
//   SIGNUP  verifyEmailOtp
//   RESET   verifyPasswordResetOtp
// Expiry comes from the server; resend is allowed after 60 seconds.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Screen, Spacer, Gap } from '@/components/screen';
import { Heading, PrimaryButton, BackButton, ErrorNote, LinkText } from '@/components/ui';
import { OtpInput, CODE_LENGTH } from '@/components/otp-input';
import { Glass } from '@/components/glass';
import { FadeIn } from '@/components/motion';
import { useLang } from '@/theme/i18n';
import { useTheme } from '@/theme/theme';
import { type as T } from '@/theme/tokens';
import { useSession } from '@/lib/session';
import { errorWithWait } from '@/lib/errors';
import { getDeviceId, getDeviceLabel } from '@/lib/device';
import {
  VERIFY_LOGIN_OTP,
  RESEND_LOGIN_OTP,
  VERIFY_EMAIL_OTP,
  RESEND_EMAIL_OTP,
  VERIFY_PASSWORD_RESET_OTP,
  RESEND_PASSWORD_RESET_OTP,
  type AuthPayload,
  type AuthUser,
} from '@/graphql/auth';

type Purpose = 'LOGIN' | 'SIGNUP' | 'RESET';

const RESEND_COOLDOWN = 60;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.max(0, seconds % 60)).padStart(2, '0')}`;

export default function Verify() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { c } = useTheme();
  const { signIn, setUser } = useSession();

  const params = useLocalSearchParams<{
    email?: string;
    masked?: string;
    purpose?: Purpose;
    expiresAt?: string;
  }>();
  const purpose: Purpose = (params.purpose as Purpose) ?? 'LOGIN';
  const email = params.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [expiresIn, setExpiresIn] = useState(() => {
    if (!params.expiresAt) return 600;
    const left = Math.floor((Date.parse(params.expiresAt) - Date.now()) / 1000);
    return Number.isFinite(left) && left > 0 ? left : 600;
  });

  const [verifyLogin, loginState] = useMutation<{ verifyLoginOtp: AuthPayload }>(VERIFY_LOGIN_OTP);
  const [verifyEmail, emailState] = useMutation<{ verifyEmailOtp: AuthUser }>(VERIFY_EMAIL_OTP);
  const [verifyReset, resetState] = useMutation<{
    verifyPasswordResetOtp: { resetToken: string; expiresAt: string };
  }>(VERIFY_PASSWORD_RESET_OTP);

  const [resendLogin] = useMutation(RESEND_LOGIN_OTP);
  const [resendEmail] = useMutation(RESEND_EMAIL_OTP);
  const [resendReset] = useMutation(RESEND_PASSWORD_RESET_OTP);

  const busy = loginState.loading || emailState.loading || resetState.loading;

  // One interval drives both countdowns.
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    tick.current = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  const submit = async (value: string = code) => {
    if (value.length !== CODE_LENGTH) return;
    setError('');

    try {
      if (purpose === 'LOGIN') {
        const [deviceId, deviceLabel] = [await getDeviceId(), getDeviceLabel()];
        const { data } = await verifyLogin({
          variables: { email, input: { code: value, deviceId, deviceLabel } },
        });
        if (data?.verifyLoginOtp) {
          await signIn(data.verifyLoginOtp);
          router.replace('/(app)/dashboard');
        }
        return;
      }

      if (purpose === 'SIGNUP') {
        const { data } = await verifyEmail({ variables: { input: { code: value } } });
        if (data?.verifyEmailOtp) {
          setUser(data.verifyEmailOtp);
          router.replace('/(app)/dashboard');
        }
        return;
      }

      // RESET returns a ticket for the new-password screen, not a session.
      const { data } = await verifyReset({ variables: { input: { email, code: value } } });
      if (data?.verifyPasswordResetOtp) {
        router.replace({
          pathname: '/(auth)/reset',
          params: { resetToken: data.verifyPasswordResetOtp.resetToken },
        });
      }
    } catch (e) {
      setError(errorWithWait(e, lang));
      setCode('');
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError('');
    setCode('');
    try {
      if (purpose === 'LOGIN') {
        const deviceId = await getDeviceId();
        await resendLogin({ variables: { email, deviceId } });
      } else if (purpose === 'SIGNUP') {
        await resendEmail();
      } else {
        await resendReset({ variables: { email } });
      }
      setCooldown(RESEND_COOLDOWN);
      setExpiresIn(600);
    } catch (e) {
      setError(errorWithWait(e, lang));
    }
  };

  const masked = useMemo(() => params.masked ?? email, [params.masked, email]);

  return (
    <Screen>
      <FadeIn>
        <BackButton onPress={() => router.back()} label={t.back} showLabel />
      </FadeIn>

      <Gap h={26} />
      <FadeIn delay={70}>
        <Heading
          eyebrow={purpose === 'RESET' ? '2 / 3' : undefined}
          title={t.verifyTitle}
        />
        <Gap h={10} />
        <Text style={[T.sub, { color: c.muted, maxWidth: 310 }]}>
          {t.verifySubA} <Text style={{ color: c.text }}>{masked}</Text>. {t.verifySubB}
        </Text>
      </FadeIn>

      <Gap h={24} />

      <FadeIn delay={130}>
        <Glass style={{ padding: 18 }}>
          <OtpInput value={code} onChange={setCode} onFilled={submit} editable={!busy} />

          <Gap h={16} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: expiresIn > 0 ? c.successMark : c.danger,
              }}
            />
            <Text style={[T.body, { color: c.muted }]}>
              {t.expiresIn} <Text style={{ color: c.text }}>{clock(expiresIn)}</Text>
            </Text>
          </View>
        </Glass>
      </FadeIn>

      {error ? (
        <View style={{ marginTop: 16 }}>
          <ErrorNote message={error} />
        </View>
      ) : null}

      <Gap h={22} />
      <FadeIn delay={190}>
        <PrimaryButton
          label={t.verifyCta}
          onPress={() => submit()}
          busy={busy}
          disabled={code.length !== CODE_LENGTH}
        />
      </FadeIn>

      <Gap h={18} />
      <View style={{ alignItems: 'center' }}>
        {cooldown > 0 ? (
          <Text style={[T.body, { color: c.faint }]}>
            {t.resendIn} {clock(cooldown)}
          </Text>
        ) : (
          <FadeIn from={4} duration={240}>
            <LinkText label={t.resend} onPress={resend} />
          </FadeIn>
        )}
      </View>

      <Spacer />
      <FadeIn delay={240}>
        <Text style={[T.fine, { color: c.faint, textAlign: 'center' }]}>{t.spam}</Text>
      </FadeIn>
    </Screen>
  );
}
