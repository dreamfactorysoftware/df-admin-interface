import {
  calendarDateToLocal,
  dayLabel,
  parseCalendarDate,
} from './calendar-date';

/**
 * These expectations hold in every timezone. Run the file with the zone
 * forced to prove it: TZ=America/Denver, TZ=Asia/Tokyo, TZ=Pacific/Kiritimati.
 */
describe('calendar-date', () => {
  describe('parseCalendarDate', () => {
    it('reads the parts of a YYYY-MM-DD string', () => {
      expect(parseCalendarDate('2026-11-03')).toEqual({
        year: 2026,
        month: 11,
        day: 3,
      });
    });

    it.each([
      ['a timestamp', '2026-11-03T00:00:00Z'],
      ['a date and time', '2026-11-03 10:00:00'],
      ['a month out of range', '2026-13-01'],
      ['a day out of range', '2026-11-32'],
      ['an empty string', ''],
      ['null', null],
      ['undefined', undefined],
    ])('returns null for %s', (_what, value) => {
      expect(parseCalendarDate(value)).toBeNull();
    });
  });

  describe('dayLabel', () => {
    it.each([
      ['2026-11-03', '11/3'],
      ['2026-11-06', '11/6'],
      ['2026-01-01', '1/1'],
      ['2026-03-01', '3/1'],
      ['2026-12-31', '12/31'],
      ['2028-02-29', '2/29'],
    ])('labels %s as %s', (date, label) => {
      expect(dayLabel(date)).toBe(label);
    });

    it('labels a timestamp with its local day', () => {
      const instant = new Date(2026, 10, 3, 23, 30); // local time
      expect(dayLabel(instant.toISOString())).toBe('11/3');
    });

    it.each([['not a date'], [''], [null], [undefined]])(
      'is empty for %p',
      value => {
        expect(dayLabel(value)).toBe('');
      }
    );
  });

  describe('calendarDateToLocal', () => {
    it('is local midnight of that day', () => {
      const d = calendarDateToLocal('2026-11-03')!;
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([
        2026, 10, 3,
      ]);
      expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
    });

    it('is null for anything that is not a calendar day', () => {
      expect(calendarDateToLocal('2026-11-03T00:00:00Z')).toBeNull();
      expect(calendarDateToLocal(null)).toBeNull();
    });
  });
});
