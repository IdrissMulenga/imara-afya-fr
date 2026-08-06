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

// Authed — adds photo / height / weight / religion after signup.
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
