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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelect } from '@angular/material/select';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface SelectSearchType {
  labelKey: string;
  prefix: string;
}

/** Role-access component prefixes, offered as type filters on endpoint lists. */
export const ENDPOINT_TYPES: SelectSearchType[] = [
  { labelKey: 'selectSearch.schema', prefix: '_schema/' },
  { labelKey: 'selectSearch.table', prefix: '_table/' },
  { labelKey: 'selectSearch.function', prefix: '_func/' },
  { labelKey: 'selectSearch.procedure', prefix: '_proc/' },
];

/** Wildcards (`*`, the service root `''`, `_table/`, `_table/*`) never get filtered out. */
const WILDCARD = /^([^/]*\/)?\*?$/;

/**
 * Narrows an option list by a case-insensitive substring and an optional
 * prefix (type). `key` reads a label off object items.
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
      return (
        WILDCARD.test(label) ||
        (label.startsWith(type) && label.toLowerCase().includes(q))
      );
    });
  }
}

/**
 * Search box (plus optional type toggles) for the top of a single-select
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
  imports: [NgIf, NgFor, MatButtonToggleModule, TranslocoPipe],
  template: `
    <div class="df-select-search">
      <mat-button-toggle-group
        *ngIf="types?.length"
        [value]="type"
        (change)="setType($event.value)"
        (keydown)="$event.stopPropagation()">
        <mat-button-toggle value="">{{
          'selectSearch.all' | transloco
        }}</mat-button-toggle>
        <mat-button-toggle *ngFor="let t of types" [value]="t.prefix">{{
          t.labelKey | transloco
        }}</mat-button-toggle>
      </mat-button-toggle-group>
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
        flex-direction: column;
        gap: 8px;
        background: var(--mat-select-panel-background-color, inherit);
        border-bottom: 1px solid rgba(127, 127, 127, 0.25);
      }
      input {
        font: inherit;
        color: inherit;
        background: transparent;
        border: 1px solid rgba(127, 127, 127, 0.4);
        border-radius: 4px;
        padding: 6px 8px;
      }
      mat-button-toggle-group {
        flex-wrap: wrap;
        font-size: 12px;
      }
      :host ::ng-deep .mat-button-toggle-label-content {
        padding: 0 8px;
        line-height: 28px;
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
