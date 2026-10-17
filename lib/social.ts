// Google and Apple sign-in on the phone. Each returns null when the person cancels the sheet.
// Google Sign-In is a native module that Expo Go does not include, so it loads only in the
// app's own build; Apple works in Expo Go too. Google's client ids come from the API.
import { Platform } from 'react-native';
import { useQuery } from '@apollo/client/react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { SIGN_IN_OPTIONS, type SignInOptions } from '@/graphql/auth';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let webClientId = '';
let iosClientId = '';
let configuredFor = '';
let google: GoogleModule | null | undefined;

// Loads Google Sign-In once; null where it cannot run.
function loadGoogle(): GoogleModule | null {
  if (google !== undefined) return google;
  try {
    google = IN_EXPO_GO
      ? null
      : // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('@react-native-google-signin/google-signin') as GoogleModule);
  } catch {
    google = null;
  }
  return google;
}

// Google Sign-In configured with the client ids the API sent; null where it cannot run.
function googleModule(): GoogleModule | null {
  const module = loadGoogle();
  const key = `${webClientId}|${iosClientId}`;
  if (module && configuredFor !== key) {
    module.GoogleSignin.configure({ webClientId, iosClientId: iosClientId || undefined });
    configuredFor = key;
  }
  return module;
}

/** Stores the client ids from the API's signInOptions. */
export function setGoogleClientIds(options: SignInOptions | undefined): void {
  if (!options) return;
  webClientId = options.googleWebClientId ?? '';
  iosClientId = options.googleIosClientId ?? '';
}

/** Whether the Google button can show: the app's own build, with the API's client ids loaded. */
export function googleAvailable(): boolean {
  if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) return false;
  return googleModule() !== null;
}

/** Fetches the client ids from the API once per launch and says whether Google can show. */
export function useGoogleAvailable(): boolean {
  const { data } = useQuery<{ signInOptions: SignInOptions }>(SIGN_IN_OPTIONS, {
    fetchPolicy: 'cache-first',
  });
  setGoogleClientIds(data?.signInOptions);
  return googleAvailable();
}

/** A Google ID token for the account the person picks; null if they cancel. */
export async function googleIdToken(): Promise<string | null> {
  const module = googleModule();
  if (!module) return null;
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = module;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Signing out of the previous choice shows the account picker every time.
    await GoogleSignin.signOut().catch(() => {});
    const response = await GoogleSignin.signIn();
    return isSuccessResponse(response) ? (response.data.idToken ?? null) : null;
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS)
    ) {
      return null;
    }
    throw error;
  }
}

/** Whether Sign in with Apple can show: iOS only. */
export async function appleAvailable(): Promise<boolean> {
  return (await appleStatus()) === 'ok';
}

let appleChecked: Promise<string> | null = null;

/** Why Sign in with Apple can or cannot show here; shown in development to explain a missing button.
 * Checked once per launch. */
export function appleStatus(): Promise<string> {
  appleChecked ??= checkApple();
  return appleChecked;
}

async function checkApple(): Promise<string> {
  if (Platform.OS !== 'ios') return 'not iOS';
  if (!requireOptionalNativeModule('ExpoAppleAuthentication')) {
    return 'this app build has no Apple sign-in module';
  }
  try {
    return (await AppleAuthentication.isAvailableAsync())
      ? 'ok'
      : 'the phone says Sign in with Apple is not available';
  } catch (error) {
    return `check failed: ${String(error)}`;
  }
}

if (__DEV__) {
  void appleStatus().then((status) => console.log('[social] Apple sign-in:', status));
}

export type AppleCredential = {
  identityToken: string;
  /** The raw nonce; Apple's token carries its SHA-256, which the server checks. */
  nonce: string;
  authorizationCode: string | null;
  givenName: string | null;
  familyName: string | null;
};

/** Signs in with Apple; null if the person cancels. */
export async function appleCredential(): Promise<AppleCredential | null> {
  const nonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    if (!credential.identityToken) return null;
    return {
      identityToken: credential.identityToken,
      nonce,
      authorizationCode: credential.authorizationCode,
      givenName: credential.fullName?.givenName ?? null,
      familyName: credential.fullName?.familyName ?? null,
    };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}
