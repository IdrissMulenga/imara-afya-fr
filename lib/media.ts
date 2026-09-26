// Avatar upload and removal (REST, not GraphQL), and resolving stored photo
// paths, which are relative to the API origin.
import { File, UploadType } from 'expo-file-system';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { GRAPHQL_URL } from './apollo';
import { getToken } from './tokens';
import { currentLang } from '@/theme/i18n';

/** The API's origin: GRAPHQL_URL without the /graphql path. */
export const API_ORIGIN = GRAPHQL_URL.replace(/\/graphql\/?$/i, '');

const AVATAR_URL = `${API_ORIGIN}/upload/avatar`;

/** A full URL for a photo: backend paths get the API origin, full URLs are kept. */
export function resolveMedia(url?: string | null): string | null {
  const value = url?.trim();
  if (!value) return null;

  // Already complete, or a local file the picker just handed us.
  if (/^(https?:|data:|file:|content:)/i.test(value)) return value;

  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
}

// Turns an error body into an error readError() understands.
const asGraphQLError = (bodyText: string | null, fallback: string): never => {
  let first: { message?: string; extensions?: { code?: string } } | undefined;

  try {
    const parsed = JSON.parse(bodyText ?? '') as {
      errors?: { message?: string; extensions?: { code?: string } }[];
    };
    first = parsed?.errors?.[0];
  } catch {
    // Not JSON.
  }

  throw new CombinedGraphQLErrors({
    errors: [
      {
        message: first?.message ?? fallback,
        extensions: { code: first?.extensions?.code ?? 'SERVER' },
      },
    ],
  });
};

/** Uploads the picked image and returns the stored path. */
export async function uploadAvatar(localUri: string): Promise<string> {
  const token = await getToken();

  let result: { status: number; body: string };
  try {
    result = await new File(localUri).upload(AVATAR_URL, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      // Matches upload.single('photo') on the backend.
      fieldName: 'photo',
      mimeType: 'image/jpeg',
      headers: {
        'accept-language': currentLang(),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (cause) {
    // Could not send the request at all.
    if (__DEV__) {
      console.warn(
        '[upload] the request never completed.\n' +
          `      url: ${AVATAR_URL}\n` +
          `      file: ${localUri}\n` +
          `      reason: ${cause instanceof Error ? cause.message : String(cause)}\n` +
          '      checks: is the backend running and RESTARTED since /upload was added?\n' +
          '              does that URL answer from a browser on this phone?',
      );
    }
    throw cause;
  }

  if (result.status < 200 || result.status >= 300) {
    asGraphQLError(result.body, `Upload failed (HTTP ${result.status}).`);
  }

  let photoUrl: unknown;
  try {
    photoUrl = (JSON.parse(result.body) as { photoUrl?: unknown })?.photoUrl;
  } catch {
    photoUrl = undefined;
  }

  if (typeof photoUrl !== 'string' || !photoUrl) {
    asGraphQLError(result.body, 'The server did not return a photo address.');
  }

  return photoUrl as string;
}

/** Removes the stored photo. Returns the new (empty) value. */
export async function removeAvatar(): Promise<string> {
  const token = await getToken();

  const response = await fetch(AVATAR_URL, {
    method: 'DELETE',
    headers: {
      'accept-language': currentLang(),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => null);
    asGraphQLError(body, `Could not remove the photo (HTTP ${response.status}).`);
  }

  return '';
}
