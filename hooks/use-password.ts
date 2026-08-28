// hooks/use-password.ts — changing the sign-in password, and the way out when
// someone has forgotten it.
import { useMutation } from '@apollo/client/react';

import {
  CHANGE_PASSWORD,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD,
  type ChangePasswordData,
  type RequestPasswordResetData,
  type ResetPasswordData,
} from '@/graphql';
import useMe from '@/hooks/use-me';
import { saveToken } from '@/lib/tokens';

export function usePassword() {
  const { me } = useMe();

  const [changeMutation, { loading: saving }] = useMutation<ChangePasswordData>(CHANGE_PASSWORD);
  const [resetMutation, { loading: sending }] =
    useMutation<RequestPasswordResetData>(REQUEST_PASSWORD_RESET);
  const [completeMutation, { loading: resetting }] =
    useMutation<ResetPasswordData>(RESET_PASSWORD);

  const change = async (currentPassword: string, newPassword: string) => {
    const { data } = await changeMutation({
      variables: { input: { currentPassword, newPassword } },
    });

    // Changing a password bumps tokenVersion server-side, which retires every
    // token the account has issued — including the one this phone is holding.
    // The backend hands back a fresh one so the person doing the change stays
    // signed in; storing it is what stops them being logged out mid-action.
    await saveToken(data?.changePassword.token);

    return data?.changePassword;
  };

  // Uses the address already on the account, so a locked-out user doesn't have
  // to remember which email they signed up with either.
  const requestReset = async (email?: string) => {
    const target = email ?? me?.email;

    if (!target) return false;

    const { data } = await resetMutation({ variables: { email: target } });

    return !!data?.requestPasswordReset;
  };

  // FINISH THE RESET with the code from the email.
  //
  // The backend returns a token here, and we deliberately throw it away. Being
  // signed in automatically after a reset means that if the reset wasn't the
  // account owner, whoever did it lands straight inside. Sending them to the
  // login screen costs one extra step and closes that.
  const reset = async (email: string, token: string, newPassword: string) => {
    const { data } = await completeMutation({
      variables: { input: { email, token, newPassword } },
    });

    return !!data?.resetPassword;
  };

  return { change, requestReset, reset, saving, sending, resetting };
}

export default usePassword;
