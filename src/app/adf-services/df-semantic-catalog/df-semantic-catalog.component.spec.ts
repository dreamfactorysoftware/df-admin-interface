import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { Observable, Subject, of, throwError } from 'rxjs';
import {
  DfSemanticCatalogComponent,
  SemanticAccess,
} from './df-semantic-catalog.component';
import { SemanticEntry } from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';
import { translocoEn } from './semantic-i18n.testing';

function entry(id: number, over: Partial<SemanticEntry> = {}): SemanticEntry {
  return {
    id,
    service: 'db',
    kind: 'term',
    name: `term_${String(id).padStart(4, '0')}`,
    description: null,
    definition: { meaning: `meaning ${id}` },
    status: 'draft',
    source: 'seeded',
    stale_reason: null,
    approved_date: null,
    approved_by_id: null,
    created_date: '',
    last_modified_date: '',
    ...over,
  };
}

describe('DfSemanticCatalogComponent', () => {
  let fixture: ComponentFixture<DfSemanticCatalogComponent>;
  let component: DfSemanticCatalogComponent;
  let api: Record<string, jest.Mock>;
  let dialog: { open: jest.Mock; openDialogs: unknown[] };
  let seen: SemanticAccess[];

  function setup(list: () => Observable<SemanticEntry[]>) {
    api = {
      list: jest.fn(list),
      approve: jest.fn(),
      tables: jest.fn(() => of(['orders'])),
    };
    dialog = { open: jest.fn(), openDialogs: [] };
    TestBed.configureTestingModule({
      imports: [
        DfSemanticCatalogComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot(translocoEn),
      ],
      providers: [{ provide: SemanticCatalogApiService, useValue: api }],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    fixture = TestBed.createComponent(DfSemanticCatalogComponent);
    component = fixture.componentInstance;
    seen = [];
    component.availability.subscribe(a => seen.push(a));
    fixture.componentRef.setInput('serviceName', 'db');
    fixture.detectChanges();
  }

  const q = (sel: string) => fixture.nativeElement.querySelector(sel);
  const qa = (sel: string) =>
    Array.from(fixture.nativeElement.querySelectorAll(sel)) as HTMLElement[];

  describe('when the catalog cannot be read', () => {
    it('a 404 (df-semantic not installed) tells the host to hide the section', () => {
      setup(() =>
        throwError(() => ({ status: 404, message: 'Resource not found' }))
      );
      expect(seen).toEqual(['missing']);
      expect(q('[data-testid="semantic-new-term"]')).toBeNull();
      expect(q('.sem-catalog__banner--error')).toBeNull();
    });

    it('a 403 shows a neutral no-access state and no toolbar', () => {
      setup(() => throwError(() => ({ status: 403, message: 'Forbidden' })));
      expect(seen).toEqual(['forbidden']);
      expect(q('[data-testid="semantic-no-access"]').textContent).toContain(
        'access to the semantic catalog'
      );
      expect(q('[data-testid="semantic-new-term"]')).toBeNull();
      expect(q('[data-testid="semantic-fill-menu"]')).toBeNull();
      expect(q('.sem-catalog__banner--error')).toBeNull();
    });

    it('any other failure is still an inline error with Retry', () => {
      setup(() =>
        throwError(() => ({ status: 500, raw: { error: { message: 'boom' } } }))
      );
      expect(seen).toEqual([]);
      expect(q('.sem-catalog__banner--error').textContent).toContain('boom');
      expect(q('[data-testid="semantic-new-term"]')).not.toBeNull();
    });
  });

  describe('approve all drafts', () => {
    let pending: Array<Subject<SemanticEntry>>;
    let confirm: boolean;

    beforeEach(() => {
      setup(() =>
        of([entry(1), entry(2), entry(3), entry(9, { source: 'manual' })])
      );
      pending = [];
      confirm = true;
      api['approve'].mockImplementation(() => {
        const s = new Subject<SemanticEntry>();
        pending.push(s);
        return s;
      });
      dialog.open.mockImplementation(() => ({
        afterClosed: () => of(confirm),
      }));
      fixture.detectChanges();
    });

    const land = (i: number, id: number) => {
      pending[i].next(entry(id, { status: 'approved' }));
      pending[i].complete();
      fixture.detectChanges();
    };

    it('asks first, with the count, and does nothing on No', () => {
      confirm = false;
      component.approveAllReviewable();
      expect(dialog.open.mock.calls[0][1].data.title).toBe('Approve 3 drafts?');
      expect(api['approve']).not.toHaveBeenCalled();
      expect(q('[data-testid="semantic-approve-all"]').textContent).toContain(
        'Approve all 3 waiting drafts'
      );
    });

    it('applies each result as it lands with n / N progress and locks row actions', () => {
      component.approveAllReviewable();
      fixture.detectChanges();
      expect(api['approve']).toHaveBeenCalledTimes(1);
      expect(
        q('[data-testid="semantic-approve-all-progress"]').textContent
      ).toContain('Approving 0 / 3');
      const approveButtons = qa('[data-testid="semantic-approve"]');
      expect(approveButtons.every(b => (b as HTMLButtonElement).disabled)).toBe(
        true
      );

      land(0, 1);
      expect(component.entries().find(e => e.id === 1)!.status).toBe(
        'approved'
      );
      expect(
        q('[data-testid="semantic-approve-all-progress"]').textContent
      ).toContain('Approving 1 / 3');

      pending[1].error({
        raw: { error: { message: 'column x does not exist' } },
      });
      fixture.detectChanges();
      // A bulk failure shows on its row without its own alert.
      const err = q('[data-testid="semantic-row-error"]');
      expect(err.textContent).toContain('column x does not exist');
      expect(err.getAttribute('role')).toBeNull();

      land(2, 3);
      expect(q('[data-testid="semantic-approve-all-progress"]')).toBeNull();
      expect(component.banner()!.text).toContain('Approved 2 of 3 drafts');
      expect(component.bulkBusy()).toBe(false);
    });

    it('Cancel stops before the next request', () => {
      component.approveAllReviewable();
      fixture.detectChanges();
      q('[data-testid="semantic-approve-all-cancel"]').click();
      land(0, 1);
      expect(api['approve']).toHaveBeenCalledTimes(1);
      expect(component.bulkBusy()).toBe(false);
      expect(component.banner()!.text).toContain('Stopped after 1 of 3');
    });

    it('a late result does not bring back a row deleted meanwhile', () => {
      component.approveAllReviewable();
      component.entries.set(component.entries().filter(e => e.id !== 1));
      land(0, 1);
      land(1, 2);
      land(2, 3);
      expect(component.entries().some(e => e.id === 1)).toBe(false);
    });

    it('destroying the component stops the run', () => {
      component.approveAllReviewable();
      fixture.destroy();
      expect(pending[0].observed).toBe(false);
    });
  });

  describe('filter and paging', () => {
    const rows = () => qa('[data-testid="semantic-row"]');

    beforeEach(() => {
      setup(() =>
        of(
          Array.from({ length: 500 }, (_, i) =>
            entry(i + 1, { status: i % 2 ? 'approved' : 'draft' })
          )
        )
      );
    });

    it('renders one page of 25 out of 500 entries, with a paginator', () => {
      expect(rows()).toHaveLength(25);
      expect(rows()[0].getAttribute('data-name')).toBe('term_0001');
      expect(q('[data-testid="semantic-paginator"]')).not.toBeNull();
      // The group heading counts every match, not just this page.
      expect(
        q('[data-testid="semantic-group-term"] .sem-catalog__count').textContent
      ).toContain('500');
    });

    it('pages and changes page size', () => {
      component.onPage({ pageIndex: 3, pageSize: 25, length: 500 });
      fixture.detectChanges();
      expect(rows()[0].getAttribute('data-name')).toBe('term_0076');
      component.onPage({ pageIndex: 0, pageSize: 100, length: 500 });
      fixture.detectChanges();
      expect(rows()).toHaveLength(100);
    });

    it('filters by text and goes back to the first page', () => {
      component.onPage({ pageIndex: 5, pageSize: 25, length: 500 });
      const input = q('[data-testid="semantic-filter"]') as HTMLInputElement;
      input.value = 'term_049';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      // term_0490..term_0499
      expect(rows().map(r => r.getAttribute('data-name'))).toEqual(
        Array.from({ length: 10 }, (_, i) => `term_049${i}`)
      );
      expect(q('[data-testid="semantic-paginator"]')).toBeNull();

      input.value = 'nothing like it';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(rows()).toHaveLength(0);
      expect(q('[data-testid="semantic-filter-empty"]').textContent).toContain(
        'No entries match'
      );
    });

    it('a status filter narrows the paged set too', () => {
      component.setStatus('approved');
      fixture.detectChanges();
      expect(rows()).toHaveLength(25);
      expect(
        rows().every(r => r.getAttribute('data-status') === 'approved')
      ).toBe(true);
      expect(component.filtered()).toHaveLength(250);
    });
  });

  describe('opening dialogs', () => {
    beforeEach(() => setup(() => of([entry(1)])));

    it('a failed table list is not cached: the next open asks again', () => {
      const closed = new Subject<unknown>();
      dialog.open.mockImplementation(() => ({ afterClosed: () => closed }));
      api['tables'].mockReturnValueOnce(of(null));
      component.openEditor('metric');
      expect(dialog.open.mock.calls[0][1].data.tables).toBeNull();
      closed.next(undefined);
      component.openEditor('metric');
      expect(api['tables']).toHaveBeenCalledTimes(2);
      expect(dialog.open.mock.calls[1][1].data.tables).toEqual(['orders']);
    });

    it('a second click while a dialog is opening or open does nothing', () => {
      const tables = new Subject<string[]>();
      api['tables'].mockReturnValue(tables);
      const closed = new Subject<unknown>();
      dialog.open.mockImplementation(() => {
        dialog.openDialogs = [{}];
        return { afterClosed: () => closed };
      });
      component.openEditor('term');
      component.openEditor('term');
      tables.next(['orders']);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      component.confirmDelete(entry(1));
      expect(dialog.open).toHaveBeenCalledTimes(1);
      dialog.openDialogs = [];
      closed.next(undefined);
      component.confirmDelete(entry(1));
      expect(dialog.open).toHaveBeenCalledTimes(2);
    });
  });
});
