// lib/prefs.ts — small on-device preferences that outlive a session.
// Uses SecureStore because it's already a dependency (see lib/tokens.ts);
// none of this is secret, it just needs to survive an app restart.
import * as SecureStore from 'expo-secure-store';

const LANG_KEY = 'appLanguage';

export async function saveLang(code: string) {
  try {
    await SecureStore.setItemAsync(LANG_KEY, code);
  } catch {
    // a failed preference write should never break the app
  }
}

export async function getLang() {
  try {
    return await SecureStore.getItemAsync(LANG_KEY);
  } catch {
    return null;
  }
}
