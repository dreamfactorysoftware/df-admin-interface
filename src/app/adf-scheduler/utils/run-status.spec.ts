import { RunStatus, RunSummary } from 'src/app/shared/types/scheduler';
import { describeLastRun, durationSeconds, isOk } from './run-status';

const NOW = Date.parse('2026-10-28T12:00:00Z');
const run = (over: Partial<RunSummary> = {}): RunSummary => ({
  id: 1,
  startedAt: '2026-10-28T11:55:00Z',
  finishedAt: '2026-10-28T11:55:30Z',
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

describe('describeLastRun', () => {
  it('says Running while a run is in progress', () => {
    const open = run({ finishedAt: null, statusCode: null });
    expect(
      describeLastRun(status({ isRunning: true, lastRun: open }), NOW).key
    ).toBe('scheduler.run.running');
  });

  it('says Never when the task has not run', () => {
    expect(describeLastRun(status(), NOW).key).toBe('scheduler.run.never');
    expect(describeLastRun(undefined, NOW).key).toBe('scheduler.run.never');
  });

  it('reports OK with a relative time', () => {
    const d = describeLastRun(
      status({ lastRun: run({ finishedAt: '2026-10-28T11:55:00Z' }) }),
      NOW
    );
    expect(d.key).toBe('scheduler.run.ok');
    expect(d.params['ago']).toContain('5');
  });

  it('reports Failed with the status code', () => {
    const d = describeLastRun(
      status({ lastRun: run({ statusCode: 404 }) }),
      NOW
    );
    expect(d.key).toBe('scheduler.run.failed');
    expect(d.params['code']).toBe(404);
  });
});

describe('run helpers', () => {
  it('classifies success below 300', () => {
    expect(isOk(run({ statusCode: 299 }))).toBe(true);
    expect(isOk(run({ statusCode: 300 }))).toBe(false);
  });

  it('computes duration, null while open', () => {
    expect(durationSeconds(run())).toBe(30);
    expect(durationSeconds(run({ finishedAt: null }))).toBeNull();
  });
});
