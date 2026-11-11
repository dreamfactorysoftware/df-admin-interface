import { RunStatus, RunSummary } from 'src/app/shared/types/scheduler';
import { describeLastRun, durationSeconds, runPhase } from './run-status';

// The real copy: the table below asserts the text a user reads.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: {
  run: Record<string, string>;
} = require('../../../assets/i18n/scheduler/en.json');

const NOW = Date.parse('2026-10-28T12:00:00Z');
const FIVE_MIN_AGO = '2026-10-28T11:55:00.000000Z';
const TWO_DAYS_AGO = '2026-10-26T12:00:00.000000Z';

const run = (over: Partial<RunSummary> = {}): RunSummary => ({
  id: 1,
  startedAt: '2026-10-28T11:54:30.000000Z',
  finishedAt: FIVE_MIN_AGO,
  statusCode: 200,
  ...over,
});
const status = (over: Partial<RunStatus> = {}): RunStatus => ({
  isRunning: false,
  lastRun: null,
  lastSuccess: null,
  lastFailure: null,
  ...over,
});

/** Render a described cell the way transloco does: key lookup + {{param}}. */
const render = (rs: RunStatus | null | undefined): string | null => {
  const d = describeLastRun(rs, NOW);
  if (!d) return null;
  const leaf = d.key.replace(/^scheduler\.run\./, '');
  const template = EN.run[leaf];
  if (template === undefined) throw new Error(`missing i18n key ${d.key}`);
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, name) =>
    String((d.params ?? {})[name])
  );
};

describe('describeLastRun', () => {
  const cases: Array<[string, RunStatus | null | undefined, string | null]> = [
    ['no run data (older backend)', undefined, null],
    ['never run', status(), 'Never'],
    [
      'running',
      status({
        isRunning: true,
        lastRun: run({ finishedAt: null, statusCode: null }),
      }),
      'Running',
    ],
    ['ok', status({ lastRun: run() }), 'OK, 5 minutes ago'],
    [
      'failed with code',
      status({ lastRun: run({ statusCode: 404 }) }),
      'Failed 404, 5 minutes ago',
    ],
    [
      'stale open run',
      status({
        lastRun: run({
          startedAt: TWO_DAYS_AGO,
          finishedAt: null,
          statusCode: null,
        }),
      }),
      'Did not finish, started 2 days ago',
    ],
  ];

  it.each(cases)('%s', (_name, rs, expected) => {
    expect(render(rs)).toBe(expected);
  });
});

describe('run helpers', () => {
  it('computes duration, null while open or without both times', () => {
    expect(durationSeconds(run())).toBe(30);
    expect(durationSeconds(run({ finishedAt: null }))).toBeNull();
    expect(durationSeconds(run({ startedAt: null }))).toBeNull();
    expect(
      durationSeconds(
        run({ startedAt: FIVE_MIN_AGO, finishedAt: TWO_DAYS_AGO })
      )
    ).toBe(0);
  });

  it('only the current run of a running task is in progress', () => {
    const open = run({ id: 7, finishedAt: null, statusCode: null });
    expect(runPhase(run(), status())).toBe('finished');
    expect(runPhase(open, status({ isRunning: true, lastRun: open }))).toBe(
      'running'
    );
    // Stale: open, but the backend no longer counts the task as running.
    expect(runPhase(open, status({ lastRun: open }))).toBe('unfinished');
    // Open row that is not the task's latest run.
    expect(
      runPhase(open, status({ isRunning: true, lastRun: run({ id: 8 }) }))
    ).toBe('unfinished');
    expect(runPhase(open, undefined)).toBe('unfinished');
  });
});
