import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Observable, Subject, Subscription, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs/operators';

export type PickerId = number | string;

export interface PickerItem {
  id: PickerId;
  /** Chip text. Hosts pass the unique name here, not a display label. */
  label: string;
  /** Shown as the chip's tooltip. */
  hint?: string;
  /** Extra text the search also matches, e.g. a service's display label. */
  keywords?: string;
}

/**
 * df-picker-list — a chip picker that stays the same size however many
 * records the instance has.
 *
 * The df-ai-* pickers used to fetch a whole collection and render one chip
 * per record straight into the form, so a page with a few hundred roles grew
 * by thousands of pixels. This component bounds the picker three ways:
 *
 *  - the chip list scrolls inside a fixed max-height;
 *  - only `pageSize` chips are in the DOM at a time ("Show N more" renders
 *    the next page), so a 1,000-row collection does not cost 1,000 nodes;
 *  - a search box narrows the list in place. When the host could only load
 *    part of the collection (`truncated`), the search also goes to the
 *    server through `remoteSearch`, so a record past the load cap can still
 *    be found and picked.
 *
 * Items that were selected when the list was loaded (or re-queried) sit at
 * the top; toggling a chip never moves it, so nothing jumps under the cursor.
 *
 * The search box is hidden for short lists so a picker with a handful of
 * options reads exactly as it did before.
 */
@Component({
  selector: 'df-picker-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  template: `
    <div class="picker" [attr.data-testid]="testId">
      <label
        *ngIf="searchable"
        class="picker__search"
        [attr.data-testid]="testId + '-search'">
        <fa-icon
          [icon]="faMagnifyingGlass"
          class="picker__search-icon"></fa-icon>
        <input
          type="search"
          autocomplete="off"
          [ngModel]="query"
          (ngModelChange)="onQuery($event)"
          [placeholder]="placeholder"
          [attr.aria-label]="placeholder" />
        <button
          *ngIf="query"
          type="button"
          class="picker__clear"
          aria-label="Clear search"
          (click)="onQuery('')">
          <fa-icon [icon]="faXmark"></fa-icon>
        </button>
      </label>

      <p
        *ngIf="status"
        class="picker__status"
        [attr.data-testid]="testId + '-status'">
        {{ status }}
      </p>

      <div *ngIf="loading" class="picker__muted">Loading {{ noun }}…</div>

      <ul
        *ngIf="!loading && visible.length > 0"
        class="picker__list"
        [class.picker__list--bounded]="searchable"
        [attr.data-testid]="testId + '-list'">
        <li *ngFor="let it of visible; trackBy: trackById">
          <button
            type="button"
            class="picker__chip"
            [class.picker__chip--selected]="isSelected(it.id)"
            [attr.aria-pressed]="isSelected(it.id)"
            [attr.title]="it.hint || null"
            [attr.data-testid]="testId + '-item'"
            [attr.data-id]="it.id"
            (click)="toggle.emit(it.id)">
            <fa-icon
              *ngIf="isSelected(it.id)"
              [icon]="faCircleCheck"
              class="picker__check"></fa-icon>
            <span class="picker__label">{{ it.label }}</span>
          </button>
          <a
            *ngIf="itemLink && itemLinkLabel"
            [routerLink]="itemLink(it)"
            class="picker__link"
            >{{ itemLinkLabel }}</a
          >
        </li>
        <li *ngIf="hiddenCount > 0" class="picker__more">
          <button
            type="button"
            class="picker__more-btn"
            [attr.data-testid]="testId + '-more'"
            (click)="showMore()">
            Show {{ nextPage }} more
          </button>
        </li>
      </ul>

      <p
        *ngIf="!loading && query && visible.length === 0"
        class="picker__muted"
        [attr.data-testid]="testId + '-nomatch'">
        {{
          searching ? 'Searching…' : 'No ' + noun + ' match “' + query + '”.'
        }}
      </p>
    </div>
  `,
  styles: [
    `
      /* Token-only chrome, so light, dark and phosphor themes come free and
         the picker reads as one product with the other df-ai-* surfaces. */
      .picker {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        font-size: 1.4rem;
        color: var(--df-text);

        &__search {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          max-width: 36rem;
          padding: 0 0.875rem;
          min-height: 38px;
          background: var(--df-surface);
          border: 1px solid var(--df-border);
          border-radius: var(--df-radius-sm);
          cursor: text;

          &:focus-within {
            border-color: var(--df-accent);
          }

          input {
            flex: 1;
            min-width: 0;
            border: 0;
            background: transparent;
            font: inherit;
            color: inherit;
            outline: none;

            &::placeholder {
              color: var(--df-text-muted);
            }
            &::-webkit-search-cancel-button {
              display: none;
            }
          }
        }

        &__search-icon {
          color: var(--df-text-muted);
        }

        &__clear {
          display: inline-flex;
          padding: 0.25rem;
          border: 0;
          background: transparent;
          color: var(--df-text-muted);
          cursor: pointer;
          font-size: inherit;

          &:hover {
            color: var(--df-text);
          }
        }

        &__status,
        &__muted {
          margin: 0;
          font-size: 1.3rem;
          color: var(--df-text-muted);
        }

        &__muted {
          font-style: italic;
        }

        &__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
          gap: 0.625rem 0.75rem;

          li {
            display: inline-flex;
            align-items: center;
            gap: 0.625rem;
          }

          /* The bound that keeps the page the same height at 10 or 1,000
             records. The scroll area is the memorable part of this picker;
             everything else stays quiet. */
          &--bounded {
            max-height: 264px;
            overflow-y: auto;
            overscroll-behavior: contain;
            padding: 0.75rem;
            background: var(--df-surface);
            border: 1px solid var(--df-border-2);
            border-radius: var(--df-radius-sm);
          }
        }

        &__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--df-surface);
          border: 1px solid var(--df-border);
          border-radius: var(--df-radius-sm);
          font: inherit;
          font-size: 1.4rem;
          color: inherit;
          cursor: pointer;
          transition:
            border-color 120ms ease,
            background 120ms ease;

          &:hover {
            border-color: var(--df-accent);
            background: var(--df-hover);
          }

          &:focus-visible {
            outline: 2px solid var(--df-accent);
            outline-offset: 2px;
          }

          &--selected {
            border-color: var(--df-accent);
            background: var(--df-accent-soft);
            color: var(--df-text);
          }
        }

        &__check {
          color: var(--df-accent);
        }

        &__label {
          font-weight: 500;
        }

        &__link {
          font-size: 1.2rem;
          color: var(--df-text-muted);
          text-decoration: none;

          &:hover {
            color: var(--df-accent);
            text-decoration: underline;
          }
        }

        &__more {
          flex-basis: 100%;
        }

        &__more-btn {
          padding: 0.5rem 1rem;
          border: 1px dashed var(--df-border);
          border-radius: var(--df-radius-sm);
          background: transparent;
          font: inherit;
          font-size: 1.3rem;
          color: var(--df-text-2);
          cursor: pointer;

          &:hover {
            border-color: var(--df-accent);
            color: var(--df-text);
          }
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .picker__chip {
          transition: none;
        }
      }
    `,
  ],
})
export class DfPickerListComponent implements OnInit, OnChanges, OnDestroy {
  /** Everything the host managed to load, already filtered to what may be picked. */
  @Input({ required: true }) items: PickerItem[] = [];
  /** Ids currently picked. The host owns the selection; `toggle` asks it to change. */
  @Input() selected: PickerId[] = [];
  @Input() loading = false;
  /** Plural noun for copy: "roles", "data services". */
  @Input() noun = 'items';
  /** True when the host could only load part of the collection. The status
   *  line says so and a query is also sent to `remoteSearch`. */
  @Input() truncated = false;
  /** Server-side search used while `truncated`; returns matching items. */
  @Input() remoteSearch?: (query: string) => Observable<PickerItem[]>;
  /** Chips rendered per page; "Show N more" adds another page. */
  @Input() pageSize = 60;
  /** Lists at or under this size render without a search box. */
  @Input() searchThreshold = 12;
  @Input() searchPlaceholder?: string;
  /** Optional secondary link after each chip (e.g. "what can this role see?"). */
  @Input() itemLink?: (item: PickerItem) => unknown[];
  @Input() itemLinkLabel = '';
  @Input() testId = 'picker';

  @Output() toggle = new EventEmitter<PickerId>();

  query = '';
  searching = false;
  visible: PickerItem[] = [];
  hiddenCount = 0;

  faMagnifyingGlass = faMagnifyingGlass;
  faXmark = faXmark;
  faCircleCheck = faCircleCheck;

  private shown = 0;
  private pinned = new Set<PickerId>();
  private remote: PickerItem[] | null = null;
  private matches: PickerItem[] = [];
  private query$ = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.query$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(q => {
          const useRemote = this.truncated && !!this.remoteSearch && !!q.trim();
          if (!useRemote) {
            return of(null as PickerItem[] | null);
          }
          this.searching = true;
          return this.remoteSearch!(q.trim()).pipe(
            catchError(() => of([] as PickerItem[]))
          );
        }),
        tap(() => (this.searching = false))
      )
      .subscribe(remote => {
        this.remote = remote;
        this.recompute();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['pageSize']) {
      this.pin();
      this.shown = this.pageSize;
    }
    this.recompute();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get searchable(): boolean {
    return this.truncated || this.items.length > this.searchThreshold;
  }

  get placeholder(): string {
    return this.searchPlaceholder ?? `Search ${this.noun}…`;
  }

  get nextPage(): number {
    return Math.min(this.hiddenCount, this.pageSize);
  }

  /** One short line about what the list is not showing; empty when it shows everything. */
  get status(): string {
    if (this.loading) return '';
    if (this.query) {
      if (this.searching) return 'Searching…';
      if (this.matches.length === 0) return '';
      return `${this.matches.length} ${this.noun} match`;
    }
    if (this.truncated) {
      return `Showing the first ${this.items.length} ${this.noun} only. Search to find the rest.`;
    }
    if (this.hiddenCount > 0) {
      return `${this.visible.length} of ${this.items.length} ${this.noun} shown`;
    }
    return '';
  }

  isSelected(id: PickerId): boolean {
    return this.selected.includes(id);
  }

  onQuery(q: string): void {
    this.query = q ?? '';
    this.shown = this.pageSize;
    this.pin();
    this.remote = null;
    this.recompute();
    this.query$.next(this.query);
  }

  showMore(): void {
    this.shown += this.pageSize;
    this.recompute();
  }

  trackById(_: number, it: PickerItem): PickerId {
    return it.id;
  }

  /** Snapshot the selection so selected chips lead the list without moving on toggle. */
  private pin(): void {
    this.pinned = new Set(this.selected);
  }

  private recompute(): void {
    const q = this.query.trim().toLowerCase();
    const source = this.remote ?? this.items;
    const filtered = q
      ? source.filter(
          it =>
            it.label.toLowerCase().includes(q) ||
            (it.keywords ?? '').toLowerCase().includes(q)
        )
      : source;
    const lead = filtered.filter(it => this.pinned.has(it.id));
    const rest = filtered.filter(it => !this.pinned.has(it.id));
    this.matches = [...lead, ...rest];
    this.visible = this.matches.slice(0, this.shown);
    this.hiddenCount = this.matches.length - this.visible.length;
  }
}
