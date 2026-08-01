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

// Authed — adds photo / height / weight / religion after signup.
export const COMPLETE_PROFILE = gql`
  mutation CompleteProfile($input: CompleteProfileInput!) {
    completeProfile(input: $input) { ${USER_FIELDS} }
  }
`;

// Authed — flips the user onto the premium plan.
export const UPGRADE_TO_PREMIUM = gql`
  mutation UpgradeToPremium {
    upgradeToPremium { ${USER_FIELDS} }
  }
`;
