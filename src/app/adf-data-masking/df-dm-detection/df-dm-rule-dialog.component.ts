import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  debounceTime,
  of,
  switchMap,
} from 'rxjs';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { classesByTier } from '../data-masking.catalog';
import { DetectionRule } from '../data-masking.types';
import { DataMaskingStore, errorStatus } from '../data-masking.store';
import {
  MAX_PATTERN,
  RULE_OPS,
  RuleOp,
  RuleTarget,
  compileRule,
  describeRule,
  isLiteralOp,
  normalizeTerm,
  opAllowed,
} from '../rule-pattern';
import { isAppError, normalizeError } from 'src/app/shared/utilities/app-error';

export type RuleDraft = Pick<DetectionRule, 'match' | 'pattern' | 'class'>;

/** How the dialog saves: it stays open until this succeeds. */
export interface RuleDialogData {
  save: (draft: RuleDraft) => Observable<unknown>;
}

/**
 * Worth sending. Patterns are PCRE (atomic groups, possessive quantifiers,
 * inline flags, (?P<name>…)), which a JavaScript RegExp cannot judge, so
 * the server decides validity: the live preview shows its reason.
 */
export function validPattern(p: string): boolean {
  return !!p.trim() && p.length <= MAX_PATTERN;
}

/** Typed or pasted, these end a term. */
const SEPARATOR = /[,\t\r\n]/;
const SEPARATORS = /[,\t\r\n]+/;
/** Column names offered at most. */
const SUGGESTIONS = 8;
/** Ids the fixed-height preview has room for (or one fewer plus "and N more"). */
const PREVIEW_IDS = 5;

/**
 * Add rule, as a sentence: "Column name is emp_ssn or social_sec", "Column
 * values look like AB123456", mask as a class. The dialog writes the regex
 * (matches regex is one of the choices) and the live preview counts the
 * columns it would catch.
 */
@Component({
  selector: 'df-dm-rule-dialog',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    TextFieldModule,
    TranslocoPipe,
  ],
  templateUrl: './df-dm-rule-dialog.component.html',
  styleUrls: ['./df-dm-rule-dialog.component.scss'],
})
export class DfDmRuleDialogComponent implements OnInit, OnDestroy {
  private api = inject(DfDataMaskingApiService);
  private ref = inject(MatDialogRef<DfDmRuleDialogComponent, boolean>);
  private data = inject<RuleDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private transloco = inject(TranslocoService);
  /** The page's store: its columns feed "Column name is" suggestions. */
  private store = inject(DataMaskingStore, { optional: true });

  @ViewChild('termInput') private termInput?: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) private auto?: MatAutocompleteTrigger;
  @ViewChild(CdkTextareaAutosize) private autosize?: CdkTextareaAutosize;

  readonly groups = classesByTier();
  readonly maxPattern = MAX_PATTERN;

  target: RuleTarget = 'name';
  op: RuleOp = 'is';
  /** Committed terms (chips); format masks for look like. */
  terms: string[] = [];
  /** Typed and not committed yet. It counts, as if committed. */
  text = '';
  /** The regex operator's input. */
  regex = '';
  cls = '';
  /** Column names offered for what is typed (Column name is). */
  suggestions: string[] = [];

  preview: string[] | null = null;
  /** The server ran out of its sampling budget: the count is a floor. */
  partial = false;
  previewing = false;
  saving = false;
  /** The server's reason for refusing the rule, shown in place. */
  saveError: string | null = null;
  /** The server's reason the preview pattern does not compile. */
  testError: string | null = null;
  private test$ = new Subject<void>();
  private sub?: Subscription;
  /** Target and pattern last sent for a preview. */
  private tested = '';
  private names: { version: number; list: string[] } | null = null;

  ngOnInit(): void {
    this.sub = this.test$
      .pipe(
        debounceTime(250),
        switchMap(() => {
          const pattern = this.pattern;
          if (!validPattern(pattern)) return of(null);
          this.previewing = true;
          return this.api.testRule({ match: this.target, pattern }).pipe(
            catchError(e => {
              // A refused pattern says why, in place of a match count.
              this.testError = this.reason(e);
              return of(null);
            })
          );
        })
      )
      .subscribe(r => {
        this.previewing = false;
        if (r) this.testError = null;
        this.preview = r ? r.matches.map(m => m.id) : null;
        this.partial = !!r?.partial;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get ops(): readonly RuleOp[] {
    return RULE_OPS[this.target];
  }

  /** The chips plus what is still typed, as the rule will have them. */
  private get allTerms(): string[] {
    return this.withTerms(this.terms, [this.text]);
  }

  /** What the sentence compiles to: the only thing sent to the server. */
  get pattern(): string {
    return this.op === 'regex'
      ? compileRule(this.target, 'regex', this.regex)
      : compileRule(this.target, this.op, this.allTerms);
  }

  get draft(): RuleDraft {
    return { match: this.target, pattern: this.pattern, class: this.cls };
  }

  get invalid(): boolean {
    const p = this.pattern;
    return (!!p.trim() && !validPattern(p)) || !!this.testError;
  }

  /** What the preview area says is wrong, if anything. */
  get problem(): string | null {
    if (this.saveError) return this.saveError;
    if (this.testError) return this.testError;
    if (!this.invalid) return null;
    return this.t(this.op === 'regex' ? 'invalid' : 'tooMany');
  }

  get canSave(): boolean {
    return (
      validPattern(this.pattern) &&
      !this.testError &&
      !!this.cls &&
      !this.saving
    );
  }

  /** Suggestions only make sense for exact column names. */
  get suggestOn(): boolean {
    return this.target === 'name' && this.op === 'is' && !!this.store;
  }

  get targetLabel(): string {
    return this.t(this.target === 'name' ? 'matchName' : 'matchValue');
  }

  opLabel(op: RuleOp): string {
    return this.t(`ops.${this.target}.${op}`);
  }

  /** "Column name is": the accessible name of the term input. */
  get sentence(): string {
    return this.t('sentence', {
      target: this.targetLabel,
      op: this.opLabel(this.op),
    });
  }

  get example(): string {
    return this.t(`examples.${this.target}.${this.op}`);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(`dataMasking.detection.${key}`, params);
  }

  private reason(e: unknown): string {
    const err = isAppError(e) ? e : normalizeError(e);
    return this.transloco.translate(err.fields[0]?.message || err.message);
  }

  /** The ids the preview lists: all five, or four and "and N more". */
  get shownIds(): string[] {
    const ids = this.preview ?? [];
    return ids.slice(
      0,
      ids.length > PREVIEW_IDS ? PREVIEW_IDS - 1 : ids.length
    );
  }

  /** "1 column" / "4 columns". */
  columnsLabel(count: number): string {
    return this.transloco.translate(
      `dataMasking.plural.columns.${count === 1 ? 'one' : 'other'}`,
      { count }
    );
  }

  // ------------------------------------------------------------ sentence

  /**
   * Column name and Column values have different operators: contains and
   * starts with carry over with their terms, anything else starts again
   * (a format mask is never a name, a name is never a mask).
   */
  setTarget(target: RuleTarget): void {
    if (target === this.target) return;
    const keep = isLiteralOp(this.op) && opAllowed(target, this.op);
    this.target = target;
    if (!keep) {
      this.op = RULE_OPS[target][0];
      this.terms = [];
      this.text = '';
      this.regex = '';
    }
    this.changed();
  }

  /**
   * To regex: the input starts with what the chips compile to. From regex:
   * the chips come back when the pattern is one this dialog writes. Between
   * literal operators the terms stay; to or from look like they don't (a
   * mask is not text, and a typed example must not become a literal).
   */
  setOp(op: RuleOp): void {
    if (op === this.op) return;
    if (op === 'regex') {
      // An empty sentence keeps the regex typed before, if any.
      this.regex = this.pattern || this.regex;
      this.terms = [];
      this.text = '';
    } else if (this.op === 'regex') {
      const shape = describeRule(this.target, this.pattern);
      this.terms =
        shape.op !== 'regex' && isLiteralOp(shape.op) === isLiteralOp(op)
          ? shape.terms
          : [];
    } else if (isLiteralOp(op) !== isLiteralOp(this.op)) {
      this.terms = [];
      this.text = '';
    }
    this.op = op;
    this.changed();
    if (op === 'regex') this.fitRegex();
  }

  /** Add terms (split on commas and line breaks), skipping repeats. */
  private withTerms(list: string[], raw: string[]): string[] {
    const op = this.op;
    if (op === 'regex') return list;
    const out = [...list];
    // The server matches case-insensitively: SSN and ssn are one term.
    const seen = new Set(out.map(t => t.toLocaleLowerCase()));
    for (const piece of raw.flatMap(r => r.split(SEPARATORS))) {
      const term = normalizeTerm(op, piece);
      const key = term?.toLocaleLowerCase();
      if (term && key && !seen.has(key)) {
        out.push(term);
        seen.add(key);
      }
    }
    return out;
  }

  /** The typed text becomes chips. */
  commit(): void {
    if (!this.text) return;
    this.terms = this.allTerms;
    this.text = '';
    this.changed();
  }

  removeTerm(index: number): void {
    this.terms = this.terms.filter((_, i) => i !== index);
    this.changed();
    // The button is gone: keep focus in the field.
    this.termInput?.nativeElement.focus();
  }

  onKeydown(e: KeyboardEvent): void {
    // A highlighted suggestion is the autocomplete's to add.
    const picking = this.auto?.panelOpen && !!this.auto.activeOption;
    if (e.defaultPrevented || (e.key === 'Enter' && picking)) return;
    if (e.key === ',' || (e.key === 'Enter' && this.text.trim())) {
      // Enter in an empty input still submits the form.
      e.preventDefault();
      this.commit();
    } else if (e.key === 'Backspace' && !this.text && this.terms.length) {
      e.preventDefault();
      this.removeTerm(this.terms.length - 1);
    }
  }

  /** Pasting "a, b, c" makes three chips; a single term pastes as text. */
  onPaste(e: ClipboardEvent): void {
    const pasted = e.clipboardData?.getData('text') ?? '';
    if (!SEPARATOR.test(pasted)) return;
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const from = input.selectionStart ?? this.text.length;
    const to = input.selectionEnd ?? this.text.length;
    const raw = this.text.slice(0, from) + pasted + this.text.slice(to);
    this.terms = this.withTerms(this.terms, [raw]);
    this.text = '';
    this.changed();
  }

  /** Leaving the field commits what is typed (suggestions keep focus). */
  onBlur(): void {
    this.commit();
  }

  /**
   * The regex wraps over a few rows to stay readable, but it is one
   * pattern: line breaks (typed or pasted) are dropped.
   */
  setRegex(value: string): void {
    this.regex = value.replace(/[\r\n]+/g, '');
    this.changed();
    this.fitRegex();
  }

  /**
   * Autosize measures the textarea as it is created, before the row has
   * given it its width, and caches the placeholder's (then two-line)
   * height for good. Re-setting the placeholder drops that cache, so once
   * laid out a one-line pattern is one row.
   */
  private fitRegex(): void {
    setTimeout(() => {
      const autosize = this.autosize;
      if (!autosize) return;
      autosize.placeholder = this.example;
      autosize.resizeToFitContent(true);
    });
  }

  pick(e: MatAutocompleteSelectedEvent): void {
    this.terms = this.withTerms(this.terms, [String(e.option.value)]);
    this.text = '';
    this.changed();
  }

  /**
   * Pressing anywhere in the field (but a remove button) types into it,
   * without the input losing focus (which would commit what is typed).
   */
  focusTerms(e: MouseEvent): void {
    const input = this.termInput?.nativeElement;
    const target = e.target as HTMLElement;
    if (!input || target === input || target.closest('button')) return;
    e.preventDefault();
    input.focus();
  }

  private columnNames(): string[] {
    const store = this.store;
    if (!store) return [];
    if (this.names?.version !== store.version) {
      const byKey = new Map<string, string>();
      for (const c of store.allColumns()) {
        const key = c.column.toLocaleLowerCase();
        if (!byKey.has(key)) byKey.set(key, c.column);
      }
      const list = [...byKey.values()].sort((a, b) => a.localeCompare(b));
      this.names = { version: store.version, list };
    }
    return this.names.list;
  }

  private suggest(): void {
    const q = this.text.trim().toLocaleLowerCase();
    if (!this.suggestOn || !q) {
      this.suggestions = [];
      return;
    }
    const chosen = new Set(this.terms.map(t => t.toLocaleLowerCase()));
    const hits = this.columnNames().filter(n => {
      const key = n.toLocaleLowerCase();
      return key.includes(q) && !chosen.has(key);
    });
    // Names that start with what was typed come first.
    const rank = (n: string) => (n.toLocaleLowerCase().startsWith(q) ? 0 : 1);
    this.suggestions = hits
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, SUGGESTIONS);
  }

  /** Anything in the sentence changed: refresh suggestions and preview. */
  changed(): void {
    this.suggest();
    const key = `${this.target}\u0000${this.pattern}`;
    if (key === this.tested) return;
    this.tested = key;
    this.saveError = null;
    this.testError = null;
    if (!validPattern(this.pattern)) this.preview = null;
    this.test$.next();
  }

  save(): void {
    if (!this.canSave) return;
    if (this.op !== 'regex') this.commit();
    if (!this.data?.save) {
      this.ref.close(true);
      return;
    }
    this.saving = true;
    this.saveError = null;
    this.data.save(this.draft).subscribe({
      next: () => this.ref.close(true),
      error: e => {
        this.saving = false;
        // Not allowed (403): the store's toast carries the server's
        // message; the rule itself is fine, so nothing shows in place.
        this.saveError = errorStatus(e) === 403 ? null : this.reason(e);
      },
    });
  }
}
