// Apollo Client (v4). Links, in order:
//   auth   bearer token, device id, language
//   error  clears a dead session
//   http   the request
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken, endSession } from './tokens';
import { getDeviceId } from './device';
import { currentLang } from '@/theme/i18n';

// Backend URL. EXPO_PUBLIC_GRAPHQL_URL in builds; in development, the Metro host
// with EXPO_PUBLIC_API_PORT (must match the backend PORT).
const API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim() || '5500';

function resolveUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GRAPHQL_URL?.trim();
  if (fromEnv) return fromEnv;

  // Dev machine address from Expo ("192.168.1.14:8081"); older SDKs use the legacy field.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}/graphql`;

  return `http://localhost:${API_PORT}/graphql`;
}

export const GRAPHQL_URL = resolveUrl();

if (__DEV__) {
  console.log(`[api] talking to ${GRAPHQL_URL}`);

  if (GRAPHQL_URL.includes('localhost') && Platform.OS !== 'web') {
    console.warn(
      '[api] the URL fell back to localhost, which on a real phone means the\n' +
        '      phone itself. Metro did not report a host. Set\n' +
        `      EXPO_PUBLIC_GRAPHQL_URL=http://<your-computer-ip>:${API_PORT}/graphql\n` +
        '      in .env and restart with: npx expo start -c',
    );
  }
}

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

const authLink = new SetContextLink(async (prevContext) => {
  const [token, deviceId] = await Promise.all([getToken(), getDeviceId()]);
  return {
    headers: {
      ...(prevContext.headers ?? {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      // Identifies this phone in the trusted-device list.
      'x-device-id': deviceId,
      // Language of error messages returned by the server.
      'accept-language': currentLang(),
    },
  };
});

// Error codes that mean the token is no longer valid. Nothing else signs the user out.
const DEAD_SESSION = new Set(['TOKEN_REVOKED', 'SESSION_EXPIRED', 'UNAUTHENTICATED']);

/** Whether the server rejected the token. */
export function isDeadSession(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some((graphQLError) => {
    const code = (graphQLError.extensions as { code?: string } | undefined)?.code;
    return Boolean(code && DEAD_SESSION.has(code));
  });
}

// Ends the session only if the rejected token is still the stored one; a newer
// token (e.g. just saved by changePassword) is left alone.
const errorLink = new ErrorLink(({ error, operation }) => {
  if (!isDeadSession(error)) return;
  const sent = (operation.getContext().headers as Record<string, string> | undefined)?.authorization;
  void (async () => {
    const stored = await getToken();
    if (stored && sent !== `Bearer ${stored}`) return;
    await endSession();
  })();
});

export const client = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // One entry per day, so a mutation updates every screen showing that day.
      HabitDay: { keyFields: ['day'] },
      CheckIn: { keyFields: ['day'] },
    },
  }),
  defaultOptions: {
    // Serve cached data first, then refresh.
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
