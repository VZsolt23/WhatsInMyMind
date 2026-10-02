import { useEffect, useState } from 'react';
import { maxDayKey, todayKey, type DayKey } from '@/lib/dayKey';
import { metaSpec } from '@/storage/schemas';
import { storage as defaultStorage, type Storage } from '@/storage/storage';

export interface CurrentDay {
  day: DayKey;
  /** The device clock is earlier than a day we have already seen. */
  clockBehind: boolean;
}

/** Never goes back to an earlier day than one already seen, so turning the clock back gives no replays. */
export function resolveDay(today: DayKey, lastSeenDay: DayKey | null): CurrentDay {
  if (lastSeenDay && today < lastSeenDay) return { day: lastSeenDay, clockBehind: true };
  return { day: today, clockBehind: false };
}

export function checkCurrentDay(
  store: Storage = defaultStorage,
  now: Date = new Date(),
): CurrentDay {
  const meta = store.load(metaSpec);
  const today = todayKey(now);
  const current = resolveDay(today, meta.lastSeenDay);
  const lastSeenDay = meta.lastSeenDay ? maxDayKey(meta.lastSeenDay, today) : today;
  if (lastSeenDay !== meta.lastSeenDay) store.save(metaSpec, { lastSeenDay });
  return current;
}

const CHECK_INTERVAL_MS = 30_000;

/** The effective day, re-checked periodically and when the tab becomes visible again. */
export function useCurrentDay(): CurrentDay {
  const [current, setCurrent] = useState<CurrentDay>(() => checkCurrentDay());

  useEffect(() => {
    const check = () => {
      const next = checkCurrentDay();
      setCurrent((prev) =>
        prev.day === next.day && prev.clockBehind === next.clockBehind ? prev : next,
      );
    };
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  return current;
}
