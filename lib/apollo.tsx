// lib/apollo.tsx — Apollo Client (v4) wired to the backend.
// Every request automatically carries `Authorization: Bearer <token>` when one
// is stored, so authed operations (me, completeProfile) just work.
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';

import { API_URL } from '@/lib/config';
import { getToken } from '@/lib/tokens';

const authLink = new SetContextLink(async (prevContext) => {
  const token = await getToken();
  return {
    headers: {
      ...prevContext.headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const httpLink = new HttpLink({ uri: API_URL });

const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export const ApolloWrapper = ({ children }: { children: ReactNode }) => (
  <ApolloProvider client={client}>{children}</ApolloProvider>
);

export default client;
