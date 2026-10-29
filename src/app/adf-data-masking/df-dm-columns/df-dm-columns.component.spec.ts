import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DfDmColumnsComponent, FIRST_ROWS } from './df-dm-columns.component';
import { DmUndoToastService } from '../df-dm-undo-toast/df-dm-undo-toast.component';
import { DataMaskingStore, summarize } from '../data-masking.store';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { column, dmTransloco } from '../dm-testing';
import { MaskedColumn } from '../data-masking.types';

describe('DfDmColumnsComponent (review flow)', () => {
  let fixture: ComponentFixture<DfDmColumnsComponent>;
  let store: DataMaskingStore;
  let api: { decide: jest.Mock };

  const cols: MaskedColumn[] = [
    column({
      id: 'crm.a.dob',
      table: 'a',
      column: 'dob',
      verdict: 'review',
      class: 'date_of_birth',
      tier: 'identity',
      example: '1984-••',
      format: 'year',
    }),
    column({ id: 'crm.a.ssn', table: 'a', column: 'ssn' }),
    column({
      id: 'crm.a.note',
      table: 'a',
      column: 'note',
      verdict: 'clear',
      class: null,
      tier: null,
      example: null,
    }),
    column({
      id: 'crm.b.name',
      table: 'b',
      column: 'name',
      verdict: 'review',
      class: 'person_name',
      tier: 'identity',
      example: 'NAME_0001c3d4',
      format: 'token',
    }),
  ];

  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () =>
    Array.from(el().querySelectorAll('[data-testid="dm-row"]'));

  beforeEach(() => {
    api = {
      decide: jest.fn((id: string, cls: string | null) =>
        of({
          ...cols.find(c => c.id === id)!,
          class: cls,
          verdict: cls ? 'masked' : 'clear',
          source: 'admin',
        })
      ),
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
    store.overview = {
      mode: 'preview',
      scan: { status: 'idle', columns: 4, finishedAt: '2026-10-28T00:00:00Z' },
      counts: { masked: 1, review: 2, clear: 1 },
      you: { canGrant: true, seesRealValues: false },
    };
    const list = cols.map(c => ({ ...c }));
    store.columns.set('crm', list);
    store.services = [
      {
        service: 'crm',
        label: 'CRM database',
        tables: [
          summarize(
            'a',
            list.filter(c => c.table === 'a')
          ),
          summarize(
            'b',
            list.filter(c => c.table === 'b')
          ),
        ],
      },
    ];
    fixture = TestBed.createComponent(DfDmColumnsComponent);
    fixture.detectChanges();
  });

  it('opens on the review queue, with the rest of the table after it', () => {
    expect(fixture.componentInstance.filter).toBe('review');
    expect(rows().length).toBe(3);
    expect(rows()[0].textContent).toContain('dob');
    expect(rows()[1].classList).toContain('is-context');
    expect(el().querySelectorAll('[data-testid="dm-keep"]').length).toBe(1);
  });

  it('keep masked records the decision without removing the row', fakeAsync(() => {
    (
      el().querySelector('[data-testid="dm-keep"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(api.decide).toHaveBeenCalledWith('crm.a.dob', 'date_of_birth');
    expect(rows().length).toBe(3);
    expect(rows()[0].classList).toContain('is-settled');
    expect(rows()[0].querySelector('[data-testid="dm-decided"]')).toBeTruthy();
    expect(store.counts.review).toBe(1);
    expect(store.counts.masked).toBe(2);
    tick(1000);
  }));

  it('offers the next table once this one is reviewed', fakeAsync(() => {
    (
      el().querySelector('[data-testid="dm-clear"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(api.decide).toHaveBeenCalledWith('crm.a.dob', null);
    const next = el().querySelector(
      '[data-testid="dm-next-table"]'
    ) as HTMLButtonElement;
    expect(next).toBeTruthy();
    next.click();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedTable).toBe('b');
    expect(rows()[0].textContent).toContain('name');
    tick(1000);
  }));

  it('search narrows to matching columns and says when nothing matches', () => {
    const cmp = fixture.componentInstance;
    cmp.setFilter('all');
    cmp.search = 'ssn';
    cmp.onSearch();
    fixture.detectChanges();
    expect(rows().map(r => r.textContent)).toEqual([
      expect.stringContaining('ssn'),
    ]);
    cmp.search = 'zzz';
    cmp.onSearch();
    fixture.detectChanges();
    expect(el().textContent).toContain('No columns match "zzz"');
  });

  it('rolls back and toasts when the decision fails', () => {
    const snack = TestBed.inject(DfSnackbarService) as unknown as {
      openError: jest.Mock;
    };
    api.decide.mockReturnValueOnce(
      throwError(() => ({ status: 500, message: 'boom', kind: 'server' }))
    );
    (
      el().querySelector('[data-testid="dm-keep"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(store.counts.review).toBe(2);
    expect(snack.openError).toHaveBeenCalled();
  });
  it('filters are disjoint, like their counts, and All shows its total', () => {
    const cmp = fixture.componentInstance;
    cmp.setFilter('masked');
    fixture.detectChanges();
    expect(cmp.count('masked')).toBe(1);
    expect(rows().map(r => r.textContent)).toEqual([
      expect.stringContaining('ssn'),
    ]);
    const chips = Array.from(el().querySelectorAll('.filter')).map(b =>
      b.textContent?.replace(/\s+/g, ' ').trim()
    );
    expect(chips).toEqual([
      'To review 2',
      'Masked 1',
      'Not sensitive 1',
      'All 4',
    ]);
  });

  it('hides To review once nothing is left to review', () => {
    const cmp = fixture.componentInstance;
    store.overview = {
      ...store.overview!,
      counts: { masked: 3, review: 0, clear: 1 },
    };
    cmp.setFilter('masked');
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="dm-filter-review"]')).toBeNull();
  });

  it('keeps focus in the row after "Keep masked" or "Not sensitive"', () => {
    const keep = el().querySelector('[data-testid="dm-keep"]') as HTMLElement;
    keep.focus();
    keep.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows()[0]);
    // The row shortcuts keep working from there.
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(document.activeElement).toBe(rows()[1]);
  });

  it('the grid is one tab stop: only the active row and its controls are tabbable', () => {
    const tabbable = (r: Element) =>
      Array.from(r.querySelectorAll('button, [tabindex]')).filter(
        e => (e as HTMLElement).tabIndex >= 0
      ).length;
    expect(rows().map(r => (r as HTMLElement).tabIndex)).toEqual([0, -1, -1]);
    expect(tabbable(rows()[1])).toBe(0);
    expect(tabbable(rows()[0])).toBeGreaterThan(0);
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(rows().map(r => (r as HTMLElement).tabIndex)).toEqual([-1, 0, -1]);
  });

  it('the rail is one tab stop: arrows move between tables and open them', () => {
    const cmp = fixture.componentInstance;
    cmp.setFilter('all');
    fixture.detectChanges();
    const rail = () =>
      Array.from(
        el().querySelectorAll('[data-testid="dm-rail-row"]')
      ) as HTMLElement[];
    expect(rail().map(r => r.tabIndex)).toEqual([0, -1]);
    rail()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(cmp.selectedTable).toBe('b');
    expect(rail().map(r => r.tabIndex)).toEqual([-1, 0]);
    expect(document.activeElement).toBe(rail()[1]);
  });

  it('has no Keep masked for a review column without a class', () => {
    const list = store.columns.get('crm')!;
    list[0] = { ...list[0], class: null, tier: null };
    store.version++;
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="dm-keep"]')).toBeNull();
    // The m shortcut must not turn it into "not sensitive" either.
    const row = rows()[0] as HTMLElement;
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
    expect(api.decide).not.toHaveBeenCalled();
  });

  it('a computed field stored with no class reads "Redact" under Masked as', () => {
    // What /column returns for a computed field whose expression can't be
    // checked: review, class null, so no format and no example.
    const list = store.columns.get('crm')!;
    list[0] = {
      ...list[0],
      column: 'contact_line',
      class: null,
      tier: null,
      format: null,
      example: null,
      evidence: {
        ...list[0].evidence,
        lines: [
          {
            points: 40,
            kind: 'context',
            text: 'Built from an expression that could not be checked',
          },
        ],
      },
    };
    store.version++;
    fixture.detectChanges();
    const row = rows()[0] as HTMLElement;
    const value = row.querySelector('.c-value')!;
    expect(value.textContent?.trim()).toBe('Redact');
    expect(value.querySelector('df-masked-value')).toBeNull();
    expect(row.textContent).not.toMatch(/\bnull\b/i);
    // The chip asks for a class instead of claiming "Not sensitive".
    expect(
      row.querySelector('[data-testid="dm-class-chip"]')!.textContent
    ).toContain('Choose a class');
    // A column with a class still draws its masked example.
    expect(
      (rows()[1] as HTMLElement).querySelector('.c-value df-masked-value')
    ).toBeTruthy();
  });

  it('marks where the review queue ends without an empty spacer row', () => {
    expect(el().querySelector('.context-gap')).toBeNull();
    expect(rows()[1].classList).toContain('is-context-start');
  });
  it('gives the table select a spoken name', () => {
    const sel = el().querySelector('.table-select mat-select');
    expect(sel?.getAttribute('aria-label')).toBe('Table');
  });
});

describe('DfDmColumnsComponent (wide tables)', () => {
  it('opens a 300-column table with the first rows at once, the rest right after', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [DfDmColumnsComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        provideRouter([]),
        DataMaskingStore,
        { provide: DfDataMaskingApiService, useValue: {} },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
        { provide: DmUndoToastService, useValue: { open: jest.fn() } },
      ],
    });
    const store = TestBed.inject(DataMaskingStore);
    store.loading = false;
    const list = Array.from({ length: 300 }, (_, i) =>
      column({ id: `big.w.c${i}`, service: 'big', table: 'w', column: `c${i}` })
    );
    store.overview = {
      mode: 'preview',
      scan: {
        status: 'idle',
        columns: 300,
        finishedAt: '2026-10-28T00:00:00Z',
      },
      counts: { masked: 300, review: 0, clear: 0 },
      you: { canGrant: true, seesRealValues: false },
    };
    store.columns.set('big', list);
    store.services = [
      { service: 'big', label: 'Big', tables: [summarize('w', list)] },
    ];
    const fixture = TestBed.createComponent(DfDmColumnsComponent);
    fixture.detectChanges();
    const count = () =>
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="dm-row"]'
      ).length;
    expect(count()).toBe(FIRST_ROWS);
    tick(16 * 4);
    fixture.detectChanges();
    expect(count()).toBe(300);
    // Class menus are built when opened, not once per row.
    expect(document.querySelectorAll('.dm-class-menu').length).toBe(0);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[mat-menu-item]')
        .length
    ).toBe(0);
    flush();
  }));
});
