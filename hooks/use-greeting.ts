// hooks/use-greeting.ts — morning / afternoon / evening, kept honest.
//
// Reading the clock once at render is not enough: the dashboard is a tab, so it
// can stay mounted for hours. Someone who opens the app at 11:50 and comes back
// after lunch should not still be told "Good morning". This recomputes when the
// boundary passes, and again whenever the app returns to the foreground — the
// common case being a phone left locked overnight.
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type GreetingKey = 'goodMorning' | 'goodAfternoon' | 'goodEvening';

export const greetingFor = (date = new Date()): GreetingKey => {
  const hour = date.getHours();

  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';

  return 'goodEvening';
};

// milliseconds until the next time the greeting would change (12:00 or 18:00,
// otherwise midnight). Sleeping exactly that long beats polling every minute.
const msUntilNextBoundary = (now = new Date()) => {
  const next = new Date(now);
  const hour = now.getHours();

  if (hour < 12) next.setHours(12, 0, 0, 0);
  else if (hour < 18) next.setHours(18, 0, 0, 0);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
  }

  // never schedule a zero or negative timeout
  return Math.max(next.getTime() - now.getTime(), 1000);
};

export function useGreeting() {
  const [key, setKey] = useState<GreetingKey>(() => greetingFor());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      clearTimeout(timer);
      setKey(greetingFor());
      timer = setTimeout(schedule, msUntilNextBoundary());
    };

    schedule();

    // a timer does not fire reliably while the app is backgrounded, so also
    // recheck the moment it comes back
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return key;
}

export default useGreeting;
