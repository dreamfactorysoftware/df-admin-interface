/**
 * Data Explorer and Data Masking (df-masking): a small "Masked" marker when
 * the response carries X-DreamFactory-Masking: on, one line naming the
 * masked columns a filter could not use (they match no rows, decision 20)
 * or a sort ignored (X-DreamFactory-Masking-Dropped), and nothing at all
 * when the headers are absent (OSS, unmasked use).
 */
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SimpleChange } from '@angular/core';
import { Translation, TranslocoTestingModule } from '@ngneat/transloco';
import { of } from 'rxjs';
import { DfDataGridComponent } from './df-data-grid.component';
import {
  DataExplorerService,
  TableDataResponse,
} from './services/data-explorer.service';
import { readMaskingNotice } from './masking-notice';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DE: Translation = require('../../assets/i18n/dataExplorer/en.json');

const ROWS = [
  { id: 1, email: 'EMAIL_7f3a', last_name: 'NAME_19c2' },
  { id: 2, email: 'EMAIL_0b9d', last_name: 'NAME_44e1' },
];

describe('DfDataGridComponent and Data Masking headers', () => {
  let fixture: ComponentFixture<DfDataGridComponent>;
  let api: Record<string, jest.Mock>;
  let response: TableDataResponse;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (id: string) =>
    el().querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const text = (e: Element | null) =>
    e?.textContent?.replace(/\s+/g, ' ').trim();

  function create() {
    TestBed.configureTestingModule({
      imports: [
        DfDataGridComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, 'dataExplorer/en': DE },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: DataExplorerService, useValue: api },
      ],
    });
    fixture = TestBed.createComponent(DfDataGridComponent);
    const c = fixture.componentInstance;
    c.serviceName = 'crm_mysql';
    c.tableName = 'customers';
    c.ngOnChanges({ tableName: new SimpleChange(null, 'customers', true) });
    fixture.detectChanges();
  }

  beforeEach(() => {
    response = { resource: ROWS, meta: { count: 300 }, masking: null };
    api = {
      getTableData: jest.fn(() => of(response)),
      getTableSchema: jest.fn(() =>
        of({ name: 'customers', field: [], related: [] })
      ),
      findReadKeys: jest.fn(() => of([])),
    };
  });

  it('looks exactly as before when the response has no masking headers', () => {
    create();
    expect(el().querySelector('.data-table')).toBeTruthy();
    expect(q('de-masked')).toBeNull();
    expect(q('de-masking-dropped')).toBeNull();
    expect(el().querySelector('.masked-chip, .masking-note')).toBeNull();
  });

  it('shows a small Masked marker when values are masked', () => {
    response.masking = readMaskingNotice(
      new HttpHeaders({ 'X-DreamFactory-Masking': 'on' })
    );
    create();
    expect(text(q('de-masked'))).toBe('visibility_off Masked');
    expect(q('de-masked')!.getAttribute('href')).toBe(
      '/api-security/data-masking?tab=access'
    );
    expect(q('de-masking-dropped')).toBeNull();
  });

  it('says in one line that masked columns cannot be filtered (no rows) and that a sort on one was ignored', fakeAsync(() => {
    create();
    const c = fixture.componentInstance;
    // Decision 20: the admin filters EMAIL (masked). The server treats the
    // comparison as unknown, so it matches no rows; the sort on a masked
    // column is ignored.
    response = {
      resource: [],
      meta: { count: 0 },
      masking: readMaskingNotice(
        new HttpHeaders({
          'X-DreamFactory-Masking': 'on',
          'X-DreamFactory-Masking-Dropped': 'filter:email,order:last%20name',
        })
      ),
    };
    c.columnFilters = { email: { op: 'contains', value: 'zzzz' } };
    (
      c as unknown as { updateActiveFilterCount(): void }
    ).updateActiveFilterCount();
    c.loadData();
    fixture.detectChanges();
    tick();
    const note = q('de-masking-dropped')!;
    expect(note.querySelectorAll('.masking-note-text').length).toBe(1);
    expect(text(note.querySelector('.masking-note-text'))).toBe(
      "Masked columns can't be filtered: email · Sort ignored on masked columns: last name"
    );
    expect(
      note.querySelector('.masking-note-text')!.getAttribute('title')
    ).toBe(
      "Masked columns can't be filtered: email · Sort ignored on masked columns: last name"
    );
    // The rows are filtered (to none): the footer says so, as without masking.
    expect(text(el().querySelector('.grid-footer .footer-info'))).toBe(
      '0 records (filtered)'
    );

    // email OR id = 1: the clear half still selects its row.
    response = {
      resource: [ROWS[0]],
      meta: { count: 1 },
      masking: readMaskingNotice(
        new HttpHeaders({
          'X-DreamFactory-Masking': 'on',
          'X-DreamFactory-Masking-Dropped': 'filter:email',
        })
      ),
    };
    c.columnFilters = {
      email: { op: 'contains', value: 'zzzz' },
      id: { op: 'eq', value: '1' },
    };
    (
      c as unknown as { updateActiveFilterCount(): void }
    ).updateActiveFilterCount();
    c.loadData();
    fixture.detectChanges();
    expect(text(q('de-masking-dropped')!.querySelector('span'))).toBe(
      "Masked columns can't be filtered: email"
    );
    expect(text(el().querySelector('.grid-footer .footer-info'))).toBe(
      '1 records (filtered)'
    );
  }));

  it('a sort on a masked column alone: "Sort ignored on masked columns"', () => {
    response.masking = readMaskingNotice(
      new HttpHeaders({
        'X-DreamFactory-Masking': 'on',
        'X-DreamFactory-Masking-Dropped': 'order:ssn',
      })
    );
    create();
    expect(text(q('de-masking-dropped')!.querySelector('span'))).toBe(
      'Sort ignored on masked columns: ssn'
    );
  });

  it('clears the notice when the next response has no headers', () => {
    response.masking = readMaskingNotice(
      new HttpHeaders({
        'X-DreamFactory-Masking': 'on',
        'X-DreamFactory-Masking-Dropped': 'filter:*,+2 more',
      })
    );
    create();
    expect(text(q('de-masking-dropped')!.querySelector('span'))).toBe(
      "Masked columns can't be filtered +2 more"
    );
    response = { resource: ROWS, meta: { count: 300 }, masking: null };
    fixture.componentInstance.loadData();
    fixture.detectChanges();
    expect(q('de-masked')).toBeNull();
    expect(q('de-masking-dropped')).toBeNull();
  });
});

describe('DataExplorerService.getTableData masking headers', () => {
  it('passes the body through and reads the headers into `masking`', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const svc = TestBed.inject(DataExplorerService);
    const http = TestBed.inject(HttpTestingController);
    const got: TableDataResponse[] = [];
    svc
      .getTableData('crm_mysql', 'customers', 25, 0)
      .subscribe(r => got.push(r));
    svc
      .getTableData(
        'crm_mysql',
        'customers',
        25,
        0,
        undefined,
        '(email like "%z%")'
      )
      .subscribe(r => got.push(r));
    const [plain, masked] = http.match(r =>
      r.url.endsWith('/crm_mysql/_table/customers')
    );
    plain.flush({ resource: ROWS, meta: { count: 300 } });
    masked.flush(
      { resource: ROWS, meta: { count: 300 } },
      {
        headers: {
          'X-DreamFactory-Masking': 'on',
          'X-DreamFactory-Masking-Dropped': 'filter:email',
        },
      }
    );
    expect(got[0]).toEqual({
      resource: ROWS,
      meta: { count: 300 },
      masking: null,
    });
    expect(got[1].resource).toEqual(ROWS);
    expect(got[1].masking).toEqual({
      masked: true,
      dropped: [{ kind: 'filter', columns: ['email'], all: false }],
      more: 0,
    });
    http.verify();
  });
});
