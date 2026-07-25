// hooks/use-auth-form.ts — shared auth form state + validation.
// FRONTEND ONLY: no tokens, no GraphQL/backend calls. Submitting just validates
// the fields and calls onSuccess so the UI can navigate.
import { useState, useEffect, useCallback } from 'react';
import { useStrings } from '@/constants/strings';
import type { SocialProvider } from '@/components/buttons';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type AuthMode = 'login' | 'signup';
export type { SocialProvider };

export type AuthSuccess = {
  method: 'password' | SocialProvider;
  email?: string;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  agree?: string;
};

export default function useAuthForm(mode: AuthMode, onSuccess: (info: AuthSuccess) => void) {
  const { t } = useStrings();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (mode === 'signup' && !agree) e.agree = t.errTerms;
    return e;
  }, [mode, name, email, password, agree, t]);

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
  }, [name, email, password, agree, touched, validate]);

  const submit = () => {
    setTouched(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    // no backend yet — the form just reports success to the screen
    setServerError(null);
    onSuccess({ method: 'password', email: email.trim().toLowerCase() });
  };

  // Social sign-in isn't available yet — surface a clear message.
  const social = (_provider: SocialProvider) => {
    setServerError(t.errSocialUnavailable);
  };

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    remember, setRemember,
    agree, setAgree,
    errors, serverError, loading, socialLoading,
    submit, social,
  };
}
