import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DfDmColumnsComponent } from './df-dm-columns.component';
import { DataMaskingStore, summarize } from '../data-masking.store';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { column, dmTransloco } from '../dm-testing';
import { MaskingOverview } from '../data-masking.types';
import { DmUndoToastService } from '../df-dm-undo-toast/df-dm-undo-toast.component';

const overview = (over: Partial<MaskingOverview> = {}): MaskingOverview => ({
  mode: 'off',
  scan: { status: 'idle', progress: null, finishedAt: null, columns: 0 },
  counts: { masked: 0, review: 0, clear: 0 },
  you: { canGrant: true, seesRealValues: false },
  coverage: {
    covered: [{ service: 'crm', label: 'CRM', type: 'pgsql' }],
    uncovered: [
      { service: 'events', label: 'Event store', type: 'mongodb' },
      { service: 'cache', label: 'Session cache', type: 'couchdb' },
    ],
  },
  ...over,
});

describe('DfDmColumnsComponent (first run and coverage)', () => {
  let fixture: ComponentFixture<DfDmColumnsComponent>;
  let store: DataMaskingStore;
  let api: { scan: jest.Mock; overview: jest.Mock };

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (id: string) =>
    el().querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    api = {
      scan: jest.fn(() =>
        of(overview({ scan: { status: 'running', progress: 0, columns: 0 } }))
      ),
      overview: jest.fn(() => of(overview())),
    };
    TestBed.configureTestingModule({
      imports: [DfDmColumnsComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        provideRouter([]),
        DataMaskingStore,
        { provide: DfDataMaskingApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
        { provide: DmUndoToastService, useValue: { open: jest.fn() } },
      ],
    });
    store = TestBed.inject(DataMaskingStore);
    store.loading = false;
    store.overview = overview();
    // The real /table lists covered services before any scan, empty.
    store.services = [{ service: 'crm', label: 'CRM', tables: [] }];
    fixture = TestBed.createComponent(DfDmColumnsComponent);
    fixture.detectChanges();
  });

  it('a covered service with no tables is still the never-scanned state', () => {
    expect(store.scanned).toBe(false);
    expect(store.unscanned).toBe(true);
    expect(q('dm-no-scan')).toBeTruthy();
    expect(q('dm-search')).toBeNull();
  });

  it('first run offers one primary action and a baseline per framework', () => {
    const buttons = el().querySelectorAll('[data-testid="empty-state-action"]');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('Scan databases');
    const chips = Array.from(
      el().querySelectorAll('[data-testid^="dm-baseline-"]')
    ).map(b => b.textContent?.replace(/\s+/g, ' ').trim());
    expect(chips).toEqual([
      'health_and_safety HIPAA',
      'credit_card PCI DSS',
      'account_balance GLBA',
      'gavel CJIS',
      'privacy_tip GDPR',
      'verified_user SOC 2',
      'workspace_premium ISO 27001',
    ]);
  });

  it('a baseline chip opens Compliance on that baseline', () => {
    const router = TestBed.inject(Router);
    const nav = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    q('dm-baseline-pci_dss')!.click();
    expect(nav).toHaveBeenCalledWith(['/', 'api-security', 'compliance'], {
      queryParams: { baseline: 'pci_dss' },
    });
  });

  it('with no SQL database to scan, the first step is adding one', () => {
    const router = TestBed.inject(Router);
    const nav = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    store.overview = overview({ coverage: { covered: [], uncovered: [] } });
    store.services = [];
    fixture.detectChanges();
    expect(q('dm-no-scan')).toBeNull();
    expect(q('dm-no-databases')!.textContent).toContain('No SQL databases yet');
    // Baselines still apply ahead of any data.
    expect(q('dm-first-run-baselines')).toBeTruthy();
    q('empty-state-action')!.click();
    expect(nav).toHaveBeenCalledWith([
      '/',
      'api-connections',
      'api-types',
      'database',
      'create',
    ]);
    expect(api.scan).not.toHaveBeenCalled();
  });

  it('a default install whose only database has no tables is sent to add one, not to scan', () => {
    store.overview = overview({
      coverage: {
        covered: [
          { service: 'db', label: 'Local SQL Database', type: 'sqlite' },
        ],
        uncovered: [],
      },
    });
    store.services = [
      { service: 'db', label: 'Local SQL Database', tables: [] },
    ];
    store.tableCounts = new Map([['db', 0]]);
    fixture.detectChanges();
    expect(q('dm-no-scan')).toBeNull();
    expect(q('dm-no-databases')!.textContent).toContain('No tables to scan');
    expect(q('empty-state-action')!.textContent).toContain('Add a database');
  });

  it('says which database a first scan could not read', () => {
    store.overview = overview({
      scan: {
        status: 'idle',
        progress: null,
        finishedAt: null,
        columns: 0,
        lastStatus: 'failed',
        failed: [{ service: 'crm', label: 'CRM', reason: 'refused' }],
      },
    });
    fixture.detectChanges();
    expect(q('dm-first-scan-failed')!.textContent).toContain(
      "Scan failed. Couldn't read CRM."
    );
    expect(q('dm-no-scan')).toBeTruthy();
  });

  it('the first scan shows progress in place of the call to action', () => {
    q('empty-state-action')!.click();
    fixture.detectChanges();
    expect(api.scan).toHaveBeenCalledWith(undefined);
    expect(q('dm-no-scan')).toBeNull();
    const panel = q('dm-first-scan')!;
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('Scanning 0%');
    // No empty filter flashes while the first scan runs.
    expect(el().textContent).not.toContain('No masked columns');
    expect(el().textContent).not.toContain('All reviewed');
  });

  it('progress without a percentage reads as scanning, not 0%', () => {
    store.overview = overview({
      scan: { status: 'running', progress: null, columns: 0 },
    });
    fixture.detectChanges();
    expect(q('dm-first-scan')!.textContent).toContain('Scanning…');
    expect(
      el()
        .querySelector('.first-scan-bar')!
        .classList.contains('is-indeterminate')
    ).toBe(true);
  });

  describe('after a scan', () => {
    beforeEach(() => {
      const list = [column({ id: 'crm.a.ssn', table: 'a', column: 'ssn' })];
      store.columns.set('crm', list);
      store.services = [
        { service: 'crm', label: 'CRM', tables: [summarize('a', list)] },
        // Added after the last scan: covered, never scanned.
        { service: 'hr', label: 'HR (SQL Server)', tables: [] },
      ];
      store.overview = overview({
        mode: 'preview',
        scan: {
          status: 'idle',
          progress: 100,
          finishedAt: '2026-10-28T00:00:00Z',
          columns: 1,
        },
        counts: { masked: 1, review: 0, clear: 0 },
      });
      fixture.componentInstance.reset();
      fixture.detectChanges();
    });

    it('lists uncovered services last, muted and not selectable', () => {
      const group = q('dm-rail-uncovered')!;
      expect(group).toBeTruthy();
      expect(group.querySelector('h3')?.textContent).toContain('Not covered');
      const rows = Array.from(
        group.querySelectorAll('[data-testid="dm-rail-uncovered-row"]')
      );
      expect(rows.map(r => r.querySelector('.rail-name')?.textContent)).toEqual(
        ['Event store', 'Session cache']
      );
      // Not a button and never part of the table selection.
      expect(rows[0].tagName).toBe('LI');
      expect(group.querySelector('button')).toBeNull();
      // The explanation is spoken, not only hovered.
      expect(rows[0].textContent).toContain("Data Masking can't mask");
      // It is the last group in the rail.
      const rail = el().querySelector('nav.rail')!;
      expect(rail.lastElementChild).toBe(group);
    });

    it('offers a per-service scan for a covered service never scanned', () => {
      const pending = q('dm-rail-unscanned')!;
      expect(pending.textContent).toContain('HR (SQL Server)');
      expect(pending.textContent).toContain('Not scanned yet');
      (pending.querySelector('button') as HTMLButtonElement).click();
      expect(api.scan).toHaveBeenCalledWith('hr');
    });

    it('search narrows the uncovered list too', () => {
      const cmp = fixture.componentInstance;
      cmp.search = 'couch';
      cmp.onSearch();
      expect(cmp.uncovered.map(u => u.service)).toEqual(['cache']);
    });

    it('a rule-matches filter hides coverage rows', () => {
      store.idFilter = { label: 'x', ids: new Set(['crm.a.ssn']) };
      expect(fixture.componentInstance.uncovered).toEqual([]);
      expect(fixture.componentInstance.pendingServices).toEqual([]);
    });
  });

  describe('scanned databases with nothing to list', () => {
    beforeEach(() => {
      const list = [column({ id: 'crm.a.ssn', table: 'a', column: 'ssn' })];
      const inv = [
        column({
          id: 'inv.w.sku',
          service: 'inv',
          table: 'w',
          column: 'sku',
          verdict: 'clear',
          class: null,
          tier: null,
        }),
      ];
      store.columns.set('crm', list);
      store.columns.set('inv', inv);
      store.services = [
        {
          service: 'crm',
          label: 'CRM',
          scannedAt: 'x',
          tables: [summarize('a', list)],
        },
        {
          service: 'inv',
          label: 'Inventory',
          scannedAt: 'x',
          tables: [summarize('w', inv)],
        },
        {
          service: 'db',
          label: 'Local SQL Database',
          scannedAt: 'x',
          tables: [],
        },
        {
          service: 'hr',
          label: 'HR',
          scannedAt: null,
          scanError: 'Login failed for user',
          tables: [],
        },
      ];
      store.overview = overview({
        mode: 'preview',
        scan: { status: 'idle', finishedAt: 'x', columns: 2 },
        counts: { masked: 1, review: 0, clear: 1 },
      });
      fixture.componentInstance.reset();
      fixture.detectChanges();
    });

    it('stay listed under Masked: nothing sensitive, no tables', () => {
      const rows = Array.from(
        el().querySelectorAll('[data-testid="dm-rail-quiet-row"]')
      ).map(
        r =>
          `${r.querySelector('.rail-name')?.textContent?.trim()}: ${r
            .querySelector('.rail-note')
            ?.textContent?.trim()}`
      );
      expect(rows).toEqual([
        'Inventory: Nothing sensitive',
        'Local SQL Database: No tables',
      ]);
    });

    it('a database the scan could not read is listed with Retry', () => {
      const failed = q('dm-rail-failed')!;
      expect(failed.textContent).toContain("Couldn't scan");
      expect(failed.textContent).toContain('HR');
      expect(failed.textContent).toContain('Login failed for user');
      expect(q('dm-rail-unscanned')).toBeNull();
      (failed.querySelector('button') as HTMLButtonElement).click();
      expect(api.scan).toHaveBeenCalledWith('hr');
    });

    it('opening a nothing-sensitive database shows it under All', () => {
      (
        el().querySelector(
          'button[data-testid="dm-rail-quiet-row"]'
        ) as HTMLElement
      ).click();
      fixture.detectChanges();
      const cmp = fixture.componentInstance;
      expect(cmp.filter).toBe('all');
      expect(cmp.selectedTable).toBe('w');
    });

    it('new results keep the filter and the selected table', () => {
      const cmp = fixture.componentInstance;
      cmp.setFilter('all');
      cmp.select(cmp.railKeys[1]);
      const list = store.columns.get('crm')!;
      store.services = [
        ...store.services,
        { service: 'new', label: 'New', scannedAt: null, tables: [] },
      ];
      store.structure++;
      void list;
      fixture.detectChanges();
      expect(cmp.filter).toBe('all');
      expect(cmp.selectedTable).toBe('w');
      expect(q('dm-rail-unscanned')!.textContent).toContain('New');
    });
  });

  it('after a scan that found no tables anywhere, the next step is adding a database', () => {
    store.services = [
      {
        service: 'db',
        label: 'Local SQL Database',
        scannedAt: 'x',
        tables: [],
      },
    ];
    store.overview = overview({
      mode: 'preview',
      scan: { status: 'idle', finishedAt: 'x', columns: 0 },
    });
    fixture.detectChanges();
    expect(q('dm-no-tables')!.textContent).toContain('No tables to scan');
    expect(q('dm-search')).toBeNull();
  });

  describe('when the server could not read the scan history', () => {
    const LINE = "Couldn't read the scan history. Check the DreamFactory log.";

    it('says so in place of the never-scanned state, with no scan action', () => {
      store.overview = overview({
        scan: {
          status: 'idle',
          finishedAt: null,
          columns: 0,
          lastStatus: null,
          failed: [],
          unknown: true,
        },
      });
      store.services = [
        { service: 'crm', label: 'CRM', scannedAt: null, tables: [] },
      ];
      fixture.detectChanges();
      expect(store.scanUnknown).toBe(true);
      expect(q('dm-scan-unknown')!.textContent).toContain(LINE);
      expect(q('dm-no-scan')).toBeNull();
      expect(el().textContent).not.toContain('No scan yet');
      expect(el().textContent).not.toContain('Scan databases');
      expect(
        el().querySelector('[data-testid="empty-state-action"]')
      ).toBeNull();
      // The rest of the first-run screen still works.
      expect(q('dm-first-run-baselines')).toBeTruthy();
    });

    it("an entry's scan_unknown alone is enough", () => {
      store.services = [
        {
          service: 'crm',
          label: 'CRM',
          scannedAt: null,
          scanUnknown: true,
          tables: [],
        },
      ];
      fixture.detectChanges();
      expect(q('dm-scan-unknown')).toBeTruthy();
      expect(q('dm-no-scan')).toBeNull();
    });

    it('a database with no classified tables is not "Not scanned yet"', () => {
      const list = [column({ id: 'crm.a.ssn', table: 'a', column: 'ssn' })];
      store.columns.set('crm', list);
      store.services = [
        {
          service: 'crm',
          label: 'CRM',
          scannedAt: null,
          scanUnknown: true,
          tables: [summarize('a', list)],
        },
        {
          service: 'hr',
          label: 'HR (SQL Server)',
          scannedAt: null,
          scanUnknown: true,
          tables: [],
        },
      ];
      store.overview = overview({
        mode: 'preview',
        scan: { status: 'idle', finishedAt: null, columns: 1, unknown: true },
        counts: { masked: 1, review: 0, clear: 0 },
      });
      fixture.componentInstance.reset();
      fixture.detectChanges();
      // Results still show; the rail says the history is unreadable.
      expect(q('dm-search')).toBeTruthy();
      expect(q('dm-rail-unscanned')).toBeNull();
      expect(q('dm-scan-unknown')!.textContent).toContain(LINE);
      expect(el().textContent).not.toContain('Not scanned yet');
    });
  });
});
