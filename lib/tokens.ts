// lib/tokens.ts — secure storage for the JWT.
// The backend issues a single token (7-day expiry) from `signup` and `login`.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';

export async function saveToken(token?: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
