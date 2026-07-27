// hooks/use-auth-form.ts — shared auth form state + validation.
// Owns the field state and validation; delegates the actual API calls to
// `useAuth`, so the screens stay thin.
import { useState, useEffect, useCallback } from 'react';
import { useStrings } from '@/constants/strings';
import type { SocialProvider } from '@/components/buttons';
import useAuth from '@/hooks/use-auth';
import { useToast } from '@/components/toast';
import { errorMessage } from '@/lib/errors';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type AuthMode = 'login' | 'signup';
export type { SocialProvider };

// matches the backend User.gender enum
export type Gender = 'Man' | 'Woman';

export type AuthSuccess = {
  method: 'password' | SocialProvider;
  email?: string;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  gender?: string;
  agree?: string;
};

export default function useAuthForm(mode: AuthMode, onSuccess: (info: AuthSuccess) => void) {
  const { t } = useStrings();
  const auth = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const validate = useCallback((): FieldErrors => {
    const e: FieldErrors = {};
    if (mode === 'signup' && name.trim().length < 2) e.name = t.errName;
    if (!EMAIL_RE.test(email)) e.email = t.errEmail;
    if (password.length < 8) e.password = t.errPwShort;
    // the backend requires gender at signup
    if (mode === 'signup' && !gender) e.gender = t.errGender;
    if (mode === 'signup' && !agree) e.agree = t.errTerms;
    return e;
  }, [mode, name, email, password, gender, agree, t]);

  // reset transient state when switching login <-> signup
  useEffect(() => {
    setErrors({});
    setServerError(null);
    setTouched(false);
    setLoading(false);
    setSocialLoading(null);
  }, [mode]);

  // live-clear errors after the first submit attempt
  useEffect(() => {
    if (touched) setErrors(validate());
  }, [name, email, password, gender, agree, touched, validate]);

  const submit = async () => {
    setTouched(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const cleanEmail = email.trim().toLowerCase();
    setServerError(null);

    try {
      if (mode === 'signup') {
        // the backend wants firstName + lastName; the form collects one field
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

        await auth.signup({
          firstName,
          lastName,
          email: cleanEmail,
          password,
          gender: gender as Gender,
          agreeToTerms: agree,
        });
      } else {
        await auth.login({ email: cleanEmail, password });
      }

      onSuccess({ method: 'password', email: cleanEmail });
    } catch (err) {
      // read the backend's GraphQL message straight off the thrown error
      // (auth.error state hasn't re-rendered yet at this point)
      const message = errorMessage(err, t.errGeneric);
      setServerError(message);
      toast.error(message);
    }
  };

  // Social sign-in isn't available yet — surface a clear message.
  const social = (_provider: SocialProvider) => {
    setServerError(t.errSocialUnavailable);
  };

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    gender, setGender,
    remember, setRemember,
    agree, setAgree,
    errors, serverError, socialLoading,
    loading: auth.loading,
    submit, social,
  };
}
