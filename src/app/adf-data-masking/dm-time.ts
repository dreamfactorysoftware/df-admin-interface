/** Relative time ("2 days ago", "in 7 hours") with Intl, no deps. */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

export function relTime(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = t - now;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) < ms) continue;
    // Days count calendar days, so a row never says "yesterday" under an
    // older day heading.
    if (unit === 'day') return rtf.format(calendarDays(t, now), unit);
    return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(0, 'minute').replace('this minute', 'just now');
}

function calendarDays(t: number, now: number): number {
  const midnight = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);
  return Math.round((midnight(t) - midnight(now)) / 86_400_000);
}

/** Short clock or date for an expiry: "6:42 AM" within a day, else "Nov 2". */
export function shortWhen(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  const soon = Math.abs(d.getTime() - now) < 86_400_000;
  return soon
    ? d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
