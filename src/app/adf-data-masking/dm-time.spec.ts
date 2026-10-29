import { relTime } from './dm-time';

describe('relTime', () => {
  const now = new Date(2026, 9, 29, 0, 30).getTime();

  it('counts calendar days, matching the day headings', () => {
    // 26 hours earlier is two calendar days back, not "yesterday".
    const twoDaysBack = new Date(2026, 9, 27, 22, 30).toISOString();
    expect(relTime(twoDaysBack, now)).toBe('2 days ago');
    expect(relTime(new Date(2026, 9, 28, 0, 0).toISOString(), now)).toBe(
      'yesterday'
    );
  });

  it('keeps hours and minutes inside a day', () => {
    expect(relTime(new Date(2026, 9, 29, 0, 16).toISOString(), now)).toBe(
      '14 minutes ago'
    );
    expect(relTime(new Date(2026, 9, 28, 20, 30).toISOString(), now)).toBe(
      '4 hours ago'
    );
  });
});
