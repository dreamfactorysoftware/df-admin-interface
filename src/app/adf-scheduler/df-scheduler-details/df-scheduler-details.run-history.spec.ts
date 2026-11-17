import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Translation, TranslocoTestingModule } from '@ngneat/transloco';
import { BehaviorSubject } from 'rxjs';
import {
  RunStatus,
  SchedulerTaskData,
  TaskRun,
} from '../../shared/types/scheduler';
import { DfSchedulerDetailsComponent } from './df-scheduler-details.component';
import { mockSchedulerTaskData, mockServices } from './test-mocks/mocks';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN_ROOT: Translation = require('../../../assets/i18n/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN_SCHEDULER: Translation = require('../../../assets/i18n/scheduler/en.json');

const LONG_OUTPUT = 'x'.repeat(16384);

const iso = (minute: number, second = 0) =>
  `2026-10-28T11:${String(minute).padStart(2, '0')}:${String(second).padStart(
    2,
    '0'
  )}.000000Z`;

/** Shaped like TaskRun::toArray() after the case interceptor. */
const taskRun = (id: number, over: Partial<TaskRun> = {}): TaskRun => ({
  id,
  startedAt: iso(id % 60),
  finishedAt: iso(id % 60, 30),
  statusCode: 200,
  output: `run ${id} output`,
  ...({ taskId: mockSchedulerTaskData.id } as object),
  ...over,
});

const runStatus = (over: Partial<RunStatus> = {}): RunStatus => ({
  isRunning: false,
  lastRun: null,
  lastSuccess: null,
  lastFailure: null,
  ...over,
});

/** A task as the resolver returns it: never with task_run_by_task_id. */
const task = (over: Partial<SchedulerTaskData> = {}): SchedulerTaskData => ({
  ...mockSchedulerTaskData,
  ...over,
});

describe('DfSchedulerDetailsComponent run history', () => {
  let fixture: ComponentFixture<DfSchedulerDetailsComponent>;
  let component: DfSchedulerDetailsComponent;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  let routeData: BehaviorSubject<unknown>;

  const routeFor = (schedulerObject: SchedulerTaskData | undefined) => ({
    data: { resource: mockServices },
    schedulerObject,
  });
  /** The router reuses the component and re-emits data for another task. */
  const navigateTo = (schedulerObject: SchedulerTaskData) => {
    routeData.next(routeFor(schedulerObject));
    fixture.detectChanges();
  };

  const setup = (schedulerObject: SchedulerTaskData | undefined) => {
    routeData = new BehaviorSubject<unknown>(routeFor(schedulerObject));
    TestBed.configureTestingModule({
      imports: [
        DfSchedulerDetailsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: { ...EN_ROOT, scheduler: EN_SCHEDULER } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: routeData },
        },
      ],
    });
    fixture = TestBed.createComponent(DfSchedulerDetailsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };

  const tabLabels = () =>
    Array.from(el.querySelectorAll<HTMLElement>('.mat-mdc-tab')).map(t =>
      t.textContent?.trim()
    );
  const openTab = async (label: string) => {
    const tab = Array.from(
      el.querySelectorAll<HTMLElement>('.mat-mdc-tab')
    ).find(t => t.textContent?.trim() === label);
    if (!tab) throw new Error(`no tab labelled ${label}`);
    tab.click();
    fixture.detectChanges();
    // The tab group reports the new index from a microtask. (whenStable
    // never settles here: the page keeps a timer alive.)
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  };
  const runRequests = (id = mockSchedulerTaskData.id): TestRequest[] =>
    httpMock.match(
      req =>
        req.url === `/api/v2/system/scheduler/${id}` &&
        (req.params.get('related') ?? '').includes('task_run_by_task_id')
    );
  /** Open the tab and answer its one request. */
  const openHistoryWith = async (body: Partial<SchedulerTaskData>) => {
    await openTab('Run history');
    const requests = runRequests();
    expect(requests.length).toBe(1);
    requests[0].flush({ ...component.scheduleToEdit, ...body });
    fixture.detectChanges();
  };
  const rows = () =>
    Array.from(el.querySelectorAll<HTMLElement>('[data-testid="run-row"]'));
  const cells = (row: HTMLElement) =>
    Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim());
  const text = () => el.textContent ?? '';

  describe('on a backend without per-run history', () => {
    // An older df-scheduler sends no run_status and rejects the relation.
    beforeEach(() => setup(task()));

    it('hides the tab and keeps the page as it was before the feature', () => {
      expect(tabLabels()).toEqual(['Basic', 'Log']);
      expect(component.runsSupported).toBe(false);
      expect(text()).not.toContain('not run yet');
    });

    it('never requests the relation, on load or on any tab', async () => {
      await openTab('Log');
      await openTab('Basic');
      expect(runRequests()).toEqual([]);
      component.onTabIndexChange(1);
      expect(runRequests()).toEqual([]);
    });
  });

  it('has no Run history tab when creating a task', () => {
    setup(undefined);
    expect(tabLabels()).toEqual(['Basic', 'Log']);
  });

  describe('on a backend with per-run history', () => {
    const lastOk = pickRun(taskRun(25));
    const lastFailed = pickRun(taskRun(24, { statusCode: 500 }));
    const supported = () =>
      task({
        runStatus: runStatus({
          lastRun: lastOk,
          lastSuccess: lastOk,
          lastFailure: lastFailed,
        }),
      });

    it('shows the tab but loads nothing until it is opened', async () => {
      setup(supported());
      expect(tabLabels()).toEqual(['Basic', 'Run history', 'Log']);
      expect(component.runsState).toBe('idle');
      expect(runRequests()).toEqual([]);
      await openTab('Log');
      expect(runRequests()).toEqual([]);
    });

    it('requests the runs once, on first open only', async () => {
      setup(supported());
      await openTab('Run history');
      const requests = runRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].request.params.get('related')).toBe(
        'task_run_by_task_id'
      );
      requests[0].flush({ ...supported(), taskRunByTaskId: [taskRun(1)] });
      fixture.detectChanges();

      await openTab('Basic');
      await openTab('Run history');
      expect(runRequests()).toEqual([]);
      expect(rows().length).toBe(1);
    });

    it('renders a populated history: newest first, mixed statuses', async () => {
      setup(supported());
      const running = taskRun(6, {
        finishedAt: null,
        statusCode: null,
        output: null,
      });
      await openHistoryWith({
        runStatus: runStatus({ isRunning: true, lastRun: pickRun(running) }),
        // The backend returns rows in id order; the tab shows newest first.
        taskRunByTaskId: [
          taskRun(1),
          taskRun(2, { statusCode: 404, output: 'Resource not found' }),
          taskRun(3, {
            finishedAt: iso(3, 0),
            statusCode: 500,
            output: 'Run did not finish',
          }),
          taskRun(4, { statusCode: 201, output: LONG_OUTPUT }),
          taskRun(5, { output: '' }),
          running,
        ],
      });

      expect(rows().map(r => cells(r)[2])).toEqual([
        '-',
        '200',
        '201',
        '500',
        '404',
        '200',
      ]);
      expect(rows().map(r => cells(r)[1])).toEqual([
        'In progress',
        '30s',
        '30s',
        '0s',
        '30s',
        '30s',
      ]);
      // Started column is a formatted date, never a raw ISO string.
      expect(cells(rows()[0])[0]).toMatch(/Oct 28, 2026/);
      // No output: no button. Running row and the empty-output row.
      expect(rows().map(r => !!r.querySelector('button'))).toEqual([
        false,
        false,
        true,
        true,
        true,
        true,
      ]);
      expect(el.querySelector('[data-testid="run-empty"]')).toBeNull();
      expect(el.querySelector('mat-paginator')).toBeNull();
      expect(text()).toContain('Last success:');
    });

    it('shows long output only when asked, in full', async () => {
      setup(supported());
      await openHistoryWith({
        taskRunByTaskId: [taskRun(4, { output: LONG_OUTPUT })],
      });
      expect(el.querySelector('[data-testid="run-output"]')).toBeNull();

      const toggle = rows()[0].querySelector('button') as HTMLButtonElement;
      expect(toggle.textContent?.trim()).toBe('Show output');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      toggle.click();
      fixture.detectChanges();

      const output = el.querySelector('[data-testid="run-output"]');
      expect(output?.textContent).toBe(LONG_OUTPUT);
      expect(toggle.textContent?.trim()).toBe('Hide output');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      toggle.click();
      fixture.detectChanges();
      expect(el.querySelector('[data-testid="run-output"]')).toBeNull();
    });

    it('marks an open run that is not running as not finished', async () => {
      setup(supported());
      const stale = taskRun(9, {
        startedAt: '2026-10-26T12:00:00.000000Z',
        finishedAt: null,
        statusCode: null,
        output: null,
      });
      await openHistoryWith({
        runStatus: runStatus({ isRunning: false, lastRun: pickRun(stale) }),
        taskRunByTaskId: [stale],
      });
      expect(cells(rows()[0]).slice(1, 3)).toEqual(['Did not finish', '-']);
    });

    it('shows the empty state for a task that has never run', async () => {
      setup(task({ runStatus: runStatus() }));
      expect(el.querySelector('[data-testid="run-empty"]')).toBeNull();
      await openHistoryWith({ taskRunByTaskId: [] });

      expect(rows()).toEqual([]);
      expect(el.querySelector('.run-table')).toBeNull();
      const empty = el.querySelector('[data-testid="run-empty"]');
      expect(empty?.textContent).toContain('This task has not run yet');
      expect(empty?.textContent).toContain('It runs every 88 minute(s)');
      expect(text()).toContain('Last success: None');
      expect(text()).toContain('Last failure: None');
      // Each block takes its own row of the flex-wrapped details section.
      for (const selector of ['.run-summary', '[data-testid="run-empty"]']) {
        expect(el.querySelector(selector)?.classList).toContain('full-width');
      }
    });

    it('treats a response without the relation as an empty history', async () => {
      setup(task({ runStatus: runStatus() }));
      await openHistoryWith({});
      expect(el.querySelector('[data-testid="run-empty"]')).not.toBeNull();
    });

    describe('when the router reuses the page for another task', () => {
      const other = () => ({ ...supported(), id: 16, name: 'other-task' });

      it("loads the next task's runs when the tab is already open", async () => {
        setup(supported());
        await openHistoryWith({ taskRunByTaskId: [taskRun(1), taskRun(2)] });
        expect(rows().length).toBe(2);

        // No tab change fires: the Run history tab stays selected.
        navigateTo(other());
        expect(rows()).toEqual([]);
        const requests = runRequests(16);
        expect(requests.length).toBe(1);
        requests[0].flush({ ...other(), taskRunByTaskId: [taskRun(7)] });
        fixture.detectChanges();
        expect(component.pagedRuns.map(r => r.id)).toEqual([7]);
      });

      it('does not load for the next task while another tab is open', async () => {
        setup(supported());
        await openHistoryWith({ taskRunByTaskId: [taskRun(1)] });
        await openTab('Basic');
        navigateTo(other());
        expect(runRequests(16)).toEqual([]);
        expect(component.runsState).toBe('idle');
      });

      it('drops a late answer that belongs to the previous task', async () => {
        setup(supported());
        await openTab('Run history');
        const stale = runRequests();
        expect(stale.length).toBe(1);

        navigateTo(other());
        expect(stale[0].cancelled).toBe(true);
        runRequests(16)[0].flush({ ...other(), taskRunByTaskId: [] });
        fixture.detectChanges();
        expect(rows()).toEqual([]);
        expect(el.querySelector('[data-testid="run-empty"]')).not.toBeNull();
      });

      it('hides the tab again for a task without run data', async () => {
        setup(supported());
        await openHistoryWith({ taskRunByTaskId: [taskRun(1)] });
        navigateTo(task({ id: 17 }));
        expect(tabLabels()).toEqual(['Basic', 'Log']);
        expect(runRequests(17)).toEqual([]);
      });
    });

    describe('pagination', () => {
      const runs = Array.from({ length: 25 }, (_, i) => taskRun(i + 1));
      const ids = () => component.pagedRuns.map(r => r.id);
      const page = (pageIndex: number) => {
        component.onRunPage({
          pageIndex,
          pageSize: 10,
          length: 25,
          previousPageIndex: component.runPage,
        });
        fixture.detectChanges();
      };

      beforeEach(async () => {
        setup(supported());
        await openHistoryWith({ taskRunByTaskId: runs });
      });

      it('shows ten runs a page, newest first', () => {
        expect(rows().length).toBe(10);
        expect(ids()).toEqual([25, 24, 23, 22, 21, 20, 19, 18, 17, 16]);
        expect(
          el.querySelector('.mat-mdc-paginator-range-label')?.textContent
        ).toContain('1 – 10 of 25');

        page(1);
        expect(ids()).toEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6]);
        expect(rows().length).toBe(10);

        page(2);
        expect(ids()).toEqual([5, 4, 3, 2, 1]);
        expect(rows().length).toBe(5);
      });

      it('has no paginator for a single page', async () => {
        TestBed.resetTestingModule();
        setup(supported());
        await openHistoryWith({ taskRunByTaskId: runs.slice(0, 10) });
        expect(rows().length).toBe(10);
        expect(el.querySelector('mat-paginator')).toBeNull();
      });
    });

    describe('when loading the runs fails', () => {
      const failWith = async (status: number, message: string) => {
        await openTab('Run history');
        runRequests()[0].flush(
          { error: { code: status, message, status_code: status } },
          { status, statusText: 'Error' }
        );
        fixture.detectChanges();
      };

      beforeEach(() => setup(supported()));

      it('surfaces the server message in the tab and offers a retry', async () => {
        await failWith(500, 'Database is gone');

        const error = el.querySelector('[data-testid="run-error"]');
        expect(error?.textContent).toContain(
          'Run history could not be loaded.'
        );
        expect(error?.textContent).toContain('Database is gone');
        expect(error?.classList).toContain('full-width');
        expect(el.querySelector('[data-testid="run-empty"]')).toBeNull();
        expect(rows()).toEqual([]);

        (error?.querySelector('button') as HTMLButtonElement).click();
        const retry = runRequests();
        expect(retry.length).toBe(1);
        retry[0].flush({ ...supported(), taskRunByTaskId: [taskRun(1)] });
        fixture.detectChanges();
        expect(el.querySelector('[data-testid="run-error"]')).toBeNull();
        expect(rows().length).toBe(1);
      });
    });
  });
});

/** The four columns run_status carries for a run (no output). */
function pickRun(run: TaskRun) {
  return {
    id: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    statusCode: run.statusCode,
  };
}
