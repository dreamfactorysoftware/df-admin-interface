import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DfDmDetectionComponent } from './df-dm-detection.component';
import { DfDmRuleDialogComponent } from './df-dm-rule-dialog.component';
import { DataMaskingStore, summarize } from '../data-masking.store';
import { column } from '../dm-testing';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { dmTransloco } from '../dm-testing';
import { DetectionRule, MaskingOverview } from '../data-masking.types';

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
    {
      id: 4,
      match: 'value',
      pattern: '^(?:\\p{L}{2}\\d{6}|\\d{3}-\\d{4})$',
      class: 'passport_number',
      matches: 3,
      source: 'admin',
    },
    {
      id: 5,
      match: 'name',
      pattern: 'ssn|tax_id',
      class: 'national_id',
      matches: 1,
      source: 'admin',
    },
    {
      id: 6,
      match: 'name',
      pattern: '^(?:mrn|medical_?rec(?:ord)?_?(?:id|no|num|nbr|number))$',
      class: 'special_category',
      matches: 1,
      source: 'baseline:hipaa',
      title: 'Medical record, patient and chart numbers',
    },
  ];

  const rows = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.rules .row:not(.head-row)'
      )
    );
  const text = (e: Element | null | undefined) =>
    e?.textContent?.replace(/\s+/g, ' ').trim();

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
    expect(rows()).toHaveLength(6);
    const source = (row: Element) =>
      text(row.querySelector('[data-testid="dm-rule-source"]'));
    expect(source(rows()[0])).toBeUndefined();
    expect(source(rows()[1])).toBe('Added by the HIPAA baseline');
    // An id the UI does not know yet still reads sensibly.
    expect(source(rows()[2])).toBe('Added by the future_one baseline');
  });

  it('columns are Rule, Mask as, Matches', () => {
    const heads = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.head-row [role="columnheader"]'
      )
    ).map(h => text(h));
    expect(heads).toEqual(['Rule', 'Mask as', 'Matches', '']);
  });

  it('reads each rule as the sentence that wrote it', () => {
    const sentence = (row: Element) => {
      const cell = row.querySelector('[data-testid="dm-rule-sentence"]')!;
      return {
        lead: text(cell.querySelector('.lead')),
        terms: Array.from(cell.querySelectorAll('code.term')).map(c => text(c)),
        ors: cell.querySelectorAll('.sentence .or').length,
        regex: text(cell.querySelector('code.pattern')),
      };
    };
    const [isOne, baseline, regex, masks, unwrapped] = rows().map(sentence);
    expect(isOne).toEqual({
      lead: 'Column name is',
      terms: ['emp_ssn'],
      ors: 0,
      regex: undefined,
    });
    expect(baseline.lead).toBe('Column name is');
    expect(baseline.terms).toEqual(['mrn']);
    expect(regex).toEqual({
      lead: 'Column values match regex',
      terms: [],
      ors: 0,
      regex: '^X\\d+$',
    });
    expect(masks).toEqual({
      lead: 'Column values look like',
      terms: ['AA######', '###-####'],
      ors: 1,
      regex: undefined,
    });
    expect(unwrapped).toEqual({
      lead: 'Column name contains',
      terms: ['ssn', 'tax_id'],
      ors: 1,
      regex: undefined,
    });
    // A long regex is cut off on screen; the whole pattern is its title.
    const code = rows()[2].querySelector('code.pattern')!;
    expect(code.getAttribute('title')).toBe('^X\\d+$');
  });

  it('a baseline rule with a title reads as its name, not its regex', () => {
    const cell = rows()[5].querySelector('[data-testid="dm-rule-sentence"]')!;
    expect(text(cell.querySelector('.lead'))).toBe('Column name');
    const name = cell.querySelector('.name')!;
    expect(text(name)).toBe('Medical record, patient and chart numbers');
    expect(name.getAttribute('title')).toBe(rules[5].pattern);
    expect(cell.querySelector('code')).toBeNull();
    expect(text(cell.querySelector('[data-testid="dm-rule-source"]'))).toBe(
      'Added by the HIPAA baseline'
    );
  });

  it('Matches opens Columns filtered by the rule, labelled with its sentence', () => {
    const store = TestBed.inject(DataMaskingStore);
    const show = jest.spyOn(store, 'showColumns');
    api['testRule'] = jest.fn(() => of({ matches: [{ id: 'hr.e.ssn' }] }));
    const cmp = fixture.componentInstance;
    cmp.openMatches(rules[3]);
    expect(show).toHaveBeenLastCalledWith('all', {
      label: 'Column values look like AA###### or ###-####',
      ids: new Set(['hr.e.ssn']),
    });
    cmp.openMatches(rules[5]);
    expect(show.mock.calls[1][1]?.label).toBe(
      'Medical record, patient and chart numbers'
    );
    cmp.openMatches(rules[2]);
    expect(show.mock.calls[2][1]?.label).toBe(
      'Column values match regex ^X\\d+$'
    );
  });

  it('a value rule shows a spinner while a scan runs, then its count', () => {
    const store = TestBed.inject(DataMaskingStore);
    store.overview = {
      mode: 'preview',
      scan: { status: 'running', progress: 10, columns: 3 },
      counts: { masked: 0, review: 0, clear: 0 },
      you: { canGrant: true, seesRealValues: false },
    } as MaskingOverview;
    fixture.detectChanges();
    const spinner = (row: Element) =>
      row.querySelector('[data-testid="dm-rule-scanning"]');
    const count = (row: Element) =>
      text(row.querySelector('[data-testid="dm-rule-matches"]'));
    expect(spinner(rows()[3])?.getAttribute('aria-label')).toBe('Scanning');
    expect(count(rows()[3])).toBeUndefined();
    // Name rules apply at once: their counts stay.
    expect(spinner(rows()[0])).toBeNull();
    expect(count(rows()[0])).toBe('2');
    store.overview = {
      ...store.overview,
      scan: { status: 'idle', columns: 3 },
    };
    fixture.detectChanges();
    expect(spinner(rows()[3])).toBeNull();
    expect(count(rows()[3])).toBe('3');
  });

  it("opens Add rule in the page's injector, so it reaches the store", () => {
    fixture.componentInstance.addRule();
    const [cmp, config] = dialog.open.mock.calls[0];
    expect(cmp).toBe(DfDmRuleDialogComponent);
    expect(config.injector.get(DataMaskingStore)).toBe(
      TestBed.inject(DataMaskingStore)
    );
    // A fixed width (narrower on a small screen): chips never resize it.
    expect(config.width).toBe('560px');
    expect(config.maxWidth).toBe('calc(100vw - 32px)');
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
      // It names the rule, then says what stays.
      expect(data.message).toBe(
        'Column name is emp_ssn\n2 columns it masked stay masked.'
      );
      expect(data.extra).toBe('Delete and unmask 1');
      expect(api['deleteRule']).not.toHaveBeenCalled();
    });

    it('a rule that masked nothing alone is still named', () => {
      choice = false;
      fixture.componentInstance.deleteRule(rules[3]);
      const data = dialog.open.mock.calls[0][1].data;
      expect(data.message).toBe('Column values look like AA###### or ###-####');
      expect(data.extra).toBeUndefined();
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

/** The page shell provides the store on its own element, as the real one does. */
@Component({
  standalone: true,
  imports: [DfDmDetectionComponent],
  providers: [DataMaskingStore],
  template: '<df-dm-detection></df-dm-detection>',
})
class ShellHostComponent {}

describe('Add rule inside the page', () => {
  it("the dialog reaches the page's store and suggests its column names", () => {
    TestBed.configureTestingModule({
      imports: [ShellHostComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        {
          provide: DfDataMaskingApiService,
          useValue: {
            rules: jest.fn(() => of([])),
            builtInRules: jest.fn(() =>
              of({ ruleset: 'x', version: '1', classes: [] })
            ),
            testRule: jest.fn(() => of({ matches: [] })),
          },
        },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    const host = TestBed.createComponent(ShellHostComponent);
    host.detectChanges();
    const de = host.debugElement.query(By.directive(DfDmDetectionComponent));
    const store = de.injector.get(DataMaskingStore);
    const cols = [column({ id: 'hr.staff.emp_ssn', column: 'emp_ssn' })];
    store.columns.set('hr', cols);
    store.services = [
      { service: 'hr', label: 'HR', tables: [summarize('staff', cols)] },
    ];
    store.version++;
    (de.componentInstance as DfDmDetectionComponent).addRule();
    const ref = de.injector.get(MatDialog).openDialogs[0];
    const dialog = ref.componentInstance as DfDmRuleDialogComponent;
    dialog.text = 'emp';
    dialog.changed();
    expect(dialog.suggestions).toEqual(['emp_ssn']);
    ref.close();
  });
});
