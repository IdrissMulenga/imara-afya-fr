// graphql/mutations/user.ts — auth + profile mutations.
import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments';

// Creates the account and returns a token immediately (no email verification).
export const SIGNUP = gql`
  mutation Signup($input: SignUpInput!) {
    signup(input: $input) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

// Authed — swaps a still-valid token for a fresh one, so someone who uses the
// app regularly is never asked for their password again. The backend refuses
// once the session is 30 days past the last real login.
export const REFRESH_SESSION = gql`
  mutation RefreshSession {
    refreshSession {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

// Authed — bumps tokenVersion on the server, which retires every token this
// account has issued. Dropping the local copy alone would leave a token that
// had been copied off the device working until it expired.
export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

// Authed — tells the backend which timezone the phone is in. Everything that
// groups by day depends on this; without it the account sits on UTC and a dose
// logged after midnight lands on the wrong date.
export const SET_PREFERENCES = gql`
  mutation SetPreferences($input: SetPreferencesInput!) {
    setPreferences(input: $input) { ${USER_FIELDS} }
  }
`;

// Authed — change the password used to sign in. The backend counts wrong
// attempts and returns USE_PASSWORD_RESET once they're spent, so the app can
// offer the email route instead of a sixth failure.
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

// Unauthed by design — someone locked out can't prove who they are yet.
// Always returns true so the response can't be used to discover which
// addresses have accounts.
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

// Authed — adds photo / height / weight after signup.
export const COMPLETE_PROFILE = gql`
  mutation CompleteProfile($input: CompleteProfileInput!) {
    completeProfile(input: $input) { ${USER_FIELDS} }
  }
`;

// Authed — permanent. Wipes every record the user owns, then the account.
export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($input: DeleteAccountInput!) {
    deleteAccount(input: $input)
  }
`;

// Authed — flips the user onto the premium plan.
export const UPGRADE_TO_PREMIUM = gql`
  mutation UpgradeToPremium {
    upgradeToPremium { ${USER_FIELDS} }
  }
`;
