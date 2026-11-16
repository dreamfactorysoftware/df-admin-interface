import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import {
  CellState,
  DfScopeService,
  ScopeMatrixRoleRow,
  ScopeVerb,
  SCOPE_VERBS,
} from 'src/app/shared/services/df-scope.service';

/**
 * df-scope-matrix — the roles x verbs grid for one service.
 *
 * A derived view over the role graph: a role is a row, GET/POST/PUT/PATCH/
 * DELETE are the columns, and each cell is a df-badge-like dot colored from
 * tokens — `--df-success` (full), `--df-warning` (row/field filtered),
 * `--df-text-muted` (none). Clicking a granted cell emits {roleId, verb} so the
 * host can open the existing df-role-scope editor in a dialog. Tokens only, so
 * it stays legible in light, dark, and phosphor.
 *
 * The grid stays the same size however many roles the instance has: roles
 * that reach the service are listed by default ("all roles" shows the rest,
 * to prove absence of access), a search finds one role by name in either
 * view, rows scroll inside a fixed-height well, and only one page of rows is
 * in the DOM at a time. Short lists render as a plain grid with none of that.
 */
@Component({
  selector: 'df-scope-matrix',
  standalone: true,
  templateUrl: './df-scope-matrix.component.html',
  styleUrls: ['./df-scope-matrix.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TranslocoModule,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
})
export class DfScopeMatrixComponent implements OnChanges, OnDestroy {
  /** The service whose access grid to derive and render. */
  @Input() serviceId?: number | null;

  /** Emits when a cell is activated; hosts open df-role-scope in a dialog. */
  @Output() cellClick = new EventEmitter<{ roleId: number; verb: ScopeVerb }>();

  readonly verbs = SCOPE_VERBS;
  /** Every role, one row each. */
  rows: ScopeMatrixRoleRow[] = [];
  /** The rows with at least one verb granted on this service. */
  reachingRows: ScopeMatrixRoleRow[] = [];
  /** What the grid renders after the view, the query and the page window. */
  visibleRows: ScopeMatrixRoleRow[] = [];
  hiddenCount = 0;
  loading = false;
  query = '';
  showAll = false;
  /** Rows rendered per page; "Show N more" adds another page. */
  readonly pageSize = 60;
  /** Lists at or under this size render as a plain grid without controls. */
  readonly searchThreshold = 12;

  private shown = this.pageSize;
  private matches: ScopeMatrixRoleRow[] = [];

  private destroy$ = new Subject<void>();

  constructor(private scope: DfScopeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('serviceId' in changes) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get searchable(): boolean {
    return this.rows.length > this.searchThreshold;
  }

  get nextPage(): number {
    return Math.min(this.hiddenCount, this.pageSize);
  }

  /** Transloco key for the one-line status under the grid; '' when the grid shows everything. */
  get statusKey(): string {
    if (this.query) {
      return this.matches.length === 0 ? 'noMatch' : '';
    }
    if (!this.showAll && this.reachingRows.length === 0) {
      return 'noneReach';
    }
    return this.hiddenCount > 0 ? 'shownOf' : '';
  }

  get statusParams(): Record<string, unknown> {
    return {
      query: this.query,
      shown: this.visibleRows.length,
      total: this.matches.length,
    };
  }

  onQuery(q: string): void {
    this.query = q ?? '';
    this.shown = this.pageSize;
    this.recompute();
  }

  setShowAll(all: boolean): void {
    this.showAll = all;
    this.shown = this.pageSize;
    this.recompute();
  }

  showMore(): void {
    this.shown += this.pageSize;
    this.recompute();
  }

  onCellClick(row: ScopeMatrixRoleRow, verb: ScopeVerb): void {
    if (row.verbs[verb] === 'none') {
      return;
    }
    this.cellClick.emit({ roleId: row.roleId, verb });
  }

  trackByRoleId(_: number, row: ScopeMatrixRoleRow): number {
    return row.roleId;
  }

  trackByVerb(_: number, verb: ScopeVerb): string {
    return verb;
  }

  private load(): void {
    const id = this.serviceId;
    this.rows = [];
    this.reachingRows = [];
    this.visibleRows = [];
    this.hiddenCount = 0;
    if (id === null || id === undefined) {
      return;
    }
    this.loading = true;
    this.scope
      .matrixForService(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(matrix => {
        this.loading = false;
        this.rows = matrix.roles;
        this.reachingRows = this.rows.filter(row =>
          this.verbs.some(v => row.verbs[v] !== 'none')
        );
        this.shown = this.pageSize;
        this.recompute();
      });
  }

  /** A query searches every role, whichever view is on, so one role can
   *  always be found by name; without a query the view decides the base. */
  private recompute(): void {
    const q = this.query.trim().toLowerCase();
    const base = q || this.showAll ? this.rows : this.reachingRows;
    this.matches = q
      ? base.filter(row => row.roleName.toLowerCase().includes(q))
      : base;
    this.visibleRows = this.matches.slice(0, this.shown);
    this.hiddenCount = this.matches.length - this.visibleRows.length;
  }

  cellState(row: ScopeMatrixRoleRow, verb: ScopeVerb): CellState {
    return row.verbs[verb];
  }
}
