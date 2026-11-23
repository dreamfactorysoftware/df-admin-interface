import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { TABLE_PICKER_LIMIT, filterTables } from './semantic-catalog';

/**
 * df-semantic-table-picker: pick one table by typing part of its name.
 *
 * A mat-select rendered one option per table, which on a 1,000-table
 * database meant 1,000 DOM nodes per picker. This renders at most
 * TABLE_PICKER_LIMIT matches and says how many more there are.
 *
 * The value only changes when an option is chosen (or, on blur, when the
 * text is exactly a table name), so the editor does not reset dependent
 * fields or fetch `_schema/<partial>` on every keystroke. When the table
 * list could not be loaded (`tables` empty), it takes free text instead.
 */
@Component({
  selector: 'df-semantic-table-picker',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
  ],
  template: `
    <mat-form-field appearance="outline" class="sem-table-picker">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        type="text"
        autocomplete="off"
        spellcheck="false"
        [attr.data-testid]="testId"
        [name]="name"
        [required]="required"
        [disabled]="disabled"
        [ngModel]="query"
        (ngModelChange)="onQuery($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
        [matAutocomplete]="auto"
        [matAutocompleteDisabled]="!tables.length" />
      <mat-autocomplete
        #auto="matAutocomplete"
        (optionSelected)="onSelected($event)">
        <!-- mousedown keeps focus in the input, so blur does not commit the
             typed text before the option click lands. -->
        <mat-option
          *ngFor="let t of matches"
          [value]="t"
          (mousedown)="$event.preventDefault()"
          >{{ t }}</mat-option
        >
        <mat-option
          *ngIf="hidden > 0"
          disabled
          class="sem-table-picker__more"
          data-testid="semantic-table-picker-more">
          {{
            'services.semantic.picker.more'
              | transloco: { count: hidden, shown: limit }
          }}
        </mat-option>
        <mat-option *ngIf="!matches.length" disabled>
          {{ 'services.semantic.picker.none' | transloco: { query: query } }}
        </mat-option>
      </mat-autocomplete>
      <mat-hint *ngIf="!tables.length">{{
        'services.semantic.picker.freeText' | transloco
      }}</mat-hint>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sem-table-picker {
        width: 100%;
      }
    `,
  ],
})
export class DfSemanticTablePickerComponent implements OnChanges {
  /** Known table names; empty when they could not be loaded (free text). */
  @Input() tables: string[] = [];
  @Input() value = '';
  @Input() label = '';
  @Input() name = 'table';
  @Input() required = false;
  @Input() disabled = false;
  @Input() testId = 'semantic-table-picker';
  @Input() limit = TABLE_PICKER_LIMIT;
  @Output() valueChange = new EventEmitter<string>();

  query = '';
  matches: string[] = [];
  hidden = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) this.query = this.value ?? '';
    this.refilter();
  }

  onQuery(q: string) {
    this.query = q ?? '';
    this.refilter();
  }

  onSelected(event: MatAutocompleteSelectedEvent) {
    this.set(event.option.value);
  }

  /**
   * Blur or Enter: keep the text if it names a table (any case), take it as
   * is when the list is unknown, and otherwise go back to the last value.
   */
  commit() {
    const q = this.query.trim();
    if (q === (this.value ?? '')) return;
    if (!q) {
      this.set('');
      return;
    }
    if (!this.tables.length) {
      this.set(q);
      return;
    }
    const hit = this.tables.find(t => t.toLowerCase() === q.toLowerCase());
    if (hit) this.set(hit);
    else this.onQuery(this.value ?? '');
  }

  private set(v: string) {
    this.query = v;
    this.refilter();
    if (v !== (this.value ?? '')) {
      this.value = v;
      this.valueChange.emit(v);
    }
  }

  private refilter() {
    // A committed value lists everything again, so the panel is a browser
    // (first page) rather than one exact match.
    const q = this.query === this.value ? '' : this.query;
    const { matches, hidden } = filterTables(this.tables ?? [], q, this.limit);
    this.matches = matches;
    this.hidden = hidden;
  }
}
