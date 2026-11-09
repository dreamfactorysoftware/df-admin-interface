import { RunStatus, RunSummary } from 'src/app/shared/types/scheduler';
import {
  describeLastRun,
  durationSeconds,
  formatAgo,
  isOk,
  runPhase,
} from './run-status';

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
  // Every combination of status code and present/missing timestamps the
  // backend can send, plus the ones it should not but a null column allows.
  const cases: Array<[string, RunStatus | null | undefined, string | null]> = [
    ['no run data (older backend)', undefined, null],
    ['null run data', null, null],
    ['never run', status(), 'Never'],
    [
      'running',
      status({
        isRunning: true,
        lastRun: run({ finishedAt: null, statusCode: null }),
      }),
      'Running',
    ],
    ['ok 200', status({ lastRun: run() }), 'OK, 5 minutes ago'],
    [
      'ok 204',
      status({ lastRun: run({ statusCode: 204 }) }),
      'OK, 5 minutes ago',
    ],
    [
      'ok, no finish time parseable',
      status({ lastRun: run({ finishedAt: 'not a date' }) }),
      'OK',
    ],
    [
      'failed with code',
      status({ lastRun: run({ statusCode: 404 }) }),
      'Failed 404, 5 minutes ago',
    ],
    [
      'failed 500, two days ago',
      status({ lastRun: run({ statusCode: 500, finishedAt: TWO_DAYS_AGO }) }),
      'Failed 500, 2 days ago',
    ],
    [
      'failed with code, unparseable time',
      status({ lastRun: run({ statusCode: 500, finishedAt: 'garbage' }) }),
      'Failed 500',
    ],
    [
      'finished without a status code',
      status({ lastRun: run({ statusCode: null }) }),
      'Failed, 5 minutes ago',
    ],
    [
      'finished without a status code or usable time',
      status({ lastRun: run({ statusCode: null, finishedAt: 'garbage' }) }),
      'Failed',
    ],
    [
      'stale open run, null status code',
      status({
        lastRun: run({
          startedAt: TWO_DAYS_AGO,
          finishedAt: null,
          statusCode: null,
        }),
      }),
      'Did not finish, started 2 days ago',
    ],
    [
      'stale open run that somehow has a status code',
      status({
        lastRun: run({
          startedAt: TWO_DAYS_AGO,
          finishedAt: null,
          statusCode: 500,
        }),
      }),
      'Did not finish, started 2 days ago',
    ],
    [
      'stale open run with no start time',
      status({
        lastRun: run({ startedAt: null, finishedAt: null, statusCode: null }),
      }),
      'Did not finish',
    ],
    [
      'finished in the future (clock skew)',
      status({ lastRun: run({ finishedAt: '2026-10-28T12:03:00Z' }) }),
      'OK, now',
    ],
    [
      'DreamFactory date format without a zone',
      status({ lastRun: run({ finishedAt: '2026-10-28 11:55:00' }) }),
      'OK, 5 minutes ago',
    ],
  ];

  it.each(cases)('%s', (_name, rs, expected) => {
    expect(render(rs)).toBe(expected);
  });

  it('never renders stray punctuation, blanks or unresolved params', () => {
    for (const [name, rs] of cases) {
      const text = render(rs);
      if (text === null) continue;
      expect([name, text]).toEqual([
        name,
        expect.not.stringMatching(/\s,|,\s*$|\s{2,}|^\s|\s$|{{|null|undefined/),
      ]);
    }
  });

  it('returns only the params its key interpolates', () => {
    for (const [, rs] of cases) {
      const d = describeLastRun(rs, NOW);
      if (!d) continue;
      const template = EN.run[d.key.replace(/^scheduler\.run\./, '')];
      const wanted = [...template.matchAll(/{{\s*(\w+)\s*}}/g)].map(m => m[1]);
      expect(Object.keys(d.params ?? {}).sort()).toEqual(wanted.sort());
    }
  });
});

describe('formatAgo', () => {
  it('uses English wording, never the browser default locale', () => {
    expect(formatAgo(TWO_DAYS_AGO, NOW)).toBe('2 days ago');
    expect(formatAgo('2026-10-27T11:00:00Z', NOW)).toBe('yesterday');

    // Record the locale every formatter is built with.
    const Real = Intl.RelativeTimeFormat;
    const locales: unknown[] = [];
    class Probe extends Real {
      constructor(
        locale?: string | string[],
        options?: Intl.RelativeTimeFormatOptions
      ) {
        super(locale, options);
        locales.push(locale);
      }
    }
    (Intl as { RelativeTimeFormat: unknown }).RelativeTimeFormat = Probe;
    try {
      formatAgo(FIVE_MIN_AGO, NOW);
    } finally {
      (Intl as { RelativeTimeFormat: unknown }).RelativeTimeFormat = Real;
    }
    expect(locales).toEqual(['en']);
  });

  it('is null for missing or unparseable input', () => {
    expect(formatAgo(null, NOW)).toBeNull();
    expect(formatAgo(undefined, NOW)).toBeNull();
    expect(formatAgo('', NOW)).toBeNull();
    expect(formatAgo('garbage', NOW)).toBeNull();
  });
});

describe('run helpers', () => {
  it('classifies success below 300', () => {
    expect(isOk(run({ statusCode: 299 }))).toBe(true);
    expect(isOk(run({ statusCode: 300 }))).toBe(false);
    expect(isOk(run({ statusCode: null }))).toBe(false);
  });

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
