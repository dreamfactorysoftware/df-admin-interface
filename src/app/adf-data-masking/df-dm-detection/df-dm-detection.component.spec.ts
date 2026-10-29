import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { DfDmDetectionComponent } from './df-dm-detection.component';
import {
  DfDmRuleDialogComponent,
  validPattern,
} from './df-dm-rule-dialog.component';
import { DataMaskingStore, summarize } from '../data-masking.store';
import { column } from '../dm-testing';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { dmTransloco } from '../dm-testing';
import { DetectionRule } from '../data-masking.types';

describe('DfDmDetectionComponent', () => {
  let fixture: ComponentFixture<DfDmDetectionComponent>;

  const rules: DetectionRule[] = [
    {
      id: 1,
      match: 'name',
      pattern: '^emp_ssn$',
      class: 'national_id',
      matches: 2,
      source: 'admin',
    },
    {
      id: 2,
      match: 'name',
      pattern: '^mrn$',
      class: 'special_category',
      matches: 0,
      source: 'baseline:hipaa',
    },
    {
      id: 3,
      match: 'value',
      pattern: '^X\\d+$',
      class: 'passport_number',
      matches: 0,
      source: 'baseline:future_one',
    },
  ];

  let dialog: { open: jest.Mock };
  let choice: unknown;
  let api: Record<string, jest.Mock>;

  beforeEach(() => {
    choice = true;
    dialog = { open: jest.fn(() => ({ afterClosed: () => of(choice) })) };
    api = {
      rules: jest.fn(() => of(rules)),
      builtInRules: jest.fn(() =>
        of({
          ruleset: 'dreamfactory-core',
          version: '2026.11.0',
          classes: [],
        })
      ),
      deleteRule: jest.fn(() => of({})),
      decide: jest.fn(() => of({})),
      overview: jest.fn(() => of(null)),
      tables: jest.fn(() => of([])),
      columns: jest.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      imports: [DfDmDetectionComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        DataMaskingStore,
        { provide: DfDataMaskingApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    fixture = TestBed.createComponent(DfDmDetectionComponent);
    fixture.detectChanges();
  });

  it('says which baseline added a rule; admin rules carry no label', () => {
    const rows = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.rules .row:not(.head-row)'
      )
    );
    expect(rows).toHaveLength(3);
    const source = (row: Element) =>
      row.querySelector('[data-testid="dm-rule-source"]')?.textContent?.trim();
    expect(source(rows[0])).toBeUndefined();
    expect(source(rows[1])).toBe('Added by the HIPAA baseline');
    // An id the UI does not know yet still reads sensibly.
    expect(source(rows[2])).toBe('Added by the future_one baseline');
  });

  describe('deleting a rule', () => {
    const ev = (lines: [number, string][]) => ({
      total: 100,
      thresholdMask: 70,
      thresholdReview: 40,
      lines: lines.map(([points, text]) => ({
        points,
        kind: 'context' as const,
        text,
      })),
    });
    beforeEach(() => {
      const store = TestBed.inject(DataMaskingStore);
      const cols = [
        column({
          id: 'crm.a.emp_ssn',
          table: 'a',
          evidence: ev([[70, 'Custom rule ^emp_ssn$']]),
        }),
        column({
          id: 'crm.a.ssn',
          table: 'a',
          evidence: ev([
            [70, 'Custom rule ^emp_ssn$'],
            [45, 'Column name'],
          ]),
        }),
      ];
      store.columns.set('crm', cols);
      store.services = [
        { service: 'crm', label: 'CRM', tables: [summarize('a', cols)] },
      ];
    });

    it('asks first, and says its columns stay masked', () => {
      choice = false;
      fixture.componentInstance.deleteRule(rules[0]);
      const data = dialog.open.mock.calls[0][1].data;
      expect(data.title).toBe('Delete rule?');
      expect(data.message).toBe('2 columns it masked stay masked.');
      expect(data.extra).toBe('Delete and unmask 1');
      expect(api['deleteRule']).not.toHaveBeenCalled();
    });

    it('Delete keeps the columns masked', () => {
      fixture.componentInstance.deleteRule(rules[0]);
      expect(api['deleteRule']).toHaveBeenCalledWith(1);
      expect(api['decide']).not.toHaveBeenCalled();
    });

    it('Delete and unmask clears only the columns nothing else flags', () => {
      choice = 'extra';
      fixture.componentInstance.deleteRule(rules[0]);
      expect(api['deleteRule']).toHaveBeenCalledWith(1);
      expect(api['decide']).toHaveBeenCalledTimes(1);
      expect(api['decide']).toHaveBeenCalledWith('crm.a.emp_ssn', null);
    });
  });
});

describe('DfDmRuleDialogComponent', () => {
  it.each([
    ['atomic group (backtracking-safe)', '^(?>emp|staff)_ssn$'],
    ['possessive quantifier', '^\\d++-\\d++$'],
    ['inline flag', '(?i)^ssn$'],
    ['PCRE named group', '^(?P<pre>emp)_ssn$'],
  ])('accepts a valid PCRE pattern: %s', (_label, p) => {
    expect(validPattern(p)).toBe(true);
  });

  it("shows the server's reason when the preview pattern does not compile", fakeAsync(() => {
    // What the error interceptor hands a toast-off caller: a normalized 400.
    const refused = normalizeError(
      new HttpErrorResponse({
        status: 400,
        error: {
          error: {
            code: 400,
            message: "Pattern doesn't compile: lookbehind is not fixed length",
          },
        },
      })
    );
    const testRule = jest.fn(() => throwError(() => refused));
    TestBed.configureTestingModule({
      imports: [DfDmRuleDialogComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        { provide: DfDataMaskingApiService, useValue: { testRule } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
      ],
    });
    const f = TestBed.createComponent(DfDmRuleDialogComponent);
    f.detectChanges();
    const cmp = f.componentInstance;
    cmp.draft = { match: 'name', pattern: '(?<=e+)ssn', class: 'national_id' };
    cmp.changed();
    tick(300);
    f.detectChanges();
    const preview = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="dm-rule-preview"]'
    )!;
    expect(preview.textContent).toContain('lookbehind is not fixed length');
    expect(preview.textContent).not.toContain('Matches 0 columns');
    expect(cmp.canSave).toBe(false);
    // Editing clears it until the server answers again.
    cmp.draft = { ...cmp.draft, pattern: 'ssn' };
    testRule.mockReturnValue(of({ matches: [{ id: 'a.b.ssn' }] }) as never);
    cmp.changed();
    tick(300);
    f.detectChanges();
    expect(cmp.canSave).toBe(true);
    expect(preview.textContent).toContain('Matches 1 column');
  }));

  it.each([
    [403, 'Only a system administrator can change Data Masking settings.', ''],
    [400, 'Pattern is too broad', 'Pattern is too broad'],
  ])(
    'save refused with %s: the dialog stays open; only a refused rule explains itself in place',
    (status, message, inline) => {
      const refused = normalizeError(
        new HttpErrorResponse({
          status,
          error: { error: { code: status, message } },
        })
      );
      const close = jest.fn();
      TestBed.configureTestingModule({
        imports: [DfDmRuleDialogComponent, NoopAnimationsModule, dmTransloco()],
        providers: [
          {
            provide: DfDataMaskingApiService,
            useValue: { testRule: jest.fn(() => of({ matches: [] })) },
          },
          { provide: MatDialogRef, useValue: { close } },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { save: () => throwError(() => refused) },
          },
        ],
      });
      const f = TestBed.createComponent(DfDmRuleDialogComponent);
      f.detectChanges();
      const cmp = f.componentInstance;
      cmp.draft = { match: 'name', pattern: '^ssn$', class: 'national_id' };
      cmp.save();
      f.detectChanges();
      expect(close).not.toHaveBeenCalled();
      expect(cmp.saving).toBe(false);
      // A 403 is the store's error toast (the server's message), not the
      // rule's fault: nothing in place, and Save works again.
      expect(cmp.saveError ?? '').toBe(inline);
      expect(cmp.canSave).toBe(true);
    }
  );
});
