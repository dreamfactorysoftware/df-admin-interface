import { RunStatus, RunSummary } from 'src/app/shared/types/scheduler';

/** "5 minutes ago" style text, locale-aware via the platform Intl API. */
export function formatAgo(iso: string, now: number = Date.now()): string {
  const secs = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return rtf.format(secs, 'second');
}

/** Transloco key + params for the "Last run" cell. */
export function describeLastRun(
  rs: RunStatus | undefined,
  now: number = Date.now()
): { key: string; params: Record<string, unknown> } {
  if (rs?.isRunning) return { key: 'scheduler.run.running', params: {} };
  const run = rs?.lastRun;
  if (!run) return { key: 'scheduler.run.never', params: {} };
  const ago = formatAgo(run.finishedAt ?? run.startedAt, now);
  return isOk(run)
    ? { key: 'scheduler.run.ok', params: { ago } }
    : { key: 'scheduler.run.failed', params: { ago, code: run.statusCode } };
}

export function isOk(run: RunSummary): boolean {
  return run.statusCode !== null && run.statusCode < 300;
}

/** Whole seconds a finished run took; null while still open. */
export function durationSeconds(run: RunSummary): number | null {
  if (!run.finishedAt) return null;
  return Math.max(
    0,
    Math.round(
      (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) /
        1000
    )
  );
}
