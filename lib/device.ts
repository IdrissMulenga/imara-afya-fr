// This phone's device id and label. The id only decides whether a login needs a code.
// Format matches the backend: 8-128 characters of [A-Za-z0-9_-].
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_KEY = 'imara.deviceId';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomId(length = 32): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Generated once and stored.
export async function getDeviceId(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(DEVICE_KEY);
    if (saved && saved.length >= 8) return saved;
  } catch {
    // fall through and make a new one
  }

  const fresh = randomId();
  try {
    await SecureStore.setItemAsync(DEVICE_KEY, fresh);
  } catch {
    // Not fatal: the phone just is not remembered.
  }
  return fresh;
}

// Label shown in the trusted-device list, e.g. "Android 14 - Tecno".
export function getDeviceLabel(): string {
  const name = Device.modelName ?? Device.deviceName ?? 'Unknown device';
  const os = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const version = Device.osVersion ? ` ${Device.osVersion}` : '';
  return `${os}${version} - ${name}`.slice(0, 80);
}
