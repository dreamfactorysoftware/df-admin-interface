import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';

/** UI mode: assemble conditions, or hand-write the raw string. */
export type FilterMode = 'visual' | 'raw';

/** How a chosen operator consumes its value slot. */
type OperatorArity = 'binary' | 'list' | 'unary';

interface FilterOperator {
  /** Emitted verbatim into the compiled filter (DreamFactory SQL-like syntax). */
  value: string;
  /** i18n label key under `filterBuilder.op`. */
  labelKey: string;
  arity: OperatorArity;
  /** Wraps the value with SQL wildcards before quoting (contains / starts / ends). */
  wrap?: 'both' | 'start' | 'end';
}

/** One visual-builder row. */
interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

const NUMERIC = /^-?\d+(\.\d+)?$/;
const BOOLEAN = /^(true|false)$/i;

/**
 * df-filter-builder — a visual/raw toggle for DreamFactory `?filter=` strings.
 *
 * Two ways in, one string out: a `mat-button-toggle` flips between a visual
 * builder (field `mat-select` + operator `mat-select` + value input, one row per
 * condition, joined by a single AND/OR conjunction) and a raw filter textarea.
 * Both paths compile to the identical filter string that `@Output filterChange`
 * emits, so the host can drop it straight into `?filter=` on the live snippet and
 * the df-try-it console.
 *
 * Field options come from the real table schema when the host passes `fields`;
 * with no schema the field slot degrades to a free-text input, so the builder is
 * useful on any path. Tokens only, transloco i18n, phosphor-safe.
 */
@Component({
  selector: 'df-filter-builder',
  standalone: true,
  templateUrl: './df-filter-builder.component.html',
  styleUrls: ['./df-filter-builder.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    TranslocoModule,
  ],
})
export class DfFilterBuilderComponent {
  /** Column names from the introspected table schema. Empty = free-text field. */
  @Input() fields: string[] = [];

  /** Seed value. Lands in the raw box and, if it looks compiled, the preview. */
  @Input() set filter(value: string | undefined) {
    const next = value ?? '';
    if (next === this._lastEmitted) {
      return;
    }
    this.rawFilter = next;
  }

  /** Emits the compiled filter string on every edit. Supports `[(filter)]`. */
  @Output() filterChange = new EventEmitter<string>();

  mode: FilterMode = 'visual';
  conjunction: 'and' | 'or' = 'and';
  conditions: FilterCondition[] = [this.blankCondition()];
  rawFilter = '';

  private _lastEmitted = '';

  readonly operators: FilterOperator[] = [
    { value: '=', labelKey: 'eq', arity: 'binary' },
    { value: '!=', labelKey: 'neq', arity: 'binary' },
    { value: '>', labelKey: 'gt', arity: 'binary' },
    { value: '>=', labelKey: 'gte', arity: 'binary' },
    { value: '<', labelKey: 'lt', arity: 'binary' },
    { value: '<=', labelKey: 'lte', arity: 'binary' },
    { value: 'like', labelKey: 'like', arity: 'binary' },
    { value: 'contains', labelKey: 'contains', arity: 'binary', wrap: 'both' },
    {
      value: 'starts with',
      labelKey: 'startsWith',
      arity: 'binary',
      wrap: 'start',
    },
    { value: 'ends with', labelKey: 'endsWith', arity: 'binary', wrap: 'end' },
    { value: 'in', labelKey: 'in', arity: 'list' },
    { value: 'not in', labelKey: 'notIn', arity: 'list' },
    { value: 'is null', labelKey: 'isNull', arity: 'unary' },
    { value: 'is not null', labelKey: 'isNotNull', arity: 'unary' },
  ];

  // ---- mode -----------------------------------------------------------------

  onModeChange(mode: FilterMode): void {
    // Visual -> raw hands the compiled string over so the raw box starts where
    // the builder left off, instead of blanking the user's work.
    if (mode === 'raw' && !this.rawFilter.trim()) {
      this.rawFilter = this.compile();
    }
    this.mode = mode;
    this.emit();
  }

  // ---- visual builder -------------------------------------------------------

  arityOf(operator: string): OperatorArity {
    return this.operators.find(o => o.value === operator)?.arity ?? 'binary';
  }

  addCondition(): void {
    this.conditions.push(this.blankCondition());
  }

  removeCondition(index: number): void {
    this.conditions.splice(index, 1);
    if (!this.conditions.length) {
      this.conditions.push(this.blankCondition());
    }
    this.emit();
  }

  clear(): void {
    this.conditions = [this.blankCondition()];
    this.rawFilter = '';
    this.emit();
  }

  private blankCondition(): FilterCondition {
    return { field: '', operator: '=', value: '' };
  }

  // ---- compilation ----------------------------------------------------------

  /** The string flowing into `?filter=`, from whichever mode is active. */
  get currentFilter(): string {
    return this.mode === 'raw' ? this.rawFilter.trim() : this.compile();
  }

  /** Visual conditions -> a single DreamFactory filter string. */
  compile(): string {
    const parts = this.conditions
      .map(c => this.compileCondition(c))
      .filter((s): s is string => s !== null);
    if (!parts.length) {
      return '';
    }
    return parts.join(this.conjunction === 'or' ? ' or ' : ' and ');
  }

  private compileCondition(c: FilterCondition): string | null {
    const field = c.field?.trim();
    if (!field || !c.operator) {
      return null;
    }
    const meta = this.operators.find(o => o.value === c.operator);
    const op = c.operator;

    if (meta?.arity === 'unary') {
      return `(${field} ${op})`;
    }

    const raw = (c.value ?? '').trim();
    if (!raw) {
      return null;
    }

    if (meta?.arity === 'list') {
      const items = raw
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length)
        .map(v => this.quote(v))
        .join(', ');
      return items ? `(${field} ${op} (${items}))` : null;
    }

    if (meta?.wrap) {
      const wrapped =
        meta.wrap === 'both'
          ? `%${raw}%`
          : meta.wrap === 'start'
            ? `${raw}%`
            : `%${raw}`;
      // contains / starts with / ends with are LIKE sugar in the emitted string.
      return `(${field} like ${this.quote(wrapped)})`;
    }

    return `(${field} ${op} ${this.quote(raw)})`;
  }

  /** Quote a scalar unless it is plainly numeric or boolean. SQL single-quote
   *  escaping (double the quote) keeps injected apostrophes from breaking out. */
  private quote(value: string): string {
    if (NUMERIC.test(value) || BOOLEAN.test(value)) {
      return value;
    }
    return `'${value.replace(/'/g, "''")}'`;
  }

  // ---- emit -----------------------------------------------------------------

  emit(): void {
    const next = this.currentFilter;
    this._lastEmitted = next;
    this.filterChange.emit(next);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
