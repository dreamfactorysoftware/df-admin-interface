import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import {
  DfDmRuleDialogComponent,
  RuleDraft,
  validPattern,
} from './df-dm-rule-dialog.component';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DataMaskingStore } from '../data-masking.store';
import { RuleOp, RuleTarget } from '../rule-pattern';
import { column, dmTransloco } from '../dm-testing';

interface Setup {
  /** Column names the page has loaded (null: opened without the store). */
  names?: string[] | null;
  save?: (d: RuleDraft) => Observable<unknown>;
  testRule?: jest.Mock;
}

/** fakeAsync that lets the debounced preview (and any overlay) finish. */
function fa<A extends unknown[]>(fn: (...args: A) => void) {
  return fakeAsync((...args: A) => {
    fn(...args);
    tick(1000);
    flush();
    discardPeriodicTasks();
  });
}

describe('DfDmRuleDialogComponent', () => {
  let f: ComponentFixture<DfDmRuleDialogComponent>;
  let cmp: DfDmRuleDialogComponent;
  let el: HTMLElement;
  let testRule: jest.Mock;
  let save: jest.Mock;
  let close: jest.Mock;

  function setup(opts: Setup = {}): void {
    testRule = opts.testRule ?? jest.fn(() => of({ matches: [] }));
    save = jest.fn(opts.save ?? (() => of({})));
    close = jest.fn();
    const providers: unknown[] = [
      { provide: DfDataMaskingApiService, useValue: { testRule } },
      { provide: MatDialogRef, useValue: { close } },
      { provide: MAT_DIALOG_DATA, useValue: { save } },
    ];
    if (opts.names !== null) {
      const cols = (opts.names ?? []).map((name, i) =>
        column({ id: `s.t${i}.${name}`, column: name })
      );
      providers.push({
        provide: DataMaskingStore,
        useValue: { version: 1, allColumns: () => cols },
      });
    }
    TestBed.configureTestingModule({
      imports: [DfDmRuleDialogComponent, NoopAnimationsModule, dmTransloco()],
      providers: providers as never[],
    });
    f = TestBed.createComponent(DfDmRuleDialogComponent);
    cmp = f.componentInstance;
    el = f.nativeElement as HTMLElement;
    // NgForm registers its controls a microtask later.
    settle();
  }

  /** Let ngModel and the autocomplete write the view. */
  function settle(): void {
    f.detectChanges();
    tick();
    f.detectChanges();
  }

  const q = <T extends Element = HTMLElement>(id: string) =>
    el.querySelector<T & Element>(`[data-testid="${id}"]`);
  const input = () => q<HTMLInputElement>('dm-rule-terms')!;
  const chips = () =>
    Array.from(
      el.querySelectorAll('[data-testid="dm-rule-chip"] .chip-text')
    ).map(c => c.textContent);
  const ors = () => el.querySelectorAll('.terms .or').length;

  function type(text: string, target = input()): void {
    target.value = text;
    target.dispatchEvent(new Event('input'));
    settle();
  }

  function press(key: string, target = input()): KeyboardEvent {
    const ev = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(ev);
    settle();
    return ev;
  }

  function blur(relatedTarget: EventTarget | null = null): void {
    input().dispatchEvent(new FocusEvent('blur', { relatedTarget }));
    settle();
  }

  function paste(text: string): Event {
    const ev = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'clipboardData', {
      value: { getData: () => text },
    });
    input().dispatchEvent(ev);
    settle();
    return ev;
  }

  /** Every pattern the preview and save sent. */
  const sent = () => [
    ...testRule.mock.calls.map(c => c[0].pattern as string),
    ...save.mock.calls.map(c => c[0].pattern as string),
  ];

  function choose(target: RuleTarget, op: RuleOp): void {
    cmp.setTarget(target);
    cmp.setOp(op);
    settle();
  }

  describe('compiles the sentence on save', () => {
    it.each<[RuleTarget, RuleOp, string[], string]>([
      ['name', 'is', ['emp_ssn', 'social_sec'], '^(?:emp_ssn|social_sec)$'],
      ['name', 'contains', ['ssn'], 'ssn'],
      ['name', 'startsWith', ['tax_', 'fed_'], '^(?:tax_|fed_)'],
      ['name', 'endsWith', ['_ssn'], '_ssn$'],
      ['value', 'looksLike', ['AB123456'], '^\\p{L}{2}\\d{6}$'],
      ['value', 'contains', ['@example.com'], '@example\\.com'],
      ['value', 'startsWith', ['EMP-'], '^EMP-'],
    ])(
      '%s %s %j -> %s',
      fa((target: RuleTarget, op: RuleOp, terms: string[], pattern: string) => {
        setup();
        choose(target, op);
        for (const t of terms) {
          type(t);
          press('Enter');
        }
        cmp.cls = 'national_id';
        cmp.save();
        expect(save).toHaveBeenCalledWith({
          match: target,
          pattern,
          class: 'national_id',
        });
        expect(close).toHaveBeenCalledWith(true);
      })
    );

    it.each<[RuleTarget, string]>([
      ['name', '^(?>emp|staff)_ssn$'],
      ['value', '^[A-Z]{2}\\d{6}$'],
    ])(
      '%s matches regex sends the regex as typed',
      fa((target: RuleTarget, p: string) => {
        setup();
        choose(target, 'regex');
        expect(q('dm-rule-terms')).toBeNull();
        type(p, q<HTMLInputElement>('dm-rule-pattern')!);
        cmp.cls = 'national_id';
        cmp.save();
        expect(save).toHaveBeenCalledWith({
          match: target,
          pattern: p,
          class: 'national_id',
        });
      })
    );
  });

  it(
    'what is still typed counts for the preview and Add rule',
    fa(() => {
      setup();
      type('emp_ssn');
      tick(300);
      expect(testRule).toHaveBeenLastCalledWith({
        match: 'name',
        pattern: '^emp_ssn$',
      });
      press('Enter');
      type('social_sec');
      tick(300);
      expect(testRule).toHaveBeenLastCalledWith({
        match: 'name',
        pattern: '^(?:emp_ssn|social_sec)$',
      });
      cmp.cls = 'national_id';
      settle();
      expect(q<HTMLButtonElement>('dm-rule-save')!.disabled).toBe(false);
      cmp.save();
      settle();
      expect(save.mock.calls[0][0].pattern).toBe('^(?:emp_ssn|social_sec)$');
      // Saving commits it, so a refusal leaves the chips to fix.
      expect(chips()).toEqual(['emp_ssn', 'social_sec']);
    })
  );

  it(
    'committing alone sends nothing new',
    fa(() => {
      setup();
      type('ssn');
      tick(300);
      expect(testRule).toHaveBeenCalledTimes(1);
      press('Enter');
      tick(300);
      expect(testRule).toHaveBeenCalledTimes(1);
    })
  );

  describe('chips', () => {
    it(
      'Enter, comma and blur commit; repeats (any case) are ignored',
      fa(() => {
        setup();
        type('emp_ssn');
        expect(press('Enter').defaultPrevented).toBe(true);
        type('social_sec');
        expect(press(',').defaultPrevented).toBe(true);
        type('tax_id');
        blur();
        type('EMP_SSN');
        press('Enter');
        expect(chips()).toEqual(['emp_ssn', 'social_sec', 'tax_id']);
        expect(input().value).toBe('');
        // "or" between chips, not after the last one.
        expect(ors()).toBe(2);
        expect(el.querySelector('.terms .or')!.textContent!.trim()).toBe('or');
      })
    );

    it(
      'Enter in an empty input is left to the form (Add rule)',
      fa(() => {
        setup();
        expect(press('Enter').defaultPrevented).toBe(false);
        type('   ');
        expect(press('Enter').defaultPrevented).toBe(false);
        expect(chips()).toEqual([]);
      })
    );

    it(
      'pasting a list makes a chip per item; a single term pastes as text',
      fa(() => {
        setup();
        expect(paste('emp_ssn, social_sec,\ntax_id, ,').defaultPrevented).toBe(
          true
        );
        expect(chips()).toEqual(['emp_ssn', 'social_sec', 'tax_id']);
        expect(paste('ssn').defaultPrevented).toBe(false);
        expect(chips()).toHaveLength(3);
      })
    );

    it(
      'Backspace in an empty input removes the last chip',
      fa(() => {
        setup();
        type('a,b');
        press(',');
        expect(chips()).toEqual(['a', 'b']);
        type('c');
        // Text to delete first: the chips stay.
        expect(press('Backspace').defaultPrevented).toBe(false);
        expect(chips()).toEqual(['a', 'b']);
        type('');
        expect(press('Backspace').defaultPrevented).toBe(true);
        expect(chips()).toEqual(['a']);
      })
    );

    it(
      'each chip has a labelled remove button that keeps focus in the field',
      fa(() => {
        setup();
        type('emp_ssn');
        press('Enter');
        type('ssn');
        press('Enter');
        const buttons = el.querySelectorAll<HTMLButtonElement>(
          '[data-testid="dm-rule-chip"] button'
        );
        expect(
          Array.from(buttons).map(b => b.getAttribute('aria-label'))
        ).toEqual(['Remove emp_ssn', 'Remove ssn']);
        expect(buttons[0].type).toBe('button');
        buttons[0].click();
        settle();
        expect(chips()).toEqual(['ssn']);
        expect(document.activeElement).toBe(input());
      })
    );

    it(
      'the placeholder is the example, until there are chips',
      fa(() => {
        setup();
        expect(input().placeholder).toBe('emp_ssn');
        type('x');
        press('Enter');
        expect(input().placeholder).toBe('');
        choose('value', 'looksLike');
        expect(input().placeholder).toBe('AB123456');
        cmp.setOp('contains');
        settle();
        expect(input().placeholder).toBe('@example.com');
      })
    );

    it(
      'pressing the field types into it without committing; remove buttons stay buttons',
      fa(() => {
        setup();
        type('a');
        press('Enter');
        input().focus();
        type('b');
        const down = (target: Element) => {
          const ev = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
          });
          target.dispatchEvent(ev);
          return ev;
        };
        expect(down(el.querySelector('.terms')!).defaultPrevented).toBe(true);
        expect(down(el.querySelector('.chip-text')!).defaultPrevented).toBe(
          true
        );
        expect(document.activeElement).toBe(input());
        expect(down(el.querySelector('.chip-remove')!).defaultPrevented).toBe(
          false
        );
        expect(down(input()).defaultPrevented).toBe(false);
        settle();
        expect(chips()).toEqual(['a']);
        expect(input().value).toBe('b');
      })
    );
  });

  describe('look like', () => {
    it(
      'chips are format masks; the raw example is never sent',
      fa(() => {
        setup();
        choose('value', 'looksLike');
        type('AB123456');
        press('Enter');
        expect(chips()).toEqual(['AA######']);
        type('555-0100');
        tick(300);
        expect(testRule).toHaveBeenLastCalledWith({
          match: 'value',
          pattern: '^(?:\\p{L}{2}\\d{6}|\\d{3}-\\d{4})$',
        });
        cmp.cls = 'passport_number';
        cmp.save();
        settle();
        expect(chips()).toEqual(['AA######', '###-####']);
        for (const p of sent()) {
          expect(p).not.toContain('AB');
          expect(p).not.toContain('123456');
          expect(p).not.toContain('0100');
        }
      })
    );

    it(
      'an example in any script is masked before anything is sent',
      fa(() => {
        setup();
        choose('value', 'looksLike');
        // Typed, not committed: the preview already tests it.
        type('山田-٣٤');
        tick(300);
        type('Иван123');
        press('Enter');
        type('Müller');
        tick(300);
        cmp.cls = 'person_name';
        cmp.save();
        settle();
        expect(chips()).toEqual(['AAAA###', 'AAAAAA']);
        expect(sent()).toContain('^\\p{L}{2}-\\d{2}$');
        for (const p of sent()) {
          expect(p).not.toMatch(/[山田٣٤ИванüM]|ller/u);
        }
      })
    );

    it(
      'typed examples do not follow to a literal operator',
      fa(() => {
        setup();
        choose('value', 'looksLike');
        type('ZQ987');
        cmp.setOp('contains');
        settle();
        tick(300);
        expect(input().value).toBe('');
        expect(cmp.terms).toEqual([]);
        expect(sent().some(p => p.includes('ZQ987'))).toBe(false);
      })
    );

    it(
      'a typed mask works the same as an example',
      fa(() => {
        setup();
        choose('value', 'looksLike');
        type('AA######, ab123456');
        press(',');
        // Same shape twice: one chip.
        expect(chips()).toEqual(['AA######']);
      })
    );
  });

  describe('switching operators', () => {
    it(
      'to regex shows what the chips compile to; back again decompiles',
      fa(() => {
        setup();
        type('emp_ssn');
        press('Enter');
        type('social_sec');
        cmp.setOp('regex');
        settle();
        const rx = q<HTMLInputElement>('dm-rule-pattern')!;
        expect(rx.value).toBe('^(?:emp_ssn|social_sec)$');
        cmp.setOp('is');
        settle();
        expect(chips()).toEqual(['emp_ssn', 'social_sec']);
      })
    );

    it(
      'a regex this dialog would not write starts with no chips',
      fa(() => {
        setup();
        cmp.setOp('regex');
        settle();
        type('e_?mail', q<HTMLInputElement>('dm-rule-pattern')!);
        cmp.setOp('contains');
        settle();
        expect(chips()).toEqual([]);
        // …and the regex is still there to go back to.
        cmp.setOp('regex');
        settle();
        expect(q<HTMLInputElement>('dm-rule-pattern')!.value).toBe('e_?mail');
      })
    );

    it(
      'a builder regex becomes chips for any literal operator',
      fa(() => {
        setup();
        cmp.setOp('regex');
        settle();
        type('^tax_', q<HTMLInputElement>('dm-rule-pattern')!);
        cmp.setOp('startsWith');
        settle();
        expect(chips()).toEqual(['tax_']);
      })
    );

    it(
      'literal operators keep the chips and the typing',
      fa(() => {
        setup();
        type('ssn');
        press('Enter');
        type('tax');
        cmp.setOp('contains');
        settle();
        expect(chips()).toEqual(['ssn']);
        expect(input().value).toBe('tax');
        expect(cmp.pattern).toBe('(?:ssn|tax)');
      })
    );

    it(
      'Column name / Column values: contains and starts with carry over, the rest resets',
      fa(() => {
        setup();
        cmp.setOp('contains');
        type('ssn');
        press('Enter');
        cmp.setTarget('value');
        settle();
        expect([cmp.op, chips()]).toEqual(['contains', ['ssn']]);
        cmp.setOp('looksLike');
        settle();
        type('AB12');
        press('Enter');
        cmp.setTarget('name');
        settle();
        // A format mask never becomes a name.
        expect([cmp.op, chips()]).toEqual(['is', []]);
        type('emp_ssn');
        press('Enter');
        cmp.setTarget('value');
        settle();
        expect([cmp.op, chips()]).toEqual(['looksLike', []]);
        cmp.setOp('regex');
        settle();
        type('^X', q<HTMLInputElement>('dm-rule-pattern')!);
        cmp.setTarget('name');
        settle();
        expect([cmp.op, cmp.pattern]).toEqual(['is', '']);
      })
    );

    it(
      'the operator menu follows the target, with the exact labels',
      fa(() => {
        setup();
        const labels = () => {
          q<HTMLElement>('dm-rule-op')!
            .querySelector<HTMLElement>('.mat-mdc-select-trigger')!
            .click();
          settle();
          const opts = Array.from(
            document.querySelectorAll('.mat-mdc-select-panel mat-option')
          ).map(o => o.textContent!.trim());
          (
            document.querySelector('.cdk-overlay-backdrop') as HTMLElement
          )?.click();
          settle();
          flush();
          return opts;
        };
        expect(labels()).toEqual([
          'is',
          'contains',
          'starts with',
          'ends with',
          'matches regex',
        ]);
        cmp.setTarget('value');
        settle();
        expect(labels()).toEqual([
          'look like',
          'contain',
          'start with',
          'match regex',
        ]);
      })
    );
  });

  describe('Column name is: suggestions from the loaded columns', () => {
    const names = [
      'emp_ssn',
      'EMP_SSN',
      'ssn',
      'social_sec',
      'tax_id',
      'address',
      'class',
      'last_seen',
      'session',
      'status',
      'subject',
      'source',
    ];

    it(
      'case-insensitive substring, starts-with first, at most 8, chosen excluded',
      fa(() => {
        setup({ names });
        type('S');
        expect(cmp.suggestions).toHaveLength(8);
        // Names that start with "s" come first, then the rest alphabetically.
        expect(cmp.suggestions.slice(0, 7)).toEqual([
          'session',
          'social_sec',
          'source',
          'ssn',
          'status',
          'subject',
          'address',
        ]);
        type('ssn');
        expect(cmp.suggestions).toEqual(['ssn', 'emp_ssn']);
        press('Enter');
        type('SSN');
        expect(cmp.suggestions).toEqual(['emp_ssn']);
      })
    );

    it(
      'choosing one adds a chip',
      fa(() => {
        setup({ names });
        type('emp');
        cmp.pick({
          option: { value: 'emp_ssn' },
        } as unknown as MatAutocompleteSelectedEvent);
        settle();
        expect(chips()).toEqual(['emp_ssn']);
        expect(input().value).toBe('');
      })
    );

    it(
      'the options render under the field',
      fa(() => {
        setup({ names });
        input().focus();
        type('tax');
        flush();
        f.detectChanges();
        const opts = Array.from(
          document.querySelectorAll('.mat-mdc-autocomplete-panel .name-option')
        ).map(o => o.textContent!.trim());
        expect(opts).toEqual(['tax_id']);
      })
    );

    it(
      'clicking a suggestion adds that name, not what was typed',
      fa(() => {
        setup({ names });
        input().focus();
        type('emp');
        flush();
        f.detectChanges();
        const option = document.querySelector<HTMLElement>(
          '.mat-mdc-autocomplete-panel .name-option'
        )!;
        expect(option.textContent!.trim()).toBe('emp_ssn');
        // Pressing the option must not take focus from the input: a blur
        // would commit "emp" and remove the option before the click lands.
        const down = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        option.dispatchEvent(down);
        expect(down.defaultPrevented).toBe(true);
        option.click();
        settle();
        flush();
        expect(chips()).toEqual(['emp_ssn']);
        expect(input().value).toBe('');
      })
    );

    it(
      'leaving the field commits what was typed',
      fa(() => {
        setup({ names });
        type('emp');
        blur();
        expect(chips()).toEqual(['emp']);
      })
    );

    it(
      'only for "is"',
      fa(() => {
        setup({ names });
        cmp.setOp('contains');
        type('ss');
        expect(cmp.suggestions).toEqual([]);
      })
    );

    it(
      'without loaded columns, plain chips still work',
      fa(() => {
        setup({ names: null });
        type('ss');
        expect(cmp.suggestions).toEqual([]);
        press('Enter');
        expect(chips()).toEqual(['ss']);
      })
    );
  });

  describe('accessible names read as the sentence', () => {
    it(
      'operator select, term input and regex input',
      fa(() => {
        setup();
        const op = q<HTMLElement>('dm-rule-op')!;
        expect(op.getAttribute('aria-label')).toBe('Column name');
        expect(input().getAttribute('aria-label')).toBe('Column name is');
        cmp.setTarget('value');
        settle();
        expect(op.getAttribute('aria-label')).toBe('Column values');
        expect(input().getAttribute('aria-label')).toBe(
          'Column values look like'
        );
        cmp.setOp('regex');
        settle();
        expect(q('dm-rule-pattern')!.getAttribute('aria-label')).toBe(
          'Column values match regex'
        );
        expect(q('dm-rule-match')!.textContent).toContain('Column values');
        expect(
          el.querySelector('#dm-rule-class-label')!.textContent!.trim()
        ).toBe('Mask as');
      })
    );
  });

  it(
    'too many terms for one rule says so and sends nothing',
    fa(() => {
      setup();
      const long = Array.from(
        { length: 12 },
        (_, i) => `${'x'.repeat(40)}${i}`
      );
      paste(long.join(','));
      tick(300);
      expect(cmp.pattern.length).toBeGreaterThan(500);
      expect(q('dm-rule-error')!.textContent).toBe(
        'Too many terms for one rule'
      );
      expect(el.querySelector('.terms')!.classList).toContain('is-invalid');
      cmp.cls = 'national_id';
      expect(cmp.canSave).toBe(false);
      expect(testRule).not.toHaveBeenCalled();
    })
  );

  it.each([
    ['atomic group (backtracking-safe)', '^(?>emp|staff)_ssn$'],
    ['possessive quantifier', '^\\d++-\\d++$'],
    ['inline flag', '(?i)^ssn$'],
    ['PCRE named group', '^(?P<pre>emp)_ssn$'],
  ])('accepts a valid PCRE pattern: %s', (_label, p) => {
    expect(validPattern(p)).toBe(true);
  });

  it(
    "shows the server's reason when the preview pattern does not compile",
    fa(() => {
      // What the error interceptor hands a toast-off caller: a normalized 400.
      const refused = normalizeError(
        new HttpErrorResponse({
          status: 400,
          error: {
            error: {
              code: 400,
              message:
                "Pattern doesn't compile: lookbehind is not fixed length",
            },
          },
        })
      );
      setup({ testRule: jest.fn(() => throwError(() => refused)) });
      cmp.setOp('regex');
      settle();
      const rx = () => q<HTMLInputElement>('dm-rule-pattern')!;
      type('(?<=e+)ssn', rx());
      cmp.cls = 'national_id';
      tick(300);
      f.detectChanges();
      const preview = q('dm-rule-preview')!;
      expect(preview.textContent).toContain('lookbehind is not fixed length');
      expect(preview.textContent).not.toContain('Matches 0 columns');
      expect(rx().classList).toContain('is-invalid');
      expect(cmp.canSave).toBe(false);
      // Editing clears it until the server answers again.
      testRule.mockReturnValue(of({ matches: [{ id: 'a.b.ssn' }] }) as never);
      type('ssn', rx());
      tick(300);
      f.detectChanges();
      expect(cmp.canSave).toBe(true);
      expect(preview.textContent).toContain('Matches 1 column');
    })
  );

  it.each([
    [403, 'Only a system administrator can change Data Masking settings.', ''],
    [400, 'This rule already exists.', 'This rule already exists.'],
  ])(
    'save refused with %s: the dialog stays open; only a refused rule explains itself in place',
    fa((status: number, message: string, inline: string) => {
      const refused = normalizeError(
        new HttpErrorResponse({
          status,
          error: { error: { code: status, message } },
        })
      );
      setup({ save: () => throwError(() => refused) });
      type('ssn');
      cmp.cls = 'national_id';
      cmp.save();
      settle();
      expect(close).not.toHaveBeenCalled();
      expect(cmp.saving).toBe(false);
      // A 403 is the store's error toast (the server's message), not the
      // rule's fault: nothing in place, and Save works again.
      expect(cmp.saveError ?? '').toBe(inline);
      expect(cmp.canSave).toBe(true);
    })
  );
  describe('layout', () => {
    it(
      'the regex is one pattern over a few rows: line breaks are dropped, Enter adds the rule',
      fa(() => {
        setup();
        cmp.setOp('regex');
        settle();
        const rx = q<HTMLTextAreaElement>('dm-rule-pattern')!;
        expect(rx.tagName).toBe('TEXTAREA');
        type('^emp_ssn$\n|social\r\n_sec', rx as never);
        expect(cmp.regex).toBe('^emp_ssn$|social_sec');
        expect(rx.value).toBe('^emp_ssn$|social_sec');
        cmp.cls = 'national_id';
        tick(300);
        const enter = press('Enter', rx as never);
        expect(enter.defaultPrevented).toBe(true);
        expect(save).toHaveBeenCalledWith({
          match: 'name',
          pattern: '^emp_ssn$|social_sec',
          class: 'national_id',
        });
      })
    );

    it.each([
      [5, 5, ''],
      [6, 4, 'and 2 more'],
      [13, 4, 'and 9 more'],
    ])(
      '%s matches list %s ids in the fixed box %s',
      (n: number, shown: number, more: string) =>
        fa(() => {
          const ids = Array.from({ length: n }, (_, i) => ({
            id: `s.t.c${i}`,
          }));
          setup({ testRule: jest.fn(() => of({ matches: ids })) });
          type('c');
          tick(300);
          f.detectChanges();
          const preview = q('dm-rule-preview')!;
          expect(preview.querySelectorAll('.ids code')).toHaveLength(shown);
          expect(
            preview.querySelector('.more')?.textContent?.trim() ?? ''
          ).toBe(more);
        })()
    );

    it(
      'the preview stays empty until the sentence has a term',
      fa(() => {
        setup();
        const preview = q('dm-rule-preview')!;
        expect(preview.textContent!.trim()).toBe('');
        type('ssn');
        tick(300);
        f.detectChanges();
        expect(preview.textContent).toContain('Matches 0 columns');
        type('');
        tick(300);
        f.detectChanges();
        expect(preview.textContent!.trim()).toBe('');
      })
    );

    it(
      'focus starts in the term input',
      fa(() => {
        setup();
        expect(input().hasAttribute('cdkFocusInitial')).toBe(true);
      })
    );
  });
});
