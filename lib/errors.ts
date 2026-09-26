// Reads errors returned by the API. Messages arrive already translated by the
// backend; only the network-failure messages are defined here.
import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import type { Lang } from '@/theme/i18n';
import { GRAPHQL_URL } from './apollo';

export type BackendError = {
  code: string;
  /** Already in the caller's language. Show it as-is. */
  message: string;
  /** Present on OTP_COOLDOWN and RATE_LIMITED. */
  retryAfterSeconds?: number;
  /** Present on OTP_INCORRECT and WRONG_PASSWORD. */
  attemptsLeft?: number;
};

// Shown when no response arrived.
const OFFLINE: Record<Lang, string> = {
  en: 'No connection. Check your internet and try again.',
  fr: 'Pas de connexion. Vérifiez votre internet et réessayez.',
  sw: 'Hakuna muunganisho. Angalia intaneti yako kisha ujaribu tena.',
  rn: 'Nta murongo uhari. Raba interineti yawe hanyuma ugerageze.',
};

type Shaped = { message?: string; extensions?: Record<string, unknown> };

const fromGraphQLError = (first: Shaped | undefined, lang: Lang): BackendError => {
  const ext = (first?.extensions ?? {}) as Record<string, unknown>;
  return {
    code: typeof ext.code === 'string' ? ext.code : 'INTERNAL',
    message: first?.message ?? OFFLINE[lang],
    retryAfterSeconds:
      typeof ext.retryAfterSeconds === 'number' ? ext.retryAfterSeconds : undefined,
    attemptsLeft: typeof ext.attemptsLeft === 'number' ? ext.attemptsLeft : undefined,
  };
};

// Shown when the server replied with something unusable.
const UNREACHABLE: Record<Lang, string> = {
  en: 'We could not reach the server.',
  fr: 'Impossible de joindre le serveur.',
  sw: 'Hatukuweza kufikia seva.',
  rn: 'Ntitwashoboye gushika kuri seriveri.',
};

const TOO_MANY: Record<Lang, string> = {
  en: 'Too many attempts. Please wait a moment and try again.',
  fr: 'Trop de tentatives. Patientez un instant puis réessayez.',
  sw: 'Majaribio mengi mno. Subiri kidogo kisha ujaribu tena.',
  rn: 'Wagerageje kenshi cane. Rindira gato hanyuma ugerageze.',
};

/** Any error as a code, a message in the user's language and the field it concerns. */
export function readError(error: unknown, lang: Lang): BackendError {
  // The ordinary case: the server answered 200 with an `errors` array.
  if (CombinedGraphQLErrors.is(error)) {
    return fromGraphQLError(error.errors[0] as Shaped | undefined, lang);
  }

  // Non-200 response: read the error from the body if there is one.
  if (ServerError.is(error)) {
    try {
      const body = JSON.parse(error.bodyText) as { errors?: Shaped[] };
      if (body.errors?.length) return fromGraphQLError(body.errors[0], lang);
    } catch {
      // not JSON — fall through to the status below
    }

    return {
      code: error.statusCode === 429 ? 'RATE_LIMITED' : 'SERVER',
      message:
        error.statusCode === 429
          ? TOO_MANY[lang]
          : `${UNREACHABLE[lang]} (HTTP ${error.statusCode})`,
    };
  }

  // A 200 whose body was not JSON (usually a captive portal).
  if (ServerParseError.is(error)) {
    return { code: 'SERVER', message: `${UNREACHABLE[lang]} (HTTP ${error.statusCode})` };
  }

  // No response at all.
  if (__DEV__) {
    console.warn(
      '[api] request never reached the server.\n' +
        `      url: ${GRAPHQL_URL}\n` +
        `      reason: ${error instanceof Error ? error.message : String(error)}\n` +
        '      checks: is the backend running? does that URL work in a browser\n' +
        '              on the phone? on Android, is cleartext http allowed?',
    );
  }

  return { code: 'NETWORK', message: OFFLINE[lang] };
}

/** Just the translated message of an error. */
export const errorMessage = (error: unknown, lang: Lang): string => readError(error, lang).message;

// Appends the retry time when the server sends one.
const IN_SECONDS: Record<Lang, (s: number) => string> = {
  en: (s) => `Try again in ${s}s.`,
  fr: (s) => `Réessayez dans ${s} s.`,
  sw: (s) => `Jaribu tena baada ya sekunde ${s}.`,
  rn: (s) => `Gerageza bushasha mu masegonda ${s}.`,
};

/** The message, plus the wait time when the server says to retry later. */
export function errorWithWait(error: unknown, lang: Lang): string {
  const failure = readError(error, lang);
  if (!failure.retryAfterSeconds) return failure.message;
  return `${failure.message} ${IN_SECONDS[lang](failure.retryAfterSeconds)}`;
}

export type FieldKey = 'name' | 'email' | 'password' | 'confirm' | 'code' | null;

// The input a backend error code belongs to. null means the whole form.
const FIELD_OF: Record<string, FieldKey> = {
  INVALID_EMAIL: 'email',
  EMAIL_TAKEN: 'email',
  EMAIL_NOT_VERIFIED: 'email',
  ACCOUNT_NOT_FOUND: 'email',

  WEAK_PASSWORD: 'password',
  WRONG_PASSWORD: 'password',
  PASSWORD_UNCHANGED: 'password',
  PASSWORD_ATTEMPTS_EXCEEDED: 'password',

  OTP_INCORRECT: 'code',
  OTP_EXPIRED: 'code',
  OTP_NOT_FOUND: 'code',
  OTP_ATTEMPTS_EXCEEDED: 'code',

  // Not tied to a field: the server does not say which one was wrong.
  INVALID_CREDENTIALS: null,
};

/** The form field an error code belongs to, if any. */
export const fieldOf = (code: string): FieldKey => FIELD_OF[code] ?? null;
