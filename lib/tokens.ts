// lib/tokens.ts — secure storage for the JWT, plus a look at what's inside it.
//
// The backend issues a single 7-day token from `signup`, `login` and
// `refreshSession`. It is stored in SecureStore, which on Android is backed by
// the Keystore, so another app can't read it.
//
// READING THE TOKEN IS NOT VERIFYING IT. Everything below decodes the payload
// without checking the signature, because the app has no secret to check it
// with — only the server does. It is there to answer "is this obviously dead?"
// without a network round trip, which matters a lot on 2G. Anything that
// actually protects data is enforced server-side by authCheck.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';

export async function saveToken(token?: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}


/* ----------------------------- reading claims ---------------------------- */

// What our backend puts in the payload. `exp` and `iat` are seconds since
// epoch, per the JWT spec — not milliseconds.
export type TokenClaims = {
  id?: string;
  // tokenVersion at issue — the server's revocation check
  v?: number;
  // session origin: when the password was actually typed
  o?: number;
  iat?: number;
  exp?: number;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Hand-rolled rather than pulling in a base64 package or relying on `atob`,
// which isn't guaranteed to exist on every Hermes build. It only ever decodes
// our own payload, which is plain ASCII JSON.
const decodeBase64Url = (input: string) => {
  // base64url swaps two characters and drops the padding
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  let bits = 0;
  let bitCount = 0;
  let out = '';

  for (const char of base64) {
    const value = B64.indexOf(char);

    // '=' padding and anything unexpected contribute nothing
    if (value === -1) continue;

    bits = (bits << 6) | value;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      out += String.fromCharCode((bits >> bitCount) & 0xff);
    }
  }

  return out;
};

export function decodeToken(token?: string | null): TokenClaims | null {
  if (!token) return null;

  const parts = token.split('.');

  // header.payload.signature — anything else isn't a JWT
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as TokenClaims;
  } catch {
    // truncated, corrupted, or not ours
    return null;
  }
}

// A minute of slack: phone clocks drift, and a token that expires while the
// request is in flight should be treated as already gone rather than sent.
const CLOCK_SKEW_SECONDS = 60;

export function isExpired(token?: string | null) {
  const claims = decodeToken(token);

  // no token, or one we can't read, is treated as dead — the safe direction,
  // since the worst case is showing a login screen
  if (!claims?.exp) return true;

  return claims.exp <= Math.floor(Date.now() / 1000) + CLOCK_SKEW_SECONDS;
}

// Renew a token once it's older than this. Well short of the 7-day expiry, so
// there is a wide margin to catch someone who opens the app only occasionally.
const REFRESH_AFTER_HOURS = 24;

export function shouldRefresh(token?: string | null) {
  const claims = decodeToken(token);

  if (!claims?.iat) return false;

  const ageSeconds = Math.floor(Date.now() / 1000) - claims.iat;

  return ageSeconds > REFRESH_AFTER_HOURS * 60 * 60;
}
