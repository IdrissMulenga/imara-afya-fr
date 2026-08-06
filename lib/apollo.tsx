// lib/apollo.tsx — Apollo Client (v4) wired to the backend.
// Every request automatically carries `Authorization: Bearer <token>` when one
// is stored, so authed operations (me, completeProfile) just work.
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, CombinedGraphQLErrors } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';

import { API_URL } from '@/lib/config';
import { getToken } from '@/lib/tokens';
import { endSession } from '@/lib/session';

const authLink = new SetContextLink(async (prevContext) => {
  const token = await getToken();
  return {
    headers: {
      ...prevContext.headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// A token can die at any moment — the 7-day expiry passing mid-session, a
// logout on another device, a password change. Without this the screen just
// fills with empty cards and there is no way back to the login screen.
//
// Only GraphQL errors are acted on. A network failure on 2G is not a dead
// token, and logging someone out because a request timed out would be worse
// than the problem.
const errorLink = new ErrorLink(({ error }) => {
  if (!CombinedGraphQLErrors.is(error)) return;

  const dead = error.errors.some((e) => {
    const code = e.extensions?.code;
    return code === 'UNAUTHENTICATED' || code === 'SESSION_EXPIRED';
  });

  if (dead) void endSession();
});

const httpLink = new HttpLink({ uri: API_URL });

const client = new ApolloClient({
  // errorLink sits above httpLink so it sees the response, and below authLink
  // so it isn't triggered while the token is still being attached
  link: ApolloLink.from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
});

export const ApolloWrapper = ({ children }: { children: ReactNode }) => (
  <ApolloProvider client={client}>{children}</ApolloProvider>
);

export default client;
