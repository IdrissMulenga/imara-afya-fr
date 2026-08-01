// app/(auth)/signup.tsx — create account screen only.
import { View } from 'react-native';
import { router } from 'expo-router';

import { useStrings } from '@/constants/strings';
import useAuthForm, { type AuthSuccess } from '@/hooks/use-auth-form';
import TextField from '@/components/text-field';
import PasswordStrength from '@/components/password-strength';
import { PrimaryButton } from '@/components/buttons';
import { AuthShell, AuthFooter, Checkbox, ErrorRow, GenderPicker } from '@/components/auth-shell';

export default function SignupScreen() {
  const { t } = useStrings();

  // account created + token stored -> go set up the profile
  // `replace` so the back gesture can't return to the signup form
  const onAuthSuccess = (_info: AuthSuccess) => {
    router.replace('/(auth)/profile');
  };

  const f = useAuthForm('signup', onAuthSuccess);

  return (
    <AuthShell title={t.createAccount} subtitle={t.signupSub}>
      <TextField
        label={t.name}
        icon="person-outline"
        placeholder={t.namePh}
        value={f.name}
        onChangeText={f.setName}
        error={f.errors.name}
        autoCapitalize="words"
      />

      <TextField
        label={t.email}
        icon="mail-outline"
        placeholder={t.emailPh}
        value={f.email}
        onChangeText={f.setEmail}
        error={f.errors.email}
        keyboardType="email-address"
      />

      <View>
        <TextField
          label={t.password}
          icon="lock-closed-outline"
          placeholder={t.passwordPh}
          value={f.password}
          onChangeText={f.setPassword}
          error={f.errors.password}
          secure
          returnKeyType="go"
          onSubmitEditing={f.submit}
        />
        <PasswordStrength password={f.password} />
      </View>

      {/* backend requires gender at signup */}
      <View>
        <GenderPicker value={f.gender} onChange={f.setGender} />
        {!!f.errors.gender && <ErrorRow message={f.errors.gender} />}
      </View>

      <View>
        <Checkbox checked={f.agree} onToggle={() => f.setAgree((a) => !a)}>
          {t.terms}
        </Checkbox>
        {!!f.errors.agree && <ErrorRow message={f.errors.agree} />}
      </View>

      {!!f.serverError && <ErrorRow message={f.serverError} />}

      <PrimaryButton
        label={t.create}
        onPress={f.submit}
        loading={f.loading}
        disabled={!!f.socialLoading}
      />

      <AuthFooter
        prompt={t.haveAccount}
        action={t.loginLink}
        onPress={() => router.push('/(auth)/login')}
      />
    </AuthShell>
  );
}
