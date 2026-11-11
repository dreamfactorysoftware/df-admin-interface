import { RunStatus, RunSummary } from 'src/app/shared/types/scheduler';
import {
  TranslatableText,
  formatRelativeTime,
  parseDfDate,
} from 'src/app/shared/utilities/access-usage';

/**
 * "5 minutes ago" wording from the app's shared relative-time helper (the
 * same one the "Last used" columns use). The backend always sends the times
 * this is called with.
 */
const formatAgo = (
  value: string | null | undefined,
  now: number,
  locale: string
): string => formatRelativeTime(parseDfDate(value) as Date, now, locale);

/**
 * Transloco key + params for the "Last run" cell.
 *
 * Null means the backend sent no run data at all (a df-scheduler without
 * per-run history): the caller shows nothing rather than a false "Never".
 */
export function describeLastRun(
  rs: RunStatus | null | undefined,
  now: number = Date.now(),
  locale = 'en'
): TranslatableText | null {
  if (!rs) return null;
  if (rs.isRunning) return { key: 'scheduler.run.running' };
  const run = rs.lastRun;
  if (!run) return { key: 'scheduler.run.never' };

  // Open but not running: the process died or was killed. The backend only
  // closes such a row when the next run starts.
  if (!run.finishedAt) {
    return {
      key: 'scheduler.run.unfinished',
      params: { ago: formatAgo(run.startedAt, now, locale) },
    };
  }

  const ago = formatAgo(run.finishedAt, now, locale);
  return isOk(run)
    ? { key: 'scheduler.run.ok', params: { ago } }
    : {
        key: 'scheduler.run.failedCode',
        params: { ago, code: run.statusCode as number },
      };
}

export function isOk(run: RunSummary): boolean {
  return (
    run.statusCode !== null &&
    run.statusCode !== undefined &&
    run.statusCode < 300
  );
}

/** Whole seconds a finished run took; null while open or without both times. */
export function durationSeconds(run: RunSummary): number | null {
  const started = parseDfDate(run.startedAt);
  const finished = parseDfDate(run.finishedAt);
  if (!started || !finished) return null;
  return Math.max(
    0,
    Math.round((finished.getTime() - started.getTime()) / 1000)
  );
}

export type RunPhase = 'running' | 'unfinished' | 'finished';

/**
 * A row without finished_at is "running" only when it is the task's current
 * run; any other open row is a run that never finished.
 */
export function runPhase(
  run: RunSummary,
  rs: RunStatus | null | undefined
): RunPhase {
  if (run.finishedAt) return 'finished';
  return rs?.isRunning && rs.lastRun?.id === run.id ? 'running' : 'unfinished';
}
