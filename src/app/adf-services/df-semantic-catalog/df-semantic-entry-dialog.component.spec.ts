import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { of, throwError } from 'rxjs';
import { DfSemanticEntryDialogComponent } from './df-semantic-entry-dialog.component';
import { SemanticEntry } from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';

const approvedQuery: SemanticEntry = {
  id: 7,
  service: 'db',
  kind: 'query',
  name: 'orders for a customer',
  description: null,
  definition: {
    question: 'Orders for a customer?',
    table: 'orders',
    fields: ['id', 'status'],
    filter: 'customer_id = {customer_id}',
    limit: 10,
    params: [{ name: 'customer_id', type: 'integer', required: true }],
  },
  status: 'approved',
  source: 'manual',
  stale_reason: null,
  approved_date: null,
  approved_by_id: null,
  created_date: '',
  last_modified_date: '',
};

describe('DfSemanticEntryDialogComponent', () => {
  let fixture: ComponentFixture<DfSemanticEntryDialogComponent>;
  let component: DfSemanticEntryDialogComponent;
  let api: jest.Mocked<
    Pick<SemanticCatalogApiService, 'create' | 'update' | 'table'>
  >;
  let close: jest.Mock;

  function setup(data: Record<string, unknown>) {
    api = {
      create: jest.fn(),
      update: jest.fn(),
      table: jest
        .fn()
        .mockReturnValue(
          of({ fields: ['id', 'status', 'customer_id'], related: [] })
        ),
    };
    close = jest.fn();
    TestBed.configureTestingModule({
      imports: [
        DfSemanticEntryDialogComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} } }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { tables: ['orders'], ...data } },
        { provide: MatDialogRef, useValue: { close } },
        { provide: SemanticCatalogApiService, useValue: api },
      ],
    });
    fixture = TestBed.createComponent(DfSemanticEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('an untouched edit sends nothing and keeps the approval', () => {
    setup({ service: 'db', kind: 'query', entry: approvedQuery });
    component.save();
    expect(api.update).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledWith(approvedQuery);
  });

  it('a description-only edit does not resend the definition', () => {
    setup({ service: 'db', kind: 'query', entry: approvedQuery });
    api.update.mockReturnValue(of(approvedQuery));
    component.description = 'Checked with finance';
    component.save();
    expect(api.update).toHaveBeenCalledWith('db', 7, {
      description: 'Checked with finance',
    });
  });

  it('warns when filter placeholders and params disagree', () => {
    setup({ service: 'db', kind: 'query', entry: approvedQuery });
    component.filter = 'customer_id = {cid}';
    expect(component.mismatch).toEqual({
      undeclared: ['cid'],
      unused: ['customer_id'],
    });
    component.declareMissing();
    expect(component.params.map(p => p.name)).toEqual(['customer_id', 'cid']);
  });

  it('blocks a save the server would reject and shows its 400 inline', () => {
    setup({ service: 'db', kind: 'metric' });
    component.save();
    expect(component.clientErrors).toContain('Name is required.');
    expect(api.create).not.toHaveBeenCalled();

    component.name = 'revenue';
    component.onTableChange('orders');
    component.aggregates[0].field = 'amount';
    api.create.mockReturnValue(
      throwError(() => ({
        raw: {
          error: {
            message:
              'resource[0] (revenue): column orders.amount does not exist',
          },
        },
      }))
    );
    component.save();
    expect(component.clientErrors).toEqual([]);
    expect(component.serverError).toBe(
      'resource[0] (revenue): column orders.amount does not exist'
    );
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="semantic-editor-error"]'
      )?.textContent
    ).toContain('column orders.amount does not exist');
    expect(close).not.toHaveBeenCalled();
  });
});
