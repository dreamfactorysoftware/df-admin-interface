import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { of } from 'rxjs';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import {
  DfAccessUsageService,
  unavailableAccessUsage,
} from '../../services/df-access-usage.service';
import { AccessUsageResult, AccessUsageRow } from '../../types/access-usage';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from './df-manage-table.component';

interface Row {
  id: number;
  name: string;
}

@Component({
  standalone: true,
  templateUrl: './df-manage-table.component.html',
  imports: [...DfManageTableModules],
})
class UsageTableComponent extends DfManageTableComponent<Row> {
  override columns = [
    { columnDef: 'name', cell: (row: Row) => row.name, header: 'name' },
    { columnDef: 'actions' },
  ];
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
    this.enableAccessUsage('role', { header: 'accessUsage.lastUsed' });
  }
  mapDataToTable(data: Row[]): Row[] {
    return data;
  }
  refreshTable(): void {
    // not exercised
  }
  filterQuery = (value: string) => value;
}

const DAY = 86_400_000;
const dfDate = (msAgo: number) =>
  new Date(Date.now() - msAgo).toISOString().replace('T', ' ').slice(0, 19);

const usage = (id: number, lastUsedAt: string | null): AccessUsageRow => ({
  subjectType: 'role',
  subjectId: id,
  name: `role${id}`,
  isActive: true,
  lastUsedAt,
  lastDeniedAt: null,
  lastService: null,
  lastStatus: null,
  neverUsed: lastUsedAt === null,
  stale: false,
  disabledButAttempted: false,
  roleUnreferenced: false,
  lastLoginDate: null,
  isSysAdmin: null,
  requests30d: null,
  topServices: null,
});

const TABLE_ROWS: Row[] = [
  { id: 1, name: 'recent' },
  { id: 2, name: 'idle' },
  { id: 3, name: 'never' },
  { id: 4, name: 'created-after-fetch' },
];

const AVAILABLE: AccessUsageResult = {
  available: true,
  rows: new Map([
    [1, usage(1, dfDate(5 * DAY))],
    [2, usage(2, dfDate(120 * DAY))],
    [3, usage(3, null)],
  ]),
  meta: {
    subject: 'role',
    staleDays: 90,
    generatedAt: '2026-09-10 16:30:00',
    ledgerAvailable: false,
    trackingStartedAt: null,
  },
};

describe('DfManageTableComponent access usage', () => {
  let fixture: ComponentFixture<UsageTableComponent>;
  let component: UsageTableComponent;

  const setup = (result: AccessUsageResult) => {
    const load = jest.fn(() => of(result));
    TestBed.configureTestingModule({
      imports: [
        UsageTableComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        { provide: DfAccessUsageService, useValue: { load } },
        {
          provide: ActivatedRoute,
          useValue: { data: of({ data: { resource: TABLE_ROWS } }) },
        },
      ],
    });
    fixture = TestBed.createComponent(UsageTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return load;
  };

  const q = (selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector);
  const ids = () => component.dataSource.filteredData.map(r => r.id);

  afterEach(() => TestBed.resetTestingModule());

  it('leaves the table untouched when the endpoint is unavailable', () => {
    const load = setup(unavailableAccessUsage());
    expect(load).toHaveBeenCalledWith('role');
    expect(component.displayedColumns).toEqual(['name', 'actions']);
    expect(component.accessUsage?.available).toBe(false);
    expect(q('[data-testid="access-usage-filter"]')).toBeNull();
    expect(q('df-access-usage-cell')).toBeNull();

    component.accessUsage?.filter.setValue('never');
    expect(ids()).toEqual([1, 2, 3, 4]);
  });

  it('adds the column before actions and shows the filter when available', () => {
    setup(AVAILABLE);
    expect(component.displayedColumns).toEqual(['name', 'lastUsed', 'actions']);
    expect(q('[data-testid="access-usage-filter"]')).not.toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'df-access-usage-cell'
      ).length
    ).toBe(TABLE_ROWS.length);
  });

  it('filters the loaded rows client-side by "Not used in"', () => {
    setup(AVAILABLE);
    const state = component.accessUsage;
    if (!state) {
      throw new Error('access usage was not enabled');
    }
    const filter = state.filter;

    filter.setValue('30');
    expect(ids()).toEqual([2, 3, 4]);
    filter.setValue('180');
    expect(ids()).toEqual([3, 4]);
    filter.setValue('never');
    expect(ids()).toEqual([3, 4]);
    expect(component.accessUsage?.filterActive).toBe(true);

    component.clearFilter();
    expect(filter.value).toBe('any');
    expect(component.currentFilter.value).toBe('');
    expect(ids()).toEqual([1, 2, 3, 4]);
  });

  it('sorts the usage column by last-used time', () => {
    setup(AVAILABLE);
    const accessor = component.dataSource.sortingDataAccessor;
    expect(accessor(TABLE_ROWS[0], 'lastUsed')).toBeGreaterThan(
      accessor(TABLE_ROWS[1], 'lastUsed') as number
    );
    expect(accessor(TABLE_ROWS[2], 'lastUsed')).toBe(0);
    expect(accessor(TABLE_ROWS[0], 'name')).toBe('recent');
  });
});
