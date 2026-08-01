// queries/index.ts — GraphQL operations + types, matched to the backend schema.
import { gql } from '@apollo/client';

/* ----------------------------- shared types ----------------------------- */

export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  birthday?: string | null;
  gender?: Gender | null;
  height?: number | null;
  weight?: number | null;
  religion?: string | null;
  image?: string | null;
};

export type User = {
  _id: string;
  fullName?: string;
  email: string;
  isVerified: boolean;
  profile?: UserProfile | null;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

/* --------------------------- operation variables ------------------------- */

export type RegisterVars = {
  input: { fullName: string; email: string; password: string; agreeToTerms: boolean };
};

export type VerifyEmailVars = {
  input: { email: string; code: string };
};

export type ResendCodeVars = {
  input: { email: string };
};

export type LoginVars = {
  input: { email: string; password: string };
};

export type CompleteProfileVars = {
  input: {
    gender?: Gender;
    religion?: string;
    image?: string;
    birthday?: string;
    height?: number;
    weight?: number;
  };
};

/* --------------------------- operation results --------------------------- */

export type RegisterData = { register: { message: string; user: User } };
export type VerifyEmailData = { verifyEmail: AuthPayload };
export type ResendCodeData = { resendCode: { message: string } };
export type LoginData = { login: AuthPayload };
export type CompleteProfileData = { completeProfile: User };
export type MeData = { me: User };

/* ------------------------------- operations ------------------------------ */

// Signup. Returns only { message, user } — no tokens yet (email not verified).
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      message
      user { _id email isVerified }
    }
  }
`;

// Confirm the 6-digit code. On success the token pair is issued here.
export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      accessToken
      refreshToken
      user { _id email isVerified }
    }
  }
`;

// Re-send a fresh code (invalidates the previous one).
export const RESEND_CODE = gql`
  mutation ResendCode($input: ResendCodeInput!) {
    resendCode(input: $input) { message }
  }
`;

// Login. Returns the token pair for a verified user.
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user { _id email isVerified }
    }
  }
`;

// Authed — needs the access token in the header (handled by Apollo authLink).
export const COMPLETE_PROFILE = gql`
  mutation CompleteProfile($input: CompleteProfileInput!) {
    completeProfile(input: $input) {
      _id
      profile { birthday gender height weight religion image }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      _id
      fullName
      email
      isVerified
      profile { gender religion image }
    }
  }
`;
