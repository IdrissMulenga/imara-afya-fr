// app/(auth)/login.tsx — login screen only.
import { View, Text } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useStrings } from '@/constants/strings';
import useAuthForm, { type AuthSuccess } from '@/hooks/use-auth-form';
import TextField from '@/components/text-field';
import { PrimaryButton } from '@/components/buttons';
import { AuthShell, AuthFooter, Checkbox, ErrorRow, styles } from '@/components/auth-shell';

export default function LoginScreen() {
    const { c } = useTheme();
    const { t } = useStrings();

    // logged in -> straight to the dashboard
    const onAuthSuccess = (_info: AuthSuccess) => {
        router.replace('/(home)');
    };

    const f = useAuthForm('login', onAuthSuccess);

    return (
        <AuthShell title={t.welcomeBack} subtitle={t.loginSub}>
            <TextField
                label={t.email}
                icon="mail-outline"
                placeholder={t.emailPh}
                value={f.email}
                onChangeText={f.setEmail}
                error={f.errors.email}
                keyboardType="email-address"
            />

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

            <View style={styles.betweenRow}>
                <Checkbox checked={f.remember} onToggle={() => f.setRemember((r) => !r)}>
                    {t.remember}
                </Checkbox>
                <Text style={[styles.link, { color: c.primary }]}>{t.forgot}</Text>
            </View>

            {!!f.serverError && <ErrorRow message={f.serverError} />}

            <PrimaryButton
                label={t.login}
                onPress={f.submit}
                loading={f.loading}
                disabled={!!f.socialLoading}
            />

            <AuthFooter
                prompt={t.noAccount}
                action={t.signup}
                onPress={() => router.push('/(auth)/signup')}
            />
        </AuthShell>
    );
}
