// This phone's device id and label. The id only decides whether a login needs a code.
// Format matches the backend: 8-128 characters of [A-Za-z0-9_-].
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_KEY = 'imara.deviceId';
const DEVICE_SECRET_KEY = 'imara.deviceSecret';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let fallbackDeviceId: string | undefined;
let fallbackDeviceSecret: string | undefined;

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

  if (fallbackDeviceId) return fallbackDeviceId;

  const fresh = randomId();
  fallbackDeviceId = fresh;
  try {
    await SecureStore.setItemAsync(DEVICE_KEY, fresh);
  } catch {
    // Not fatal: the phone just is not remembered.
  }
  return fresh;
}

// Generated once and stored as a proof-of-possession secret for trusted-device login.
export async function getDeviceSecret(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(DEVICE_SECRET_KEY);
    if (saved && saved.length >= 16) return saved;
  } catch {
    // fall through and make a new one
  }

  if (fallbackDeviceSecret) return fallbackDeviceSecret;

  const bytes = await Crypto.getRandomBytesAsync(32);
  const fresh = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  fallbackDeviceSecret = fresh;
  try {
    await SecureStore.setItemAsync(DEVICE_SECRET_KEY, fresh);
  } catch {
    // Not fatal: this session can still complete OTP verification.
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

export async function getDeviceCredentials() {
  const [deviceId, deviceSecret] = await Promise.all([getDeviceId(), getDeviceSecret()]);
  return { deviceId, deviceSecret, deviceLabel: getDeviceLabel() };
}
