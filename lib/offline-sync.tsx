// Sends entries saved offline: when the app starts signed in, when it returns to the foreground,
// and every minute while any are waiting. Says once per send when some were sent or refused.
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useNotice } from '@/components/notice';
import { useSession } from './session';
import { flushQueue, setQueueUser, useQueuedCount } from './offline-queue';
import { APP_COPY } from '@/theme/copy-app';
import { useLang } from '@/theme/i18n';

const RETRY_MS = 60_000;

export function OfflineSync() {
  const { user, ready } = useSession();
  const { lang } = useLang();
  const notice = useNotice();
  const waiting = useQueuedCount();
  const userId = user?.id ?? null;
  const running = useRef(false);

  // One send at a time, so its result is said once.
  const flush = useCallback(() => {
    if (running.current) return;
    running.current = true;
    const a = APP_COPY[lang];
    void flushQueue()
      .then(({ sent, dropped }) => {
        if (dropped > 0) notice.failure(a.offlineDroppedTitle, a.offlineDropped.replace('{n}', String(dropped)));
        else if (sent > 0) notice.toast(a.offlineSent.replace('{n}', String(sent)));
      })
      .finally(() => {
        running.current = false;
      });
  }, [lang, notice]);

  // Entries are kept per user; only the signed-in user's are counted and sent.
  useEffect(() => {
    if (ready) setQueueUser(userId);
  }, [ready, userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    flush();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') flush();
    });
    return () => sub.remove();
  }, [ready, userId, flush]);

  useEffect(() => {
    if (!ready || !userId || waiting === 0) return;
    const timer = setInterval(flush, RETRY_MS);
    return () => clearInterval(timer);
  }, [ready, userId, waiting, flush]);

  return null;
}
