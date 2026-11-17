import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { TranslocoModule } from '@ngneat/transloco';
import { Observable, Subject, Subscription } from 'rxjs';
import { finalize, takeUntil, tap } from 'rxjs/operators';
import { DfConfirmDialogComponent } from 'src/app/shared/components/df-confirm-dialog/df-confirm-dialog.component';
import {
  DfPickerListComponent,
  PickerId,
  PickerItem,
} from 'src/app/shared/components/df-picker-list/df-picker-list.component';
import { ROUTES } from 'src/app/shared/types/routes';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { USD_4DP } from '../adf-ai-usage/utils/cost';
import {
  AiBudgetsAvailability,
  AiBudgetsAvailabilityService,
  availabilityFromError,
  serverMessage,
} from './ai-budgets-availability.service';
import {
  BUDGET_PERIODS,
  Budget,
  BudgetForm,
  BudgetsService,
  SCOPE_TYPES,
  budgetPayload,
  budgetToForm,
  emptyBudgetForm,
} from './budgets.service';

/** What the page shows in place of the table. */
export type BudgetsView =
  | 'checking'
  | 'ready'
  | 'unsupported'
  | 'forbidden'
  | 'error';

/** Largest cap the server column, decimal(12,4), can hold. */
export const MAX_BUDGET_USD = 99999999.9999;
/** Table rows rendered at a time. "Show more" adds another page. */
export const BUDGET_PAGE_SIZE = 50;

const WEBHOOK_URL = /^https?:\/\/\S+$/i;
const PERCENT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function finite(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Cap as money. Up to four decimals, because the server stores four and a
 * cap under one cent is valid.
 */
export function capText(budget: Pick<Budget, 'budget_usd'>): string {
  return USD_4DP.format(finite(budget.budget_usd));
}

/**
 * Spend as money. Below the cap the figure is cut, not rounded, at four
 * decimals, so the table never shows the cap as reached before it is.
 */
export function spentText(
  budget: Pick<Budget, 'budget_usd' | 'spent_usd'>
): string {
  const spent = Math.max(0, finite(budget.spent_usd));
  const cap = finite(budget.budget_usd);
  const shown = spent < cap ? Math.floor(spent * 1e4 + 1e-6) / 1e4 : spent;
  return USD_4DP.format(shown);
}

/**
 * Percent of the cap used. Below the cap it never reads 100: 99.96 percent
 * shows as 99.9, not 100.0. A zero or missing cap reads 0, never NaN.
 */
export function usedText(
  budget: Pick<Budget, 'budget_usd' | 'spent_usd' | 'utilization'>
): string {
  const spent = Math.max(0, finite(budget.spent_usd));
  const cap = finite(budget.budget_usd);
  if (cap <= 0) {
    return '0%';
  }
  const percent = (spent / cap) * 100;
  const shown =
    spent < cap
      ? Math.min(Math.floor(percent * 10 + 1e-6) / 10, 99.9)
      : Math.round(percent * 10) / 10;
  return `${PERCENT.format(shown)}%`;
}

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
    TranslocoModule,
    DfPickerListComponent,
  ],
  templateUrl: './df-ai-budgets.component.html',
  styleUrls: ['./df-ai-budgets.component.scss'],
})
export class DfAiBudgetsComponent implements OnInit, OnDestroy {
  private api = inject(BudgetsService);
  private availability = inject(AiBudgetsAvailabilityService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  readonly faArrowsRotate = faArrowsRotate;
  readonly faCircleInfo = faCircleInfo;
  readonly faPenToSquare = faPenToSquare;
  readonly faPlus = faPlus;
  readonly faScaleBalanced = faScaleBalanced;
  readonly faTrash = faTrash;

  readonly usageLink = `/${ROUTES.AI}/${ROUTES.AI_USAGE}`;
  readonly scopeTypes = SCOPE_TYPES;
  readonly periods = BUDGET_PERIODS;
  readonly maxBudgetUsd = MAX_BUDGET_USD;
  readonly capText = capText;
  readonly spentText = spentText;
  readonly usedText = usedText;

  view: BudgetsView = 'checking';
  loading = false;
  saving = false;
  /** A translation key or a server message. The template pipes it. */
  errorMessage: string | null = null;
  formError: string | null = null;
  usageLoggingEnabled = true;
  /** False when the server has alert webhooks turned off. */
  alertWebhooksEnabled = true;
  /** What the server said when it refused this user. Shown under our own line. */
  forbiddenDetail: string | null = null;

  budgets: Budget[] = [];
  /** `budgets` narrowed by the filter box. Rebuilt only when either changes. */
  matches: Budget[] = [];
  /** The rows in the DOM: one page of `matches`. */
  visible: Budget[] = [];
  hiddenCount = 0;
  filterQuery = '';
  private shown = BUDGET_PAGE_SIZE;
  /** Rows with a request in flight. Their controls are disabled. */
  private busy = new Set<number>();

  form: BudgetForm | null = null;
  scopeItems: PickerItem[] = [];
  scopeSelected: PickerId[] = [];
  scopeSelectedLabel: string | null = null;
  scopeTruncated = false;
  scopeLoading = false;
  private scopeLabels = new Map<PickerId, string>();
  private scopeSub?: Subscription;
  private listSub?: Subscription;
  private loaded = false;

  @ViewChild(DfPickerListComponent) private scopePicker?: DfPickerListComponent;

  ngOnInit(): void {
    this.availability.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => this.applyAvailability(state));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.scopeSub?.unsubscribe();
    this.listSub?.unsubscribe();
  }

  private applyAvailability(state: AiBudgetsAvailability): void {
    this.forbiddenDetail =
      state === 'forbidden' ? this.availability.forbiddenMessage : null;
    switch (state) {
      case 'available':
        this.view = 'ready';
        if (!this.loaded) {
          this.refresh();
        }
        break;
      case 'unknown':
        this.view = 'error';
        break;
      default:
        this.view = state;
    }
  }

  /** Retry from the error state: ask the server again what it supports. */
  retryCheck(): void {
    this.availability.recheck();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = null;
    this.listSub?.unsubscribe();
    this.listSub = this.api
      .list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: list => {
          this.loaded = true;
          this.budgets = list?.resource ?? [];
          this.usageLoggingEnabled = list?.usage_logging_enabled !== false;
          this.alertWebhooksEnabled = list?.alert_webhooks_enabled !== false;
          this.applyFilter();
        },
        error: err => {
          // The server can change under an open page: an upgrade or a
          // rollback, or the admin losing access.
          const state = availabilityFromError(err);
          if (state === 'unsupported' || state === 'forbidden') {
            this.view = state;
            this.forbiddenDetail =
              state === 'forbidden' ? serverMessage(err) : null;
            return;
          }
          this.errorMessage = normalizeError(err).message;
        },
      });
  }

  onFilter(query: string): void {
    this.filterQuery = query ?? '';
    this.shown = BUDGET_PAGE_SIZE;
    this.applyFilter();
  }

  showMore(): void {
    this.shown += BUDGET_PAGE_SIZE;
    this.applyFilter();
  }

  get nextPage(): number {
    return Math.min(this.hiddenCount, BUDGET_PAGE_SIZE);
  }

  private applyFilter(): void {
    const q = this.filterQuery.trim().toLowerCase();
    this.matches = q
      ? this.budgets.filter(
          b =>
            (b.label ?? '').toLowerCase().includes(q) ||
            (b.dimension_name ?? '').toLowerCase().includes(q)
        )
      : this.budgets;
    this.visible = this.matches.slice(0, this.shown);
    this.hiddenCount = this.matches.length - this.visible.length;
  }

  isBusy(budget: Budget): boolean {
    return this.busy.has(budget.id);
  }

  openCreate(): void {
    this.form = emptyBudgetForm();
    this.formError = null;
    this.setScope(null, null);
    this.loadScopeOptions();
  }

  openEdit(budget: Budget): void {
    this.form = budgetToForm(budget);
    this.formError = null;
    this.setScope(budget.dimension_id, budget.dimension_name);
    this.loadScopeOptions();
  }

  closeForm(): void {
    if (this.saving) return;
    this.form = null;
    this.scopeSub?.unsubscribe();
  }

  onScopeTypeChange(): void {
    if (!this.form) return;
    this.form.dimension_id = null;
    this.setScope(null, null);
    this.scopePicker?.onQuery('');
    this.loadScopeOptions();
  }

  /** The picker allows many; a budget has one scope record, so a pick replaces it. */
  pickScope(id: PickerId): void {
    if (!this.form) return;
    const picked = Number(id);
    if (this.form.dimension_id === picked) {
      this.form.dimension_id = null;
      this.setScope(null, null);
      return;
    }
    this.form.dimension_id = picked;
    this.setScope(picked, this.scopeLabels.get(picked) ?? null);
  }

  /** Server-side search, used by the picker when the first page was capped. */
  searchScope = (query: string): Observable<PickerItem[]> =>
    this.api
      .searchScope(this.form?.dimension_type ?? 'global', query)
      .pipe(tap(items => this.rememberScopeLabels(items)));

  private setScope(id: number | null, label: string | null): void {
    this.scopeSelected = id === null ? [] : [id];
    this.scopeSelectedLabel = id === null ? null : label;
  }

  private rememberScopeLabels(items: PickerItem[]): void {
    items.forEach(item => this.scopeLabels.set(item.id, item.label));
  }

  private loadScopeOptions(): void {
    if (!this.form) return;
    this.scopeSub?.unsubscribe();
    this.scopeItems = [];
    this.scopeTruncated = false;
    this.scopeLabels.clear();
    if (this.form.dimension_type === 'global') {
      this.scopeLoading = false;
      return;
    }
    this.scopeLoading = true;
    this.scopeSub = this.api
      .scopeOptions(this.form.dimension_type)
      .pipe(finalize(() => (this.scopeLoading = false)))
      .subscribe({
        next: page => {
          this.scopeItems = page.items;
          this.scopeTruncated = page.truncated;
          this.rememberScopeLabels(page.items);
        },
        error: err => (this.formError = normalizeError(err).message),
      });
  }

  /** The first reason the form cannot be saved, as a translation key. */
  get formProblem(): string | null {
    const f = this.form;
    if (!f) return null;
    if (f.label.trim() === '') return 'aiBudgets.validation.label';
    if (f.dimension_type !== 'global' && f.dimension_id === null) {
      return 'aiBudgets.validation.scope';
    }
    const cap = f.budget_usd;
    if (cap === null || !Number.isFinite(Number(cap)) || Number(cap) <= 0) {
      return 'aiBudgets.validation.cap';
    }
    if (Number(cap) > MAX_BUDGET_USD) return 'aiBudgets.validation.capMax';
    const url = this.alertWebhooksEnabled ? f.alert_webhook_url.trim() : '';
    if (url !== '' && !WEBHOOK_URL.test(url)) {
      return 'aiBudgets.validation.webhook';
    }
    return null;
  }

  get canSave(): boolean {
    return !!this.form && !this.saving && this.formProblem === null;
  }

  save(): void {
    // `saving` is set before the request leaves, so Enter plus a click, or a
    // double click, sends one request.
    if (!this.form || !this.canSave) return;
    const payload = budgetPayload(this.form, this.alertWebhooksEnabled);
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
      // The form stays open with what the admin typed.
      error: err => (this.formError = normalizeError(err).message),
    });
  }

  toggleActive(budget: Budget, ev: MatSlideToggleChange): void {
    if (this.busy.has(budget.id)) {
      ev.source.checked = budget.is_active;
      return;
    }
    this.errorMessage = null;
    this.busy.add(budget.id);
    this.api
      .update(budget.id, { is_active: ev.checked })
      .pipe(finalize(() => this.busy.delete(budget.id)))
      .subscribe({
        next: updated => Object.assign(budget, updated),
        error: err => {
          // The switch moved on click. Put it back: nothing was saved.
          ev.source.checked = budget.is_active;
          this.errorMessage = normalizeError(err).message;
        },
      });
  }

  confirmDelete(budget: Budget): void {
    if (this.busy.has(budget.id)) return;
    this.dialog
      .open(DfConfirmDialogComponent, {
        data: {
          title: 'aiBudgets.delete.title',
          message: 'aiBudgets.delete.message',
        },
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed || this.busy.has(budget.id)) return;
        this.errorMessage = null;
        this.busy.add(budget.id);
        this.api
          .remove(budget.id)
          .pipe(finalize(() => this.busy.delete(budget.id)))
          .subscribe({
            // The row leaves the table only after the server confirms.
            next: () => {
              if (this.form?.id === budget.id) {
                this.form = null;
              }
              this.refresh();
            },
            error: err => (this.errorMessage = normalizeError(err).message),
          });
      });
  }

  trackById(_: number, row: { id: number }): number {
    return row.id;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }
}
