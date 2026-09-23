// Session token and cached profile, stored in SecureStore.
// Decoding reads the claims only; it does not verify the signature.
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/graphql/auth';

const TOKEN_KEY = 'imara.authToken';
const PROFILE_KEY = 'imara.profile';

const SECURE: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveToken(token?: string | null): Promise<void> {
  if (!token) return;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, SECURE);
  } catch {
    // ignore
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY, SECURE);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY, SECURE);
  } catch {
    // ignore
  }
}

// Last known profile, cached with the token so the app can start offline.

// Cache version. Must change whenever USER_FIELDS in graphql/auth.ts changes.
const PROFILE_SHAPE = 2;

type StoredProfile = { v: number; user: AuthUser };

// Fields a cached profile must have to be used.
const REQUIRED: readonly (keyof AuthUser)[] = [
  'id',
  'email',
  'emailVerified',
  'name',
  'gender',
  'language',
  'units',
  'timezone',
  'cycleTrackingEnabled',
  'waterGoalGlasses',
  'stepGoal',
  'sleepGoalHours',
  'createdAt',
];

export async function saveProfile(user: AuthUser): Promise<void> {
  try {
    const wrapped: StoredProfile = { v: PROFILE_SHAPE, user };
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(wrapped), SECURE);
  } catch {
    // ignore
  }
}

export async function getProfile(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(PROFILE_KEY, SECURE);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredProfile>;

    // Cache from an older version: discard it.
    if (!parsed || parsed.v !== PROFILE_SHAPE || !parsed.user) {
      void clearProfile();
      return null;
    }

    const user = parsed.user as Partial<AuthUser>;
    const complete = REQUIRED.every((key) => user[key] !== undefined && user[key] !== null);
    if (!complete) {
      void clearProfile();
      return null;
    }

    return user as AuthUser;
  } catch {
    return null;
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PROFILE_KEY, SECURE);
  } catch {
    // ignore
  }
}

/** Both halves of a session, so no caller can clear one and forget the other. */
export async function clearSession(): Promise<void> {
  await Promise.all([clearToken(), clearProfile()]);
}

const endedListeners = new Set<() => void>();

/** Subscribes to sessions ended outside React (e.g. by the Apollo error link). */
export function onSessionEnded(listener: () => void): () => void {
  endedListeners.add(listener);
  return () => endedListeners.delete(listener);
}

/** Clears the stored session and tells the session provider to sign out. */
export async function endSession(): Promise<void> {
  await clearSession();
  endedListeners.forEach((listener) => listener());
}

// JWT payload from the backend. exp and iat are in seconds.
export type TokenClaims = {
  sub?: string;
  /** tokenVersion at issue — the server's revocation check */
  v?: number;
  /** session origin: when the password was actually last typed */
  o?: string;
  iat?: number;
  exp?: number;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Base64url decoder (atob is not available on every Hermes build).
function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  let bits = 0;
  let bitCount = 0;
  let out = '';

  for (const char of base64) {
    const value = B64.indexOf(char);
    if (value === -1) continue; // '=' padding and anything unexpected
    bits = (bits << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      out += String.fromCharCode((bits >> bitCount) & 0xff);
    }
  }
  return out;
}

export function decodeToken(token?: string | null): TokenClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null; // header.payload.signature or it is not a JWT
  try {
    return JSON.parse(decodeBase64Url(parts[1])) as TokenClaims;
  } catch {
    return null;
  }
}

// Allowed clock skew.
const CLOCK_SKEW_SECONDS = 60;

export function isExpired(token?: string | null): boolean {
  const claims = decodeToken(token);
  if (!claims?.exp) return true;
  return claims.exp <= Math.floor(Date.now() / 1000) + CLOCK_SKEW_SECONDS;
}

// Renew the token when fewer than this many days remain.
const RENEW_WHEN_DAYS_LEFT = 7;

export function shouldRefresh(token?: string | null): boolean {
  const claims = decodeToken(token);
  if (!claims?.exp) return false;
  return claims.exp - Math.floor(Date.now() / 1000) < RENEW_WHEN_DAYS_LEFT * 86_400;
}
