// hooks/use-auth.ts — reusable auth data hook.
// Wraps the signup / login mutations and the `me` query, stores the JWT
// securely, and exposes loading + error state. Use it from any screen:
//
//   const { login, signup, logout, loading, error } = useAuth();
//   await login({ email, password });
import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';

import {
  LOGIN,
  LOGOUT,
  REFRESH_SESSION,
  SIGNUP,
  type LoginData,
  type LoginInput,
  type LoginVars,
  type LogoutData,
  type RefreshSessionData,
  type SignUpInput,
  type SignupData,
  type SignupVars,
} from '@/graphql';
import { clearToken, saveToken } from '@/lib/tokens';
import { resetSessionLatch } from '@/lib/session';
import { errorMessage } from '@/lib/errors';

export function useAuth() {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginMutation] = useMutation<LoginData, LoginVars>(LOGIN);
  const [signupMutation] = useMutation<SignupData, SignupVars>(SIGNUP);
  const [logoutMutation] = useMutation<LogoutData>(LOGOUT);
  const [refreshMutation] = useMutation<RefreshSessionData>(REFRESH_SESSION);

  const login = async (input: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await loginMutation({
        variables: { input: { ...input, email: input.email.trim().toLowerCase() } },
      });
      await saveToken(data?.login.token);
      // re-arm the "session has ended" latch, or a later logout in this same
      // app run would be swallowed
      resetSessionLatch();
      return data?.login;
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (input: SignUpInput) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await signupMutation({
        variables: { input: { ...input, email: input.email.trim().toLowerCase() } },
      });
      await saveToken(data?.signup.token);
      resetSessionLatch();
      return data?.signup;
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // RENEW A STILL-VALID SESSION.
  //
  // Returns true when the token was replaced, false when the backend refused —
  // expired, revoked, or the 30-day session cap reached. The caller decides
  // what to do about it, because at startup that means "show login" while
  // mid-session the error link has already handled it.
  const refresh = async () => {
    try {
      const { data } = await refreshMutation();

      if (!data?.refreshSession.token) return false;

      await saveToken(data.refreshSession.token);
      resetSessionLatch();

      return true;
    } catch {
      return false;
    }
  };

  // SIGN OUT.
  //
  // The server call is what actually matters: it bumps tokenVersion, which
  // retires every token this account has issued. Clearing local storage alone
  // would leave a token that had been copied off the device working until it
  // expired.
  const logout = async () => {
    try {
      // must run BEFORE the token is cleared — the request needs to be authed
      await logoutMutation();
    } catch {
      // Offline, or the token was already dead. Either way, carry on and clear
      // locally: refusing to sign someone out because the network is down would
      // be worse, and a dead token is already harmless.
    }

    await clearToken();
    await client.clearStore();
  };

  return { login, signup, logout, refresh, loading, error, setError };
}

export default useAuth;
