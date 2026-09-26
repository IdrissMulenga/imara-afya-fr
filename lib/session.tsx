// Session state: signIn, signOut and the current user. Only sign-out or a rejected token
// ends a session; network failures keep the user signed in.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { ApolloClient } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import {
  getToken,
  saveToken,
  getProfile,
  saveProfile,
  clearSession,
  isExpired,
  shouldRefresh,
  onSessionEnded,
} from './tokens';
import { isDeadSession } from './apollo';
import { useLang } from '@/theme/i18n';
import { ME, REFRESH_SESSION, LOGOUT, type AuthUser, type AuthPayload } from '@/graphql/auth';

type SessionValue = {
  user: AuthUser | null;
  /** False until storage has been read. */
  ready: boolean;
  signIn: (payload: AuthPayload) => Promise<void>;
  signOut: () => Promise<void>;
  /** End the session locally without calling the server (used after account deletion). */
  forgetSession: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  /** Reloads the signed-in user from the server. */
  refreshUser: () => Promise<void>;
};

const SessionContext = createContext<SessionValue>({
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
  forgetSession: async () => {},
  setUser: () => {},
  refreshUser: async () => {},
});

/** Provides the session to the app. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const client = useApolloClient();
  const { setLang } = useLang();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Signs out when the Apollo error link ends the session.
  useEffect(
    () =>
      onSessionEnded(() => {
        setUserState(null);
        client.clearStore().catch(() => {});
      }),
    [client],
  );

  // Applies the account's language whenever it is loaded or changed.
  const accountLanguage = user?.language;
  useEffect(() => {
    if (accountLanguage) setLang(accountLanguage);
  }, [accountLanguage, setLang]);

  // Saves each accepted profile to storage.
  const accept = useCallback((next: AuthUser) => {
    setUserState(next);
    void saveProfile(next);
  }, []);

  const signIn = useCallback(
    async (payload: AuthPayload) => {
      await saveToken(payload.token);
      await saveProfile(payload.user);
      setUserState(payload.user);
    },
    [],
  );

  const forgetSession = useCallback(async () => {
    await clearSession();
    setUserState(null);
    await client.clearStore().catch(() => {});
  }, [client]);

  const signOut = useCallback(async () => {
    // Logs out on the server (signing out every device), then clears locally.
    try {
      await client.mutate({ mutation: LOGOUT });
    } catch {
      // ignore
    }
    await forgetSession();
  }, [client, forgetSession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getToken();

      // No token, or an expired one.
      if (!token || isExpired(token)) {
        if (token) await clearSession();
        if (!cancelled) setReady(true);
        return;
      }

      const handlers = {
        onUser: (next: AuthUser) => {
          if (!cancelled) accept(next);
        },
        onDead: () => {
          if (!cancelled) setUserState(null);
        },
      };

      const cached = await getProfile();

      if (cached) {
        // Restored from storage: show the app before any network call.
        if (!cancelled) {
          setUserState(cached);
          setReady(true);
        }
        void revalidate(client, token, handlers);
        return;
      }

      // No cached profile: ask the server before showing the app.
      try {
        await revalidate(client, token, handlers);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, accept]);

  // Rechecks the token when the app returns to the foreground.
  const foregrounded = useRef(true);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      const active = state === 'active';
      const returning = active && !foregrounded.current;
      foregrounded.current = active;
      if (!returning) return;

      void (async () => {
        const token = await getToken();
        if (!token) {
          setUserState(null);
          return;
        }

        if (isExpired(token)) {
          await clearSession();
          setUserState(null);
          return;
        }

        await revalidate(client, token, {
          onUser: accept,
          onDead: () => setUserState(null),
        });
      })();
    });

    return () => sub.remove();
  }, [client, accept]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await client.query<{ me: AuthUser }>({ query: ME, fetchPolicy: 'network-only' });
      if (data?.me) accept(data.me);
    } catch {
      // ignore: offline keeps the current profile; a dead session is handled by the error link
    }
  }, [client, accept]);

  const value = useMemo<SessionValue>(
    () => ({ user, ready, signIn, signOut, forgetSession, setUser: accept, refreshUser }),
    [user, ready, signIn, signOut, forgetSession, accept, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// Renews the token if it is close to expiry, then refreshes the profile.
async function revalidate(
  client: ApolloClient,
  token: string,
  handlers: { onUser: (user: AuthUser) => void; onDead: () => void },
): Promise<void> {
  const dead = async () => {
    await clearSession();
    handlers.onDead();
  };

  if (shouldRefresh(token)) {
    try {
      const { data } = await client.mutate<{ refreshSession: AuthPayload }>({
        mutation: REFRESH_SESSION,
      });
      if (data?.refreshSession) {
        await saveToken(data.refreshSession.token);
        handlers.onUser(data.refreshSession.user);
        return;
      }
    } catch (error) {
      // The server ended the session: sign out.
      if (isDeadSession(error)) {
        await dead();
        return;
      }
      // Network errors keep the current token.
    }
  }

  try {
    const { data } = await client.query<{ me: AuthUser }>({
      query: ME,
      fetchPolicy: 'network-only',
    });
    if (data?.me) handlers.onUser(data.me);
  } catch (error) {
    if (isDeadSession(error)) await dead();
    // Otherwise: offline. The cached profile stands and the app works.
  }
}

export const useSession = () => useContext(SessionContext);
