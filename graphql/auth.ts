// Auth and profile operations. Field names match the backend typeDefs.
// login returns a union: AuthPayload (trusted device) or OtpChallenge (no token).
import { gql } from '@apollo/client';

// The full User selection, shared by every operation that returns a User. bmi is server-derived.
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    email
    emailVerified

    name
    photoUrl
    gender
    birthDate
    heightCm
    weightKg
    bmi

    language
    units
    timezone
    cycleTrackingEnabled

    waterGoalGlasses
    stepGoal
    sleepGoalHours

    createdAt
  }
`;

export const SIGNUP = gql`
  ${USER_FIELDS}
  mutation Signup($input: SignUpInput!) {
    signup(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const LOGIN = gql`
  ${USER_FIELDS}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      __typename
      ... on AuthPayload {
        token
        user {
          ...UserFields
        }
      }
      ... on OtpChallenge {
        challenge
        purpose
        expiresAt
        maskedEmail
      }
    }
  }
`;

export const VERIFY_LOGIN_OTP = gql`
  ${USER_FIELDS}
  mutation VerifyLoginOtp($email: String!, $input: VerifyOtpInput!) {
    verifyLoginOtp(email: $email, input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const RESEND_LOGIN_OTP = gql`
  mutation ResendLoginOtp($email: String!, $deviceId: String!) {
    resendLoginOtp(email: $email, deviceId: $deviceId)
  }
`;

export const VERIFY_EMAIL_OTP = gql`
  ${USER_FIELDS}
  mutation VerifyEmailOtp($input: VerifyOtpInput!) {
    verifyEmailOtp(input: $input) {
      ...UserFields
    }
  }
`;

export const RESEND_EMAIL_OTP = gql`
  mutation ResendEmailOtp {
    resendEmailOtp
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESEND_PASSWORD_RESET_OTP = gql`
  mutation ResendPasswordResetOtp($email: String!) {
    resendPasswordResetOtp(email: $email)
  }
`;

export const VERIFY_PASSWORD_RESET_OTP = gql`
  mutation VerifyPasswordResetOtp($input: VerifyResetOtpInput!) {
    verifyPasswordResetOtp(input: $input) {
      resetToken
      expiresAt
    }
  }
`;

export const RESET_PASSWORD = gql`
  ${USER_FIELDS}
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const REFRESH_SESSION = gql`
  ${USER_FIELDS}
  mutation RefreshSession {
    refreshSession {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const ME = gql`
  ${USER_FIELDS}
  query Me {
    me {
      ...UserFields
    }
  }
`;

export type Gender = 'female' | 'male' | 'unspecified';
export type Units = 'metric' | 'imperial';

// Matches USER_FIELDS.
export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;

  name: string;
  photoUrl: string;
  gender: Gender;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;

  language: 'en' | 'fr' | 'sw' | 'rn';
  units: Units;
  timezone: string;
  cycleTrackingEnabled: boolean;

  waterGoalGlasses: number;
  stepGoal: number;
  sleepGoalHours: number;

  createdAt: string;
};

export type AuthPayload = { token: string; user: AuthUser };

export type OtpChallenge = {
  challenge: boolean;
  purpose: string;
  expiresAt: string;
  maskedEmail: string;
};

export type LoginResult =
  | ({ __typename: 'AuthPayload' } & AuthPayload)
  | ({ __typename: 'OtpChallenge' } & OtpChallenge);

// Profile fields, including name and gender after signup.
export const UPDATE_PROFILE = gql`
  ${USER_FIELDS}
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }
`;

// Language, units, timezone, cycle tracking and goals.
export const SET_PREFERENCES = gql`
  ${USER_FIELDS}
  mutation SetPreferences($input: PreferencesInput!) {
    setPreferences(input: $input) {
      ...UserFields
    }
  }
`;

// Returns a new session; the old token stops working, so save the new one.
export const CHANGE_PASSWORD = gql`
  ${USER_FIELDS}
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const MY_TRUSTED_DEVICES = gql`
  query MyTrustedDevices {
    myTrustedDevices {
      id
      label
      lastSeenAt
      expiresAt
      current
    }
  }
`;

export const REVOKE_TRUSTED_DEVICE = gql`
  mutation RevokeTrustedDevice($id: ID!) {
    revokeTrustedDevice(id: $id)
  }
`;

export type TrustedDevice = {
  id: string;
  label: string;
  lastSeenAt: string;
  expiresAt: string;
  /** True for the phone making the request. */
  current: boolean;
};

// Requires the current password.
export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($input: DeleteAccountInput!) {
    deleteAccount(input: $input)
  }
`;
