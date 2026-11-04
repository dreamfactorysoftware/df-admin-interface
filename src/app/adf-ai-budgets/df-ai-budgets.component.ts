import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faCircleInfo,
  faPenToSquare,
  faPlus,
  faScaleBalanced,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import { DfConfirmDialogComponent } from 'src/app/shared/components/df-confirm-dialog/df-confirm-dialog.component';
import {
  DfSearchPipe,
  DfSelectSearchComponent,
} from 'src/app/shared/components/df-select-search/df-select-search.component';
import { ROUTES } from 'src/app/shared/types/routes';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { formatUSD } from '../adf-ai-usage/utils/cost';
import {
  Budget,
  BudgetDimension,
  BudgetForm,
  BudgetsService,
  SCOPE_LABELS,
  ScopeOption,
  budgetPayload,
  budgetToForm,
  emptyBudgetForm,
} from './budgets.service';

@Component({
  selector: 'df-ai-budgets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    FontAwesomeModule,
    DfSearchPipe,
    DfSelectSearchComponent,
  ],
  templateUrl: './df-ai-budgets.component.html',
  styleUrls: ['./df-ai-budgets.component.scss'],
})
export class DfAiBudgetsComponent implements OnInit {
  private api = inject(BudgetsService);
  private dialog = inject(MatDialog);

  readonly faArrowsRotate = faArrowsRotate;
  readonly faCircleInfo = faCircleInfo;
  readonly faPenToSquare = faPenToSquare;
  readonly faPlus = faPlus;
  readonly faScaleBalanced = faScaleBalanced;
  readonly faTrash = faTrash;

  readonly usageLink = `/${ROUTES.AI}/${ROUTES.AI_USAGE}`;
  readonly formatUsd = formatUSD;
  readonly scopeTypes = Object.keys(SCOPE_LABELS) as BudgetDimension[];
  readonly scopeLabels = SCOPE_LABELS;
  readonly periods = ['monthly', 'daily', 'hourly'];

  loading = true;
  saving = false;
  errorMessage: string | null = null;
  formError: string | null = null;
  budgets: Budget[] = [];
  usageLoggingEnabled = true;
  form: BudgetForm | null = null;
  scopeOptions: ScopeOption[] = [];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: list => {
          this.budgets = list.resource;
          this.usageLoggingEnabled = list.usage_logging_enabled;
        },
        error: err => (this.errorMessage = normalizeError(err).message),
      });
  }

  scopeText(budget: Budget): string {
    if (budget.dimension_type === 'global') {
      return SCOPE_LABELS.global;
    }
    const name = budget.dimension_name ?? `deleted #${budget.dimension_id}`;
    return `${SCOPE_LABELS[budget.dimension_type]}: ${name}`;
  }

  percent(budget: Budget): number {
    return budget.utilization * 100;
  }

  openCreate(): void {
    this.form = emptyBudgetForm();
    this.formError = null;
    this.loadScopeOptions();
  }

  openEdit(budget: Budget): void {
    this.form = budgetToForm(budget);
    this.formError = null;
    this.loadScopeOptions();
  }

  closeForm(): void {
    this.form = null;
  }

  onScopeTypeChange(): void {
    if (this.form) {
      this.form.dimension_id = null;
      this.loadScopeOptions();
    }
  }

  private loadScopeOptions(): void {
    if (!this.form) return;
    this.scopeOptions = [];
    this.api.scopeOptions(this.form.dimension_type).subscribe({
      next: options => (this.scopeOptions = options),
      error: err => (this.formError = normalizeError(err).message),
    });
  }

  get canSave(): boolean {
    const f = this.form;
    return (
      !!f &&
      !this.saving &&
      f.label.trim() !== '' &&
      (f.budget_usd ?? 0) > 0 &&
      (f.dimension_type === 'global' || f.dimension_id !== null)
    );
  }

  save(): void {
    if (!this.form || !this.canSave) return;
    const payload = budgetPayload(this.form);
    const request = this.form.id
      ? this.api.update(this.form.id, payload)
      : this.api.create(payload);

    this.saving = true;
    this.formError = null;
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.form = null;
        this.refresh();
      },
      error: err => (this.formError = normalizeError(err).message),
    });
  }

  toggleActive(budget: Budget, ev: MatSlideToggleChange): void {
    this.errorMessage = null;
    this.api.update(budget.id, { is_active: ev.checked }).subscribe({
      next: updated => Object.assign(budget, updated),
      error: err => {
        ev.source.checked = !ev.checked;
        this.errorMessage = normalizeError(err).message;
      },
    });
  }

  confirmDelete(budget: Budget): void {
    this.dialog
      .open(DfConfirmDialogComponent, {
        data: {
          title: 'aiBudgets.delete.title',
          message: 'aiBudgets.delete.message',
        },
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.api.remove(budget.id).subscribe({
          next: () => this.refresh(),
          error: err => (this.errorMessage = normalizeError(err).message),
        });
      });
  }

  trackById(_: number, row: { id: number }): number {
    return row.id;
  }
}
