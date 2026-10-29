import {
  TestBed,
  fakeAsync,
  flush,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import {
  DataMaskingStore,
  ruleFootprint,
  summarize,
} from './data-masking.store';
import { DmUndoToastService } from './df-dm-undo-toast/df-dm-undo-toast.component';
import { DfDataMaskingApiService } from './data-masking-api.service';
import { column, dmTransloco } from './dm-testing';
import {
  AccessSettings,
  ActivityEvent,
  ActivityQuery,
  DetectionRule,
  MaskedColumn,
  MaskingOverview,
} from './data-masking.types';

const overview = (over: Partial<MaskingOverview> = {}): MaskingOverview => ({
  mode: 'preview',
  scan: { status: 'idle', columns: 3, finishedAt: '2026-10-28T00:00:00Z' },
  counts: { masked: 1, review: 1, clear: 1 },
  you: { canGrant: true, seesRealValues: false },
  ...over,
});

const access = (ai: AccessSettings['ai']): AccessSettings => ({
  admins: { mode: 'none', grants: [], available: [] },
  ai,
  roles: [],
});

const boom = () => throwError(() => ({ status: 500, message: 'boom' }));

describe('DataMaskingStore', () => {
  let store: DataMaskingStore;
  let api: Record<string, jest.Mock>;
  let snack: { openSnackBar: jest.Mock; openError: jest.Mock };
  let undo: { open: jest.Mock };

  const seedColumns = () => {
    const list: MaskedColumn[] = [
      column({
        id: 'crm.a.dob',
        table: 'a',
        column: 'dob',
        verdict: 'review',
        class: 'date_of_birth',
        tier: 'identity',
      }),
      column({ id: 'crm.a.ssn', table: 'a', column: 'ssn' }),
    ];
    store.columns.set('crm', list);
    store.services = [
      { service: 'crm', label: 'CRM', tables: [summarize('a', list)] },
    ];
    store.overview = overview();
    return list;
  };

  beforeEach(() => {
    api = {
      overview: jest.fn(() => of(overview())),
      tables: jest.fn(() => of([])),
      columns: jest.fn(() => of([])),
      setMode: jest.fn(),
      scan: jest.fn(),
      decide: jest.fn(),
      access: jest.fn(),
      updateAccess: jest.fn(),
      masks: jest.fn(),
      setMask: jest.fn(),
      rules: jest.fn(),
      builtInRules: jest.fn(() =>
        of({ ruleset: 'x', version: '1', classes: [] })
      ),
      addRule: jest.fn(),
      deleteRule: jest.fn(),
      activity: jest.fn(() => of({ events: [], hasMore: false })),
      tableCount: jest.fn(() => of(0)),
      baselines: jest.fn(() => of([])),
    };
    snack = { openSnackBar: jest.fn(), openError: jest.fn() };
    undo = { open: jest.fn() };
    TestBed.configureTestingModule({
      imports: [dmTransloco()],
      providers: [
        DataMaskingStore,
        { provide: DfDataMaskingApiService, useValue: api },
        { provide: DfSnackbarService, useValue: snack },
        { provide: DmUndoToastService, useValue: undo },
      ],
    });
    store = TestBed.inject(DataMaskingStore);
  });

  describe('activity', () => {
    it('reloads in place after a change while it is loaded', () => {
      store.overview = overview();
      store.loadActivity();
      expect(api['activity']).toHaveBeenCalledTimes(1);
      api['setMode'].mockReturnValue(of(overview({ mode: 'on' })));
      store.setMode('on');
      expect(api['activity']).toHaveBeenCalledTimes(2);
      // Never back to null: the tab keeps showing the list.
      expect(store.activity).not.toBeNull();
    });

    it('stays unloaded when its tab was never opened', () => {
      store.overview = overview();
      api['setMode'].mockReturnValue(of(overview({ mode: 'on' })));
      store.setMode('on');
      expect(api['activity']).not.toHaveBeenCalled();
      expect(store.activity).toBeNull();
    });
  });

  describe('load failures', () => {
    it.each([
      ['access', 'loadAccess', 'access'],
      ['masks', 'loadMasks', 'masks'],
      ['rules', 'loadRules', 'rules'],
      ['activity', 'loadActivity', 'activity'],
    ] as const)(
      'marks %s failed so its tab can offer retry',
      (slice, loader, call) => {
        api[call].mockReturnValue(boom());
        (store[loader] as () => void)();
        expect(store.failed.has(slice)).toBe(true);
        api[call].mockReturnValue(
          of(
            slice === 'access'
              ? access('masked')
              : slice === 'activity'
                ? { events: [], hasMore: false }
                : []
          )
        );
        (store[loader] as () => void)();
        expect(store.failed.has(slice)).toBe(false);
      }
    );
  });

  describe('write ordering', () => {
    it('a late failure never rolls back a newer successful decision', () => {
      const list = seedColumns();
      const first = new Subject<MaskedColumn>();
      const second = new Subject<MaskedColumn>();
      api['decide'].mockReturnValueOnce(first).mockReturnValueOnce(second);

      store.decide(list[0], 'date_of_birth'); // keep masked
      store.decide(store.columns.get('crm')![0], 'email'); // then re-class
      second.next({
        ...list[0],
        verdict: 'masked',
        class: 'email',
        source: 'admin',
      });
      second.complete();
      first.error({ status: 500 });

      const dob = store.columns.get('crm')![0];
      expect(dob.verdict).toBe('masked');
      expect(dob.class).toBe('email');
      expect(store.counts.review).toBe(0);
      expect(snack.openError).not.toHaveBeenCalled();
    });

    it('if the newer decision fails, it rolls back to the last confirmed one', () => {
      const list = seedColumns();
      const first = new Subject<MaskedColumn>();
      const second = new Subject<MaskedColumn>();
      api['decide'].mockReturnValueOnce(first).mockReturnValueOnce(second);

      store.decide(list[0], 'date_of_birth');
      store.decide(store.columns.get('crm')![0], 'email');
      first.next({
        ...list[0],
        verdict: 'masked',
        class: 'date_of_birth',
        source: 'admin',
      });
      first.complete();
      second.error({ status: 500 });

      const dob = store.columns.get('crm')![0];
      expect(dob.class).toBe('date_of_birth');
      expect(dob.verdict).toBe('masked');
      expect(store.counts.review).toBe(0);
      expect(snack.openError).toHaveBeenCalledTimes(1);
    });

    it('access: writes go one at a time, each with the latest version', () => {
      store.overview = overview();
      api['access'].mockReturnValue(of({ ...access('masked'), version: 'v1' }));
      store.loadAccess();
      const first = new Subject<AccessSettings>();
      const second = new Subject<AccessSettings>();
      api['updateAccess']
        .mockReturnValueOnce(first)
        .mockReturnValueOnce(second);

      store.updateAccess({ ai: 'same_as_admins' }, access('same_as_admins'));
      store.updateAccess({ ai: 'masked' }, access('masked'));
      // The second waits for the first: it must carry the version the
      // first produces, or the server would refuse it as stale.
      expect(api['updateAccess']).toHaveBeenCalledTimes(1);
      expect(api['updateAccess'].mock.calls[0][0]).toEqual({
        ai: 'same_as_admins',
        version: 'v1',
      });
      // The newer optimistic state stays on screen meanwhile.
      expect(store.access?.ai).toBe('masked');
      first.next({ ...access('same_as_admins'), version: 'v2' });
      first.complete();
      expect(store.access?.ai).toBe('masked');
      expect(api['updateAccess'].mock.calls[1][0]).toEqual({
        ai: 'masked',
        version: 'v2',
      });
      second.next({ ...access('masked'), version: 'v3' });
      second.complete();
      expect(store.access?.ai).toBe('masked');
      // One toast for the burst.
      expect(snack.openSnackBar).toHaveBeenCalledTimes(1);
    });

    it('access: a stale version (409) restores, drops queued writes and re-reads', () => {
      store.overview = overview();
      api['access'].mockReturnValue(of({ ...access('masked'), version: 'v1' }));
      store.loadAccess();
      const first = new Subject<AccessSettings>();
      api['updateAccess'].mockReturnValueOnce(first);
      const onError1 = jest.fn();
      const onError2 = jest.fn();
      store.updateAccess(
        { ai: 'same_as_admins' },
        access('same_as_admins'),
        onError1
      );
      store.updateAccess({ ai: 'masked' }, access('masked'), onError2);
      // Someone else changed access since this page read it.
      api['access'].mockReturnValue(
        of({ ...access('same_as_admins'), version: 'v9' })
      );
      first.error({
        status: 409,
        message:
          'Access settings changed since you loaded them. Reload and try again.',
      });
      expect(onError1).toHaveBeenCalled();
      expect(onError2).toHaveBeenCalled();
      expect(api['updateAccess']).toHaveBeenCalledTimes(1);
      // The page already re-reads: a UI string says so, not the server's
      // "Reload and try again".
      expect(snack.openError).not.toHaveBeenCalled();
      expect(snack.openSnackBar).toHaveBeenCalledTimes(1);
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'Access settings changed elsewhere. Showing the latest.',
        'warning'
      );
      // Re-read: the screen shows what the server now has.
      expect(api['access']).toHaveBeenCalledTimes(2);
      expect(store.access?.ai).toBe('same_as_admins');
      expect(store.access?.version).toBe('v9');
    });

    it('access: a failed save restores the confirmed settings and calls back', () => {
      store.overview = overview();
      api['access'].mockReturnValue(of(access('masked')));
      store.loadAccess();
      api['updateAccess'].mockReturnValue(boom());
      const onError = jest.fn();
      store.updateAccess(
        { ai: 'same_as_admins' },
        access('same_as_admins'),
        onError
      );
      expect(store.access?.ai).toBe('masked');
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('scan polling', () => {
    it('never stacks requests and finishes exactly once', fakeAsync(() => {
      store.overview = overview();
      const polls: Subject<MaskingOverview>[] = [];
      api['scan'].mockReturnValue(
        of(overview({ scan: { status: 'running', progress: 0, columns: 3 } }))
      );
      api['overview'].mockImplementation(() => {
        const s = new Subject<MaskingOverview>();
        polls.push(s);
        return s;
      });
      store.scan();
      tick(800);
      tick(800);
      tick(800);
      // The first request is still pending, so no others were sent.
      expect(polls.length).toBe(1);
      polls[0].next(
        overview({ scan: { status: 'running', progress: 50, columns: 3 } })
      );
      polls[0].complete();
      tick(800);
      expect(polls.length).toBe(2);
      polls[1].next(
        overview({
          scan: {
            status: 'idle',
            columns: 3,
            finishedAt: '2026-10-29T00:00:00Z',
            lastStatus: 'done',
          },
        })
      );
      polls[1].complete();
      tick(800);
      tick(800);
      expect(polls.length).toBe(2);
      expect(api['tables']).toHaveBeenCalledTimes(1);
      expect(snack.openSnackBar).toHaveBeenCalledTimes(1);
      expect(store.scanning).toBe(false);
      discardPeriodicTasks();
    }));

    it('polling that keeps failing gives up after its retries, once', fakeAsync(() => {
      store.overview = overview();
      api['scan'].mockReturnValue(
        of(overview({ scan: { status: 'running', progress: 10, columns: 3 } }))
      );
      api['overview'].mockReturnValue(boom());
      store.scan();
      tick(800);
      // Retrying: still shown as running.
      expect(store.scanning).toBe(true);
      tick(1000 + 2000 + 3000 + 4000);
      expect(store.scanning).toBe(false);
      expect(api['overview']).toHaveBeenCalledTimes(5);
      expect(snack.openError).toHaveBeenCalledTimes(1);
      tick(5000);
      expect(api['overview']).toHaveBeenCalledTimes(5);
    }));

    it('one failed poll does not abandon a running scan', fakeAsync(() => {
      store.overview = overview({
        scan: { status: 'running', progress: 10, columns: 3 },
      });
      let n = 0;
      api['overview'].mockImplementation(() => {
        n++;
        // A single 502 from the proxy, then the scan keeps running.
        return n === 1
          ? throwError(() => ({ status: 502 }))
          : of(
              overview({
                scan: { status: 'running', progress: 50, columns: 3 },
              })
            );
      });
      (store as unknown as { startPolling(own: boolean): void }).startPolling(
        true
      );
      tick(800 * 4);
      expect(n).toBeGreaterThan(1);
      expect(store.scanning).toBe(true);
      expect(snack.openError).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('a poll issued before a mode change cannot put the old mode back', fakeAsync(() => {
      store.overview = overview({
        mode: 'on',
        scan: { status: 'running', progress: 40, columns: 3 },
      });
      const poll = new Subject<MaskingOverview>();
      api['overview'].mockReturnValue(poll);
      api['tables'].mockReturnValue(of([]));
      (store as unknown as { startPolling(own: boolean): void }).startPolling(
        true
      );
      tick(800); // poll #1 is in flight (server still says On)
      const patch = new Subject<MaskingOverview>();
      api['setMode'].mockReturnValue(patch);
      store.setMode('off');
      patch.next(
        overview({
          mode: 'off',
          scan: { status: 'running', progress: 60, columns: 3 },
        })
      );
      patch.complete();
      expect(store.mode).toBe('off');
      // The slower poll lands last: answered before the PATCH ran, and the
      // scan's final poll at that.
      poll.next(overview({ mode: 'on' }));
      poll.complete();
      flush();
      expect(store.mode).toBe('off');
      discardPeriodicTasks();
    }));
  });

  describe('first scan', () => {
    const unscanned = () =>
      overview({
        mode: 'off',
        scan: { status: 'idle', progress: null, finishedAt: null, columns: 0 },
        counts: { masked: 0, review: 0, clear: 0 },
      });
    const scannedTables = () => [
      {
        service: 'crm',
        label: 'CRM',
        tables: [summarize('a', [column({ table: 'a' })])],
      },
    ];

    it('covered services listed with no tables are not a scan', () => {
      store.overview = unscanned();
      store.services = [{ service: 'crm', label: 'CRM', tables: [] }];
      expect(store.scanned).toBe(false);
      expect(store.unscanned).toBe(true);
      expect(store.firstRun).toBe(true);
      expect(store.unscannedServices.map(s => s.service)).toEqual(['crm']);
    });

    it('a scanned database with no tables is not "not scanned yet"', () => {
      store.overview = overview();
      store.services = [
        ...scannedTables(),
        // The built-in SQLite `db` service of a default install: scanned, empty.
        {
          service: 'db',
          label: 'Local SQL Database',
          scannedAt: '2026-10-29T04:55:58Z',
          tables: [],
        },
        { service: 'hr', label: 'HR', scannedAt: null, tables: [] },
      ];
      expect(store.unscannedServices.map(s => s.service)).toEqual(['hr']);
    });

    it('a scan time alone proves a scan (every database empty)', () => {
      store.overview = unscanned();
      store.services = [
        {
          service: 'db',
          label: 'DB',
          scannedAt: '2026-10-29T04:55:58Z',
          tables: [],
        },
      ];
      expect(store.scanned).toBe(true);
      expect(store.unscannedServices).toEqual([]);
    });

    it('a scan of empty databases found no columns (masking has nothing to act on)', () => {
      store.overview = overview({
        mode: 'off',
        scan: {
          status: 'idle',
          columns: 0,
          finishedAt: '2026-10-29T04:55:58Z',
        },
        counts: { masked: 0, review: 0, clear: 0 },
      });
      store.services = [
        {
          service: 'db',
          label: 'DB',
          scannedAt: '2026-10-29T04:55:58Z',
          tables: [],
        },
      ];
      expect(store.scanned).toBe(true);
      expect(store.foundColumns).toBe(false);
      store.overview = overview();
      store.services = scannedTables();
      expect(store.foundColumns).toBe(true);
    });

    it('says Preview is on when the first scan moved the mode', fakeAsync(() => {
      store.overview = unscanned();
      store.services = [{ service: 'crm', label: 'CRM', tables: [] }];
      api['scan'].mockReturnValue(
        of({
          ...unscanned(),
          scan: { status: 'running', progress: 0, columns: 0 },
        })
      );
      // The server switches Off -> Preview after the first scan ever.
      api['overview'].mockReturnValue(of(overview({ mode: 'preview' })));
      api['tables'].mockReturnValue(of(scannedTables()));
      api['columns'].mockReturnValue(of([column({ table: 'a' })]));
      store.scan();
      expect(store.firstRun).toBe(true);
      tick(800);
      expect(store.mode).toBe('preview');
      expect(store.settling).toBe(false);
      expect(store.firstRun).toBe(false);
      expect(store.unscanned).toBe(false);
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'Scan finished. Preview is on.',
        'success'
      );
      discardPeriodicTasks();
    }));

    it('a later scan only says it finished', fakeAsync(() => {
      store.overview = overview();
      store.services = scannedTables();
      api['scan'].mockReturnValue(
        of(overview({ scan: { status: 'running', progress: 0, columns: 3 } }))
      );
      api['overview'].mockReturnValue(
        of(
          overview({
            scan: {
              status: 'idle',
              columns: 3,
              finishedAt: '2026-10-29T01:00:00Z',
              lastStatus: 'done',
            },
          })
        )
      );
      api['tables'].mockReturnValue(of(scannedTables()));
      api['columns'].mockReturnValue(of([column({ table: 'a' })]));
      store.scan();
      tick(800);
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'Scan finished',
        'success'
      );
      discardPeriodicTasks();
    }));

    it('scans one service when asked, and never twice at once', () => {
      store.overview = overview();
      api['scan'].mockReturnValue(new Subject<MaskingOverview>());
      store.scan('hr');
      store.scan('hr');
      expect(api['scan']).toHaveBeenCalledTimes(1);
      expect(api['scan']).toHaveBeenCalledWith('hr');
    });

    it('counts only databases with masked or review columns', () => {
      store.services = [
        ...scannedTables(),
        {
          service: 'store',
          label: 'Store',
          tables: [
            summarize('t', [
              column({ verdict: 'clear', class: null, tier: null }),
            ]),
          ],
        },
        { service: 'hr', label: 'HR', tables: [] },
      ];
      expect(store.maskedDatabases).toBe(1);
    });

    it('reads coverage from the overview', () => {
      store.overview = overview({
        coverage: {
          covered: [{ service: 'crm', label: 'CRM', type: 'pgsql' }],
          uncovered: [{ service: 'm', label: 'Mongo', type: 'mongodb' }],
        },
      });
      expect(store.uncovered.map(u => u.type)).toEqual(['mongodb']);
      store.overview = overview();
      expect(store.uncovered).toEqual([]);
    });
  });

  describe('mode', () => {
    it('holds further changes while one is saving', () => {
      store.overview = overview();
      const pending = new Subject<MaskingOverview>();
      api['setMode'].mockReturnValue(pending);
      store.setMode('on');
      expect(store.modeSaving).toBe(true);
      store.setMode('off');
      expect(api['setMode']).toHaveBeenCalledTimes(1);
      pending.next(overview({ mode: 'on' }));
      pending.complete();
      expect(store.modeSaving).toBe(false);
      expect(store.mode).toBe('on');
    });
  });

  describe('scan outcome', () => {
    const tables = () => [
      {
        service: 'crm',
        label: 'CRM',
        scannedAt: '2026-10-28T00:00:00Z',
        tables: [summarize('a', [column({ table: 'a' })])],
      },
    ];
    beforeEach(() => {
      store.overview = overview();
      store.services = tables();
      api['scan'].mockReturnValue(
        of(overview({ scan: { status: 'running', progress: 0, columns: 3 } }))
      );
      api['tables'].mockReturnValue(of(tables()));
      api['columns'].mockReturnValue(of([column({ table: 'a' })]));
    });
    const toasts = () =>
      snack.openSnackBar.mock.calls.map(c => [c[0], c[1]] as const);

    it('a scan that failed (no new finished_at) is not announced as finished', fakeAsync(() => {
      // An older backend: no last_status, and finished_at still names the
      // previous successful scan.
      api['overview'].mockReturnValue(of(overview()));
      store.scan('crm');
      tick(800);
      flush();
      expect(toasts().map(t => t[0])).not.toContain('Scan finished');
      expect(toasts()).toEqual([["Scan didn't finish.", 'warning']]);
      discardPeriodicTasks();
    }));

    it('names the database a scan could not read', fakeAsync(() => {
      api['overview'].mockReturnValue(
        of(
          overview({
            scan: {
              status: 'idle',
              columns: 3,
              finishedAt: '2026-10-28T00:00:00Z',
              lastStatus: 'failed',
              failed: [
                { service: 'orders_db', label: 'Orders', reason: 'refused' },
              ],
            },
          })
        )
      );
      store.scan('orders_db');
      tick(800);
      flush();
      expect(toasts()).toEqual([
        ["Scan failed. Couldn't read Orders.", 'warning'],
      ]);
      discardPeriodicTasks();
    }));

    it('a partial scan finishes with a warning naming what it could not read', fakeAsync(() => {
      api['overview'].mockReturnValue(
        of(
          overview({
            scan: {
              status: 'idle',
              columns: 3,
              finishedAt: '2026-10-29T00:00:00Z',
              lastStatus: 'partial',
              failed: [
                { service: 'hr', label: 'HR' },
                { service: 'erp', label: 'ERP' },
              ],
            },
          })
        )
      );
      store.scan();
      tick(800);
      flush();
      expect(toasts()).toEqual([
        ["Scan finished. Couldn't read HR and ERP.", 'warning'],
      ]);
      discardPeriodicTasks();
    }));

    it("lists a database the scan could not read under Couldn't scan, not Not scanned yet", () => {
      store.services = [
        ...tables(),
        {
          service: 'hr',
          label: 'HR',
          scannedAt: null,
          scanError: 'Login failed',
          tables: [],
        },
        {
          service: 'new',
          label: 'New',
          scannedAt: null,
          scanError: null,
          tables: [],
        },
      ];
      expect(store.failedServices.map(s => s.service)).toEqual(['hr']);
      expect(store.unscannedServices.map(s => s.service)).toEqual(['new']);
      expect(store.scanErrorOf(store.services[1])).toBe('Login failed');
    });

    it("a later scan keeps the admin's place (no view reset)", fakeAsync(() => {
      const resets = jest.fn();
      store.viewReset$.subscribe(resets);
      api['overview'].mockReturnValue(
        of(
          overview({
            scan: {
              status: 'idle',
              columns: 3,
              finishedAt: '2026-10-29T00:00:00Z',
              lastStatus: 'done',
            },
          })
        )
      );
      const before = store.structure;
      store.scan();
      tick(800);
      flush();
      expect(resets).not.toHaveBeenCalled();
      expect(store.structure).toBeGreaterThan(before);
      discardPeriodicTasks();
    }));
  });

  describe('background scans (page left open)', () => {
    beforeEach(() => {
      store.loading = false;
      store.overview = overview();
      store.services = [];
    });

    it('new results reload the lists in place, quietly', fakeAsync(() => {
      const resets = jest.fn();
      store.viewReset$.subscribe(resets);
      api['overview'].mockReturnValue(
        of(
          overview({
            scan: {
              status: 'idle',
              columns: 4,
              finishedAt: '2026-10-29T02:00:00Z',
              lastStatus: 'done',
            },
          })
        )
      );
      api['tables'].mockReturnValue(
        of([{ service: 'inv', label: 'Inventory', scannedAt: 'x', tables: [] }])
      );
      store.startWatching();
      tick(30_000);
      expect(api['tables']).toHaveBeenCalledTimes(1);
      expect(store.services.map(s => s.service)).toEqual(['inv']);
      expect(resets).not.toHaveBeenCalled();
      expect(snack.openSnackBar).not.toHaveBeenCalled();
      // Nothing new: nothing reloaded.
      tick(30_000);
      expect(api['tables']).toHaveBeenCalledTimes(1);
      store.stopWatching();
      discardPeriodicTasks();
    }));

    it('a scan running elsewhere is followed to its end', fakeAsync(() => {
      let n = 0;
      api['overview'].mockImplementation(() => {
        n++;
        return of(
          n < 3
            ? overview({
                scan: { status: 'running', progress: 50, columns: 3 },
              })
            : overview({
                scan: {
                  status: 'idle',
                  columns: 3,
                  finishedAt: '2026-10-29T03:00:00Z',
                  lastStatus: 'done',
                },
              })
        );
      });
      store.startWatching();
      tick(30_000);
      expect(store.scanning).toBe(true);
      tick(800);
      tick(800);
      expect(store.scanning).toBe(false);
      expect(api['tables']).toHaveBeenCalledTimes(1);
      store.stopWatching();
      discardPeriodicTasks();
    }));
  });

  describe('decisions', () => {
    it('not sensitive offers Undo, which masks the column again with its class', () => {
      const list = seedColumns();
      api['decide'].mockImplementation((id: string, cls: string | null) =>
        of({
          ...list.find(c => c.id === id)!,
          class: cls,
          verdict: cls ? 'masked' : 'clear',
          source: 'admin',
        })
      );
      store.decide(list[1], null); // ssn, masked as national_id
      expect(undo.open).toHaveBeenCalledTimes(1);
      expect(undo.open.mock.calls[0][0]).toBe('ssn marked not sensitive');
      expect(undo.open.mock.calls[0][1]).toBe('Undo');
      undo.open.mock.calls[0][2]();
      expect(api['decide']).toHaveBeenLastCalledWith(
        'crm.a.ssn',
        'national_id'
      );
      expect(store.columns.get('crm')![1].verdict).toBe('masked');
      // Masking (keep or re-class) needs no undo toast.
      store.decide(store.columns.get('crm')![0], 'date_of_birth');
      expect(undo.open).toHaveBeenCalledTimes(1);
    });

    it('an older success never becomes the rollback point after a newer one settled', () => {
      const list = seedColumns();
      const a = new Subject<MaskedColumn>();
      const b = new Subject<MaskedColumn>();
      const c = new Subject<MaskedColumn>();
      api['decide']
        .mockReturnValueOnce(a)
        .mockReturnValueOnce(b)
        .mockReturnValueOnce(c);
      const at = (cls: string) =>
        ({
          ...list[0],
          verdict: 'masked',
          class: cls,
          source: 'admin',
        }) as MaskedColumn;
      store.decide(list[0], 'email');
      store.decide(store.columns.get('crm')![0], 'phone');
      b.next(at('phone'));
      b.complete();
      a.next(at('email')); // late: older than what the server has now
      a.complete();
      store.decide(store.columns.get('crm')![0], 'username');
      c.error({ status: 500 });
      expect(store.columns.get('crm')![0].class).toBe('phone');
    });
  });

  describe('rules', () => {
    const rule = (over: Partial<DetectionRule> = {}): DetectionRule => ({
      id: 1,
      match: 'name',
      pattern: '(^|_)id$',
      class: 'username',
      matches: 2,
      ...over,
    });
    const ev = (lines: [number, string, string][]) => ({
      total: lines.reduce((n, l) => n + l[0], 0),
      thresholdMask: 70,
      thresholdReview: 40,
      lines: lines.map(([points, kind, text]) => ({
        points,
        kind: kind as 'name',
        text,
      })),
    });

    it('a failed rule delete puts back only that rule', () => {
      const a = rule({ id: 1, pattern: '^a$' });
      const b = rule({ id: 2, pattern: '^b$' });
      store.rules = [{ ...a }];
      const del = new Subject<unknown>();
      api['deleteRule'].mockReturnValue(del);
      api['addRule'].mockReturnValue(of({ ...b }));
      store.deleteRule(store.rules[0]);
      store
        .addRule({ match: 'name', pattern: '^b$', class: 'email' })
        .subscribe();
      del.error({ status: 500 });
      expect(store.rules?.map(r => r.id)).toEqual([1, 2]);
    });

    it('knows which columns a rule masked, and which nothing else would flag', () => {
      const r = rule();
      const cols = [
        // Masked by the rule alone: safe to unmask with it.
        column({
          id: 's.t.id',
          verdict: 'masked',
          evidence: ev([[70, 'context', 'Custom rule (^|_)id$']]),
        }),
        // The rule plus a weak signal: would be "review" without it.
        column({
          id: 's.t.user_id',
          verdict: 'masked',
          evidence: ev([
            [70, 'context', 'Custom rule (^|_)id$'],
            [45, 'name', 'Column name'],
          ]),
        }),
        // Masked anyway (strong name evidence): not the rule's doing.
        column({
          id: 's.t.ssn_id',
          verdict: 'masked',
          evidence: ev([
            [70, 'context', 'Custom rule (^|_)id$'],
            [80, 'name', 'Column name "ssn"'],
          ]),
        }),
        // An admin decision is never touched.
        column({
          id: 's.t.cid',
          verdict: 'masked',
          source: 'admin',
          evidence: ev([[70, 'context', 'Custom rule (^|_)id$']]),
        }),
      ];
      const f = ruleFootprint(r, cols);
      expect(f.masked.map(c => c.id)).toEqual(['s.t.id', 's.t.user_id']);
      expect(f.ruleOnly.map(c => c.id)).toEqual(['s.t.id']);
      // Value and baseline rules write their own evidence lines.
      expect(
        ruleFootprint(rule({ match: 'value', source: 'baseline:hipaa' }), [
          column({
            id: 's.t.x',
            evidence: ev([
              [70, 'values', 'Baseline value rule (^|_)id$ (hipaa)'],
            ]),
          }),
        ]).masked.length
      ).toBe(1);
    });

    it('delete and unmask marks those columns not sensitive, then says so', () => {
      store.overview = overview();
      const cols = [column({ id: 'crm.a.id', table: 'a', column: 'id' })];
      store.columns.set('crm', cols);
      store.services = [
        { service: 'crm', label: 'CRM', tables: [summarize('a', cols)] },
      ];
      store.rules = [rule()];
      api['deleteRule'].mockReturnValue(of({}));
      api['decide'].mockReturnValue(of({ ...cols[0], verdict: 'clear' }));
      api['tables'].mockReturnValue(of(store.services));
      api['columns'].mockReturnValue(of(cols));
      store.deleteRule(store.rules[0], cols);
      expect(api['decide']).toHaveBeenCalledWith('crm.a.id', null);
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'Rule deleted. 1 column unmasked.',
        'success'
      );
    });
  });

  describe('activity paging', () => {
    const ev = (id: number, kind: ActivityEvent['kind']): ActivityEvent => ({
      id,
      at: new Date(Date.UTC(2026, 9, 29, 0, 0, id)).toISOString(),
      actor: 'x',
      kind,
      text: kind,
    });

    it("asks the server for a filter's kinds and pages back with before", () => {
      api['activity'].mockImplementation((q: ActivityQuery) =>
        of(
          q.before
            ? { events: [ev(1, 'blocked')], hasMore: false }
            : { events: [ev(3, 'blocked'), ev(2, 'blocked')], hasMore: true }
        )
      );
      store.showActivity(['blocked']);
      expect(api['activity']).toHaveBeenLastCalledWith({
        kinds: ['blocked'],
        limit: 200,
      });
      expect(store.activity?.map(e => e.id)).toEqual([3, 2]);
      expect(store.activityHasMore).toBe(true);
      store.loadOlderActivity();
      expect(api['activity']).toHaveBeenLastCalledWith({
        kinds: ['blocked'],
        limit: 200,
        before: 2,
      });
      expect(store.activity?.map(e => e.id)).toEqual([3, 2, 1]);
      expect(store.activityHasMore).toBe(false);
    });
  });

  describe('activity refresh vs Load older', () => {
    it('a refresh that lands after Load older keeps the older rows', () => {
      const ev = (id: number): ActivityEvent => ({
        id,
        at: new Date(Date.UTC(2026, 9, 29, 0, 0, id)).toISOString(),
        actor: 'x',
        kind: 'mode',
        text: 'm',
      });
      const first = new Subject<{
        events: ActivityEvent[];
        hasMore: boolean;
      }>();
      api['activity']
        .mockReturnValueOnce(of({ events: [ev(4), ev(3)], hasMore: true }))
        .mockReturnValueOnce(first)
        .mockReturnValueOnce(of({ events: [ev(2), ev(1)], hasMore: false }));
      store.showActivity(null);
      store.invalidateActivity(); // a refresh goes out (slow)
      store.loadOlderActivity(); // and the admin pages back meanwhile
      expect(store.activity?.map(e => e.id)).toEqual([4, 3, 2, 1]);
      first.next({ events: [ev(5), ev(4)], hasMore: true });
      first.complete();
      expect(store.activity?.map(e => e.id)).toEqual([5, 4, 3, 2, 1]);
      expect(store.activityHasMore).toBe(false);
    });
  });

  describe('nothing to mask yet', () => {
    it('before any scan, a default install whose only database is empty has nothing to scan', () => {
      api['overview'].mockReturnValue(
        of(
          overview({
            mode: 'off',
            scan: { status: 'idle', finishedAt: null, columns: 0 },
            counts: { masked: 0, review: 0, clear: 0 },
            coverage: {
              covered: [
                { service: 'db', label: 'Local SQL Database', type: 'sqlite' },
              ],
              uncovered: [],
            },
          })
        )
      );
      api['tables'].mockReturnValue(
        of([{ service: 'db', label: 'Local SQL Database', tables: [] }])
      );
      api['tableCount'].mockReturnValue(of(0));
      store.load();
      expect(api['tableCount']).toHaveBeenCalledWith('db');
      expect(store.nothingToScan).toBe(true);
      // A database that could not answer is never assumed empty.
      api['tableCount'].mockReturnValue(throwError(() => ({ status: 500 })));
      store.load();
      expect(store.nothingToScan).toBe(false);
    });

    it('after a scan, no tables anywhere means add a database', () => {
      store.overview = overview();
      store.services = [
        {
          service: 'db',
          label: 'Local SQL Database',
          scannedAt: 'x',
          tables: [],
        },
      ];
      expect(store.noTables).toBe(true);
      store.services = [
        ...store.services,
        { service: 'hr', label: 'HR', scannedAt: null, tables: [] },
      ];
      expect(store.noTables).toBe(false);
    });
  });
});
