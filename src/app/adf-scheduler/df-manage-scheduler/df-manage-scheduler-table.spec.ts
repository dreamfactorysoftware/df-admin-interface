import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfManageSchedulerTableComponent } from './df-manage-scheduler-table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  Translation,
  TranslocoService,
  TranslocoTestingModule,
  provideTransloco,
} from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RunStatus, RunSummary } from 'src/app/shared/types/scheduler';

describe('DfManageSchedulerTableComponent', () => {
  let component: DfManageSchedulerTableComponent;
  let fixture: ComponentFixture<DfManageSchedulerTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfManageSchedulerTableComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfManageSchedulerTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN_ROOT: Translation = require('../../../assets/i18n/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN_SCHEDULER: Translation = require('../../../assets/i18n/scheduler/en.json');

describe('DfManageSchedulerTableComponent "Last run" column', () => {
  let fixture: ComponentFixture<DfManageSchedulerTableComponent>;
  let el: HTMLElement;

  const minutesAgo = (minutes: number) =>
    new Date(Date.now() - minutes * 60_000).toISOString();
  const run = (over: Partial<RunSummary> = {}): RunSummary => ({
    id: 1,
    startedAt: minutesAgo(6),
    finishedAt: minutesAgo(5),
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
  /** A list row as the API returns it (camelCased); run_status optional. */
  const task = (id: number, runStatus?: RunStatus | null) => ({
    id,
    name: `task-${id}`,
    description: '',
    isActive: true,
    serviceId: 5,
    component: '*',
    verb: 'GET',
    frequency: 5,
    taskLogByTaskId: null,
    serviceByServiceId: { id: 5, name: 'db' },
    ...(runStatus === undefined ? {} : { runStatus }),
  });

  const setup = (resource: unknown[]) => {
    TestBed.configureTestingModule({
      imports: [
        DfManageSchedulerTableComponent,
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
          useValue: {
            data: of({ data: { resource, meta: { count: resource.length } } }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfManageSchedulerTableComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };
  const headers = () =>
    Array.from(el.querySelectorAll('th')).map(th => th.textContent?.trim());
  const lastRunCells = () =>
    Array.from(el.querySelectorAll('td.mat-column-lastRun')).map(td =>
      td.textContent?.trim()
    );

  it('is absent on a backend that sends no run data', () => {
    // Older df-scheduler: no run_status on any task.
    setup([task(1), task(2)]);
    expect(headers()).not.toContain('Last run');
    expect(lastRunCells()).toEqual([]);
    expect(el.textContent).not.toContain('Never');
    expect(headers()).toEqual([
      'Active',
      'ID',
      'Name',
      'Description',
      'Service',
      'Component',
      'Method',
      'Frequency',
      'Log',
      '',
    ]);
  });

  it('shows each run state when the backend supports runs', () => {
    const stale = run({
      startedAt: minutesAgo(2 * 24 * 60),
      finishedAt: null,
      statusCode: null,
    });
    setup([
      task(1, status()),
      task(2, status({ isRunning: true, lastRun: run({ finishedAt: null }) })),
      task(3, status({ lastRun: run() })),
      task(4, status({ lastRun: run({ statusCode: 404 }) })),
      task(5, status({ lastRun: run({ statusCode: null }) })),
      task(6, status({ lastRun: stale })),
    ]);
    expect(headers()).toContain('Last run');
    expect(headers().indexOf('Last run')).toBe(headers().indexOf('Log') - 1);
    expect(lastRunCells()).toEqual([
      'Never',
      'Running',
      'OK, 5 minutes ago',
      'Failed 404, 5 minutes ago',
      'Failed, 5 minutes ago',
      'Did not finish, started 2 days ago',
    ]);
  });

  it('leaves the cell empty for a task without run data, never "Never"', () => {
    // Mixed payload: only rows that carry run_status get a value.
    setup([task(1, status()), task(2), task(3, null)]);
    expect(lastRunCells()).toEqual(['Never', '', '']);
  });

  it('adds and removes the column as fetched data changes', () => {
    setup([task(1)]);
    const component = fixture.componentInstance;
    const withoutColumn = component.columns;

    component.dataSource.data = component.mapDataToTable([task(1, status())]);
    fixture.detectChanges();
    expect(headers()).toContain('Last run');
    const withColumn = component.columns;

    // Same support state: the columns array reference must not change.
    component.dataSource.data = component.mapDataToTable([task(2, status())]);
    expect(component.columns).toBe(withColumn);

    component.dataSource.data = component.mapDataToTable([task(1)]);
    fixture.detectChanges();
    expect(component.columns).toBe(withoutColumn);
    expect(headers()).not.toContain('Last run');
  });
});
