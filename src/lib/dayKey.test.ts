import { addDays, daysBetween, isDayKey, maxDayKey, msUntilNextDay, todayKey } from './dayKey';

describe('todayKey', () => {
  it('uses the local calendar date', () => {
    expect(todayKey(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02');
    expect(todayKey(new Date(2026, 9, 3, 0, 0))).toBe('2026-10-03');
  });

  it('pads month and day', () => {
    expect(todayKey(new Date(2027, 0, 5))).toBe('2027-01-05');
  });
});

describe('isDayKey', () => {
  it.each(['2026-10-02', '2028-02-29', '1999-12-31'])('accepts %s', (key) => {
    expect(isDayKey(key)).toBe(true);
  });

  it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026-1-1', 'today', '', 20261002, null])(
    'rejects %s',
    (key) => {
      expect(isDayKey(key)).toBe(false);
    },
  );
});

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-10-01', '2026-10-02')).toBe(1);
    expect(daysBetween('2026-10-02', '2026-10-01')).toBe(-1);
    expect(daysBetween('2026-10-02', '2026-10-02')).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('handles leap years', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2028-01-01', '2029-01-01')).toBe(366);
  });

  it('is not affected by DST transitions', () => {
    // EU DST changes: 2026-03-29 and 2026-10-25
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('throws on invalid keys', () => {
    expect(() => daysBetween('nope', '2026-10-02')).toThrow();
  });
});

describe('addDays', () => {
  it('moves across boundaries', () => {
    expect(addDays('2026-10-02', 1)).toBe('2026-10-03');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2026-10-25', 0)).toBe('2026-10-25');
  });
});

describe('msUntilNextDay', () => {
  it('counts down to local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 9, 2, 23, 59, 0))).toBe(60_000);
    expect(msUntilNextDay(new Date(2026, 9, 2, 0, 0, 0))).toBe(24 * 3_600_000);
  });
});

describe('maxDayKey', () => {
  it('returns the later day', () => {
    expect(maxDayKey('2026-10-02', '2026-09-30')).toBe('2026-10-02');
    expect(maxDayKey('2026-09-30', '2027-01-01')).toBe('2027-01-01');
  });
});
