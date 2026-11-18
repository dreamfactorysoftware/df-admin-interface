/**
 * Calendar days for the usage charts.
 *
 * The backend buckets usage by day and serves each day as `YYYY-MM-DD`.
 * That string names a calendar day, not an instant. `new Date('2026-11-03')`
 * is midnight UTC, which is still November 2 everywhere west of UTC, so the
 * local getters return the day before. Read the parts of the string instead.
 */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** Parse `YYYY-MM-DD`. Null for anything else, timestamps included. */
export function parseCalendarDate(
  value: string | null | undefined
): CalendarDate | null {
  const m = typeof value === 'string' ? CALENDAR_DATE.exec(value) : null;
  if (!m) {
    return null;
  }
  const [year, month, day] = [+m[1], +m[2], +m[3]];
  return month >= 1 && month <= 12 && day >= 1 && day <= 31
    ? { year, month, day }
    : null;
}

/** Local midnight of a calendar day, for day-by-day arithmetic in local
 *  time. Null when the value is not a calendar day. */
export function calendarDateToLocal(
  value: string | null | undefined
): Date | null {
  const d = parseCalendarDate(value);
  return d ? new Date(d.year, d.month - 1, d.day) : null;
}

/**
 * `M/D` axis label for a chart bucket. A calendar day is shown as that day
 * in every timezone. A full timestamp is an instant, so it is shown in
 * local time. Empty string when the value is not a date.
 */
export function dayLabel(value: string | null | undefined): string {
  const day = parseCalendarDate(value);
  if (day) {
    return `${day.month}/${day.day}`;
  }
  const d = new Date(value ?? '');
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`;
}
