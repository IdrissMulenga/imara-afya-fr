// lib/errors.ts — turn an Apollo/network error into a user-facing string.
// Prefers the GraphQL error message the backend sent (e.g. "Invalid email or
// password"), falls back to the provided generic message for network failures.
//
// Apollo Client v4 changed the error shape: GraphQL errors thrown from a
// mutation now arrive as a `CombinedGraphQLErrors` whose messages live on
// `.errors[]` (v3 used `.graphQLErrors[]`). We read both so the real backend
// message surfaces instead of a generic/combined string.
type MaybeApolloError = {
  errors?: { message?: string }[];        // v4 CombinedGraphQLErrors
  graphQLErrors?: { message?: string }[]; // v3 ApolloError (legacy)
  networkError?: unknown;
  message?: string;
};

export function errorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const e = err as MaybeApolloError | null | undefined;
  const first = e?.errors?.[0]?.message ?? e?.graphQLErrors?.[0]?.message;
  if (first) return first;
  if (e?.networkError) return fallback;
  return e?.message || fallback;
}
