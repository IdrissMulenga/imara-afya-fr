// lib/session.ts — one place that knows the session has ended.
//
// The Apollo error link lives outside React, so it can't navigate. It calls
// endSession() instead, and the root layout listens and sends the user to the
// login screen. Keeping the two apart also means anything else that discovers a
// dead session (the startup gate, a failed refresh) can use the same path.
import { clearToken } from '@/lib/tokens';

type Listener = () => void;

const listeners = new Set<Listener>();

// A screen usually has several queries in flight. When a token dies they all
// fail at once, and without this every one of them would try to log the user
// out. Latch it so the work happens once.
let ending = false;

export function onSessionEnd(listener: Listener) {
  listeners.add(listener);

  // returned so a useEffect can clean up after itself
  return () => listeners.delete(listener);
}

// Called when the backend says the token is no longer good — expired, revoked
// by a logout elsewhere, or invalidated by a password change.
export async function endSession() {
  if (ending) return;

  ending = true;

  try {
    await clearToken();
  } finally {
    for (const listener of listeners) listener();
  }
}

// Signing in again re-arms the latch. Without this a second logout in the same
// app run would be silently ignored.
export function resetSessionLatch() {
  ending = false;
}
