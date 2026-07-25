// lib/tokens.ts — secure storage for the JWT access/refresh pair.
// Tokens come back from `verifyEmail` (after signup) and `login`.
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

type TokenPair = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

export async function saveTokens({ accessToken, refreshToken }: TokenPair = {}) {
  if (accessToken) await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_KEY);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
