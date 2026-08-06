// lib/errors.ts — turn an Apollo/network error into a user-facing string.
// Prefers the GraphQL error message the backend sent (e.g. "Invalid email or
// password"), falls back to the provided generic message for network failures.
//
// Apollo Client v4 changed the error shape: GraphQL errors thrown from a
// mutation now arrive as a `CombinedGraphQLErrors` whose messages live on
// `.errors[]` (v3 used `.graphQLErrors[]`). We read both so the real backend
// message surfaces instead of a generic/combined string.
type GraphQLErrorLike = {
  message?: string;
  extensions?: { code?: string; retryAfter?: number };
};

type MaybeApolloError = {
  errors?: GraphQLErrorLike[];        // v4 CombinedGraphQLErrors
  graphQLErrors?: GraphQLErrorLike[]; // v3 ApolloError (legacy)
  networkError?: unknown;
  message?: string;
};

const firstError = (err: unknown) => {
  const e = err as MaybeApolloError | null | undefined;

  return e?.errors?.[0] ?? e?.graphQLErrors?.[0];
};

// The backend turns people away when an operation is called too often — a
// tapped-twice button, or a retry loop on a bad connection. That is not a real
// failure and shouldn't be reported like one: the right response is to wait,
// not to change anything.
export function isRateLimited(err: unknown) {
  return firstError(err)?.extensions?.code === 'RATE_LIMITED';
}

// How long to wait, in seconds, when isRateLimited() is true.
export function retryAfterSeconds(err: unknown) {
  const seconds = firstError(err)?.extensions?.retryAfter;

  return typeof seconds === 'number' ? seconds : null;
}

export function errorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const e = err as MaybeApolloError | null | undefined;
  const first = firstError(err)?.message;
  if (first) return first;
  if (e?.networkError) return fallback;
  return e?.message || fallback;
}
