import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { of } from 'rxjs';
import * as catalog from './semantic-catalog';
import { DfSemanticImportDialogComponent } from './df-semantic-import-dialog.component';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';
import { translocoEn } from './semantic-i18n.testing';

describe('DfSemanticImportDialogComponent', () => {
  let fixture: ComponentFixture<DfSemanticImportDialogComponent>;
  let dialog: DfSemanticImportDialogComponent;
  let api: { import: jest.Mock };

  beforeEach(() => {
    api = { import: jest.fn() };
    TestBed.configureTestingModule({
      imports: [
        DfSemanticImportDialogComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot(translocoEn),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { service: 'db' } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: SemanticCatalogApiService, useValue: api },
      ],
    });
    fixture = TestBed.createComponent(DfSemanticImportDialogComponent);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  });

  const q = (sel: string) => fixture.nativeElement.querySelector(sel);
  const fileEvent = (file: File) =>
    ({ target: { files: [file], value: 'x' } }) as unknown as Event;

  it('parses the document once per change, not on every change detection', () => {
    const parse = jest.spyOn(catalog, 'parseExportDoc');
    dialog.onJson('{"entries":[{"kind":"term","name":"a","definition":{}}]}');
    const calls = parse.mock.calls.length;
    fixture.detectChanges();
    fixture.detectChanges();
    expect(parse.mock.calls.length).toBe(calls);
    expect(dialog.entryCount).toBe(1);
    parse.mockRestore();
  });

  it('refuses a file over 5 MB before reading it', () => {
    const big = new File(['x'], 'huge.json');
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    dialog.onFile(fileEvent(big));
    fixture.detectChanges();
    expect(q('[data-testid="semantic-import-error"]').textContent).toContain(
      'larger than 5 MB'
    );
    expect(dialog.json).toBe('');
  });

  it('reports a file that cannot be read', () => {
    const reader = {
      readAsText() {
        setTimeout(() => (reader as any).onerror(new Error('gone')));
      },
    } as any;
    const spy = jest
      .spyOn(window as any, 'FileReader')
      .mockImplementation(() => reader);
    return new Promise<void>(done => {
      dialog.onFile(fileEvent(new File(['{}'], 'broken.json')));
      setTimeout(() => {
        fixture.detectChanges();
        expect(
          q('[data-testid="semantic-import-error"]').textContent
        ).toContain('Could not read broken.json');
        spy.mockRestore();
        done();
      });
    });
  });

  it('an invalid document and a server error are separate states', () => {
    dialog.onJson('not json');
    dialog.run();
    fixture.detectChanges();
    expect(dialog.invalid).toBe(true);
    expect(q('[data-testid="semantic-import-error"]').textContent).toContain(
      'not an export document'
    );
    expect(api.import).not.toHaveBeenCalled();

    // Fixing the text clears the invalid state; the import runs.
    dialog.onJson('{"entries":[]}');
    api.import.mockReturnValue(
      of({ created: 0, updated: 0, unchanged: 0, approved: 0, failed: [] })
    );
    dialog.run();
    expect(dialog.invalid).toBe(false);
    expect(api.import).toHaveBeenCalledWith('db', { entries: [] }, true);
  });
});
