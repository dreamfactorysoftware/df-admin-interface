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
 * A derived view over the role graph: every role is a row, GET/POST/PUT/PATCH/
 * DELETE are the columns, and each cell is a df-badge-like dot colored from
 * tokens — `--df-success` (full), `--df-warning` (row/field filtered),
 * `--df-text-muted` (none). Clicking a granted cell emits {roleId, verb} so the
 * host can open the existing df-role-scope editor in a dialog. Tokens only, so
 * it stays legible in light, dark, and phosphor.
 */
@Component({
  selector: 'df-scope-matrix',
  standalone: true,
  templateUrl: './df-scope-matrix.component.html',
  styleUrls: ['./df-scope-matrix.component.scss'],
  imports: [
    CommonModule,
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
  rows: ScopeMatrixRoleRow[] = [];
  loading = false;

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
      });
  }

  cellState(row: ScopeMatrixRoleRow, verb: ScopeVerb): CellState {
    return row.verbs[verb];
  }
}
