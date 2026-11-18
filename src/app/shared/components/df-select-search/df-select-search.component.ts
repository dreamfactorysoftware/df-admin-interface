import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Pipe,
  PipeTransform,
  ViewChild,
  inject,
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { fromEvent } from 'rxjs';

export interface SelectSearchType {
  /** First path segment plus slash, e.g. `_table/`. */
  prefix: string;
  /** Raw segment, shown when there is no friendly label. */
  label: string;
  labelKey?: string;
}

const TYPE_LABEL_KEYS: Record<string, string> = {
  _schema: 'selectSearch.schema',
  _table: 'selectSearch.table',
  _func: 'selectSearch.function',
  _proc: 'selectSearch.procedure',
};

/**
 * Types for a component list: one per distinct first path segment
 * (`_table/orders/` -> `_table/`), so DB, file and system services all work.
 */
export function componentTypes(components: string[]): SelectSearchType[] {
  const segments = new Set(
    components.filter(c => c.includes('/')).map(c => c.split('/')[0])
  );
  return [...segments].map(label => ({
    prefix: `${label}/`,
    label,
    labelKey: TYPE_LABEL_KEYS[label],
  }));
}

/**
 * Narrows an option list by a case-insensitive substring and an optional
 * prefix (type). `key` reads a label off object items. Wildcards stay listed
 * whatever the query: `''` and `*` with no type, `<type>` and `<type>*` within one.
 *   *ngFor="let o of options | dfSearch: search.query : search.type : 'name'"
 */
@Pipe({ name: 'dfSearch', standalone: true })
export class DfSearchPipe implements PipeTransform {
  transform<T>(items: T[] | null, query = '', type = '', key?: string): T[] {
    const q = (query || '').trim().toLowerCase();
    if (!items || (!q && !type)) return items || [];
    return items.filter(item => {
      const label = String(
        (key ? (item as Record<string, unknown>)?.[key] : item) ?? ''
      );
      if (!label.startsWith(type)) return false;
      const rest = label.slice(type.length);
      return rest === '' || rest === '*' || rest.toLowerCase().includes(q);
    });
  }
}

/**
 * Search box (plus optional type dropdown) for the top of a single-select
 * `mat-select` panel. Arrow keys, Enter and Tab fall through to the select;
 * Esc clears the query first, then closes. Pair it with `DfSearchPipe`:
 *
 *   <mat-select>
 *     <df-select-search #s [types]="types"></df-select-search>
 *     <mat-option *ngFor="let o of options | dfSearch: s.query : s.type">
 */
// ponytail: single-select only. In `multiple` mode mat-select drops selected
// options that are filtered out of the DOM; keep them rendered before using it there.
@UntilDestroy()
@Component({
  selector: 'df-select-search',
  standalone: true,
  imports: [NgIf, NgFor, TranslocoPipe],
  template: `
    <div class="df-select-search">
      <select
        *ngIf="types?.length"
        [value]="type"
        [attr.aria-label]="'selectSearch.type' | transloco"
        (change)="setType($any($event.target).value)"
        (keydown)="$event.stopPropagation()">
        <option value="">{{ 'selectSearch.all' | transloco }}</option>
        <option
          *ngFor="let t of types"
          [value]="t.prefix"
          [selected]="t.prefix === type">
          {{ t.labelKey ? (t.labelKey | transloco) : t.label }}
        </option>
      </select>
      <input
        #input
        type="search"
        autocomplete="off"
        [value]="query"
        [placeholder]="'search' | transloco"
        [attr.aria-label]="'search' | transloco"
        (input)="setQuery(input.value)"
        (keydown)="onKeydown($event)" />
    </div>
  `,
  styles: [
    `
      .df-select-search {
        position: sticky;
        top: -8px;
        z-index: 1;
        margin-top: -8px;
        padding: 8px 12px;
        display: flex;
        gap: 8px;
        background: var(--mat-select-panel-background-color, inherit);
        border-bottom: 1px solid rgba(127, 127, 127, 0.25);
      }
      input,
      select {
        font: inherit;
        color: inherit;
        background: transparent;
        border: 1px solid rgba(127, 127, 127, 0.4);
        border-radius: 4px;
        padding: 6px 8px;
      }
      input {
        flex: 1;
        min-width: 0;
      }
      select option {
        color: initial;
      }
    `,
  ],
})
export class DfSelectSearchComponent implements OnInit {
  private _types?: SelectSearchType[];
  @Input() set types(types: SelectSearchType[] | undefined) {
    this._types = types;
    // A different service may not have the type that was picked before.
    if (!types?.some(t => t.prefix === this.type)) this.type = '';
  }
  get types(): SelectSearchType[] | undefined {
    return this._types;
  }
  @ViewChild('input', { static: true }) input: ElementRef<HTMLInputElement>;

  query = '';
  type = '';
  private select = inject(MatSelect);

  ngOnInit(): void {
    this.select.openedChange
      .pipe(untilDestroyed(this))
      .subscribe((open: boolean) => {
        if (open) this.input.nativeElement.focus();
        else this.query = ''; // show the chosen value again on the trigger
      });

    // Typing on the select itself (tabbed in while closed, or in the moment
    // before the panel opens) would trigger mat-select's jump-to-option
    // typeahead. Send those keys to the search box instead.
    fromEvent<KeyboardEvent>(this.select._elementRef.nativeElement, 'keydown', {
      capture: true,
    })
      .pipe(untilDestroyed(this))
      .subscribe(event => {
        const printable =
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey;
        if (!printable || this.select.disabled) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.setQuery(this.query + event.key);
        if (!this.select.panelOpen) this.select.open();
      });
  }

  setQuery(query: string): void {
    this.query = query;
    this.activateFirst();
  }

  setType(type: string): void {
    this.type = type;
    this.activateFirst();
    this.input.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.query) {
      this.setQuery('');
      event.stopPropagation();
    } else if (
      !['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(event.key)
    ) {
      // Keep typing (space, Home/End, letters) out of mat-select's typeahead.
      event.stopPropagation();
    }
  }

  // Wait for the filtered options to render, then highlight the first real
  // match (not a pinned wildcard) so typing + Enter picks what was searched.
  private activateFirst(): void {
    setTimeout(() => {
      const q = this.query.trim().toLowerCase();
      const options = this.select.options.toArray();
      const match = options.findIndex(
        o => !!q && o.viewValue.toLowerCase().includes(q)
      );
      this.select._keyManager?.setActiveItem(Math.max(match, 0));
    });
  }
}
