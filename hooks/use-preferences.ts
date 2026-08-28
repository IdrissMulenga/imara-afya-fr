// hooks/use-preferences.ts — keep the backend told where the phone is.
//
// WHY THIS EXISTS.
//
// Everything that groups by day — doses taken, water drunk, a check-in, a
// routine ticked, a streak — is resolved on the backend in the user's timezone.
// It can only do that if it knows the timezone, and the only thing that knows
// it is the phone.
//
// Without this the account sits on the UTC default, and someone in Bujumbura
// logging a dose at 00:30 has it filed under yesterday. That was a real bug,
// and this is the half of the fix that lives in the app.
import { useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';

import { SET_PREFERENCES, type SetPreferencesData } from '@/graphql';
import useMe from '@/hooks/use-me';

// The IANA name the OS reports, e.g. "Africa/Bujumbura". Supported on every
// Hermes build we target, but wrapped anyway — a throw here would break launch.
export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

export function usePreferences() {
  const { me } = useMe();

  const [setPreferences] = useMutation<SetPreferencesData>(SET_PREFERENCES);

  // Only ever push once per app run. Without this guard the effect would fire
  // again on every cache write that touches the user, which on the dashboard is
  // several times a minute.
  const pushed = useRef(false);

  useEffect(() => {
    if (!me || pushed.current) return;

    const timezone = deviceTimezone();

    // Nothing to do if we can't read it, or if the backend already agrees.
    // Skipping the no-op write matters on 2G, where every avoidable request is
    // a second of someone's day.
    if (!timezone || me.timezone === timezone) return;

    pushed.current = true;

    // Deliberately not awaited and deliberately swallowed: this is background
    // housekeeping, and a failure must never surface as an error to someone who
    // just opened the app. It will be retried on the next launch.
    setPreferences({ variables: { input: { timezone } } }).catch(() => {
      pushed.current = false;
    });
  }, [me, setPreferences]);

  const setUnits = (unitSystem: 'metric' | 'imperial') =>
    setPreferences({ variables: { input: { unitSystem } } });

  return {
    timezone: me?.timezone ?? deviceTimezone(),
    unitSystem: (me?.unitSystem ?? 'metric') as 'metric' | 'imperial',
    setUnits,
  };
}

export default usePreferences;
