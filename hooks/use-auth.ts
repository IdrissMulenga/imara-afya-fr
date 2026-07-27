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
  SIGNUP,
  type LoginData,
  type LoginInput,
  type LoginVars,
  type SignUpInput,
  type SignupData,
  type SignupVars,
} from '@/graphql';
import { clearToken, saveToken } from '@/lib/tokens';
import { errorMessage } from '@/lib/errors';

export function useAuth() {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginMutation] = useMutation<LoginData, LoginVars>(LOGIN);
  const [signupMutation] = useMutation<SignupData, SignupVars>(SIGNUP);

  const login = async (input: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await loginMutation({
        variables: { input: { ...input, email: input.email.trim().toLowerCase() } },
      });
      await saveToken(data?.login.token);
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
      return data?.signup;
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // drop the token and wipe any cached user data
  const logout = async () => {
    await clearToken();
    await client.clearStore();
  };

  return { login, signup, logout, loading, error, setError };
}

export default useAuth;
