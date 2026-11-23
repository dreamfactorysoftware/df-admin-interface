import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { Subject, of } from 'rxjs';
import { DfSemanticDraftDialogComponent } from './df-semantic-draft-dialog.component';
import { SemanticDraftReport } from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';
import { translocoEn } from './semantic-i18n.testing';

const many = Array.from(
  { length: 1200 },
  (_, i) => `t_${String(i + 1).padStart(4, '0')}`
);

describe('DfSemanticDraftDialogComponent', () => {
  let fixture: ComponentFixture<DfSemanticDraftDialogComponent>;
  let dialog: DfSemanticDraftDialogComponent;
  let api: { aiConnections: jest.Mock; draft: jest.Mock };
  let ref: { close: jest.Mock; disableClose: boolean | undefined };

  function setup(tables: string[] | null) {
    api = {
      aiConnections: jest.fn(() =>
        of({ rows: [{ id: 1, name: 'ai', label: 'AI' }], error: null })
      ),
      draft: jest.fn(),
    };
    ref = { close: jest.fn(), disableClose: undefined };
    TestBed.configureTestingModule({
      imports: [
        DfSemanticDraftDialogComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot(translocoEn),
      ],
      providers: [
        provideRouter([]),
        { provide: MAT_DIALOG_DATA, useValue: { service: 'db', tables } },
        { provide: MatDialogRef, useValue: ref },
        { provide: SemanticCatalogApiService, useValue: api },
      ],
    });
    fixture = TestBed.createComponent(DfSemanticDraftDialogComponent);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  }

  const q = (sel: string) => fixture.nativeElement.querySelector(sel);
  const chips = () =>
    fixture.nativeElement.querySelectorAll(
      '[data-testid="semantic-draft-tables-item"]'
    );

  it('renders a bounded, searchable table list on a 1,200-table service', () => {
    setup(many);
    expect(chips().length).toBeLessThanOrEqual(60);
    expect(q('[data-testid="semantic-draft-tables-search"]')).not.toBeNull();
    expect(dialog.needsTables).toBe(true);
    expect(dialog.canRun).toBe(false);
  });

  it('caps the pick at 60 tables and says so', () => {
    setup(many);
    many.slice(0, 60).forEach(t => dialog.toggleTable(t));
    dialog.toggleTable('t_0061');
    fixture.detectChanges();
    expect(dialog.tables).toHaveLength(60);
    expect(dialog.capHit).toBe(true);
    expect(
      q('[data-testid="semantic-draft-tables-hint"]').textContent
    ).toContain('at most 60');
    expect(
      q('[data-testid="semantic-draft-tables-picked"]').textContent
    ).toContain('60 / 60');
    expect(dialog.canRun).toBe(true);
  });

  it('requires typed tables when the table list is unknown', () => {
    setup(null);
    expect(dialog.needsTables).toBe(true);
    expect(dialog.canRun).toBe(false);
    dialog.tablesText = 'orders, customers, orders';
    expect(dialog.picked).toEqual(['orders', 'customers']);
    expect(dialog.canRun).toBe(true);
  });

  it('sends include_samples only when ticked, and blocks Escape while running', () => {
    setup(['orders']);
    const pending = new Subject<SemanticDraftReport>();
    api.draft.mockReturnValue(pending);
    dialog.run();
    expect(api.draft.mock.calls[0][1]).toEqual({
      ai_service: 'ai',
      max_entries: 40,
    });
    expect(ref.disableClose).toBe(true);
    pending.next({
      ai_service: 'ai',
      model: 'm',
      input_tokens: 1,
      output_tokens: 1,
      proposed: 0,
      created: 0,
      rejected: [],
      entries: [],
    });
    expect(ref.disableClose).toBe(false);

    dialog.report = null;
    dialog.includeSamples = true;
    api.draft.mockReturnValue(of(null));
    dialog.run();
    expect(api.draft.mock.calls[1][1].include_samples).toBe(true);
  });

  it('a 403 on the AI Connection list says so instead of "none exist"', () => {
    TestBed.resetTestingModule();
    setup(['orders']);
    TestBed.resetTestingModule();
    api = {
      aiConnections: jest.fn(() => of({ rows: [], error: 'forbidden' })),
      draft: jest.fn(),
    };
    TestBed.configureTestingModule({
      imports: [
        DfSemanticDraftDialogComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot(translocoEn),
      ],
      providers: [
        provideRouter([]),
        { provide: MAT_DIALOG_DATA, useValue: { service: 'db', tables: [] } },
        { provide: MatDialogRef, useValue: ref },
        { provide: SemanticCatalogApiService, useValue: api },
      ],
    });
    fixture = TestBed.createComponent(DfSemanticDraftDialogComponent);
    fixture.detectChanges();
    expect(q('[data-testid="semantic-draft-no-ai"]')).toBeNull();
    expect(q('[data-testid="semantic-draft-ai-error"]').textContent).toContain(
      'access to the list of AI Connection services'
    );
  });
});
