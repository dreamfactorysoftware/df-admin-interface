import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { TranslocoModule } from '@ngneat/transloco';
import { Observable, Subject } from 'rxjs';
import { filter, finalize, take, takeUntil, tap } from 'rxjs/operators';
import {
  DfPickerListComponent,
  PickerId,
  PickerItem,
} from 'src/app/shared/components/df-picker-list/df-picker-list.component';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { AiBudgetsAvailabilityService } from './ai-budgets-availability.service';
import { BudgetsService, ModelAlias } from './budgets.service';

/** Alias rows rendered at a time. "Show more" adds another page. */
export const ALIAS_PAGE_SIZE = 50;

/**
 * Model names for the OpenAI-compatible endpoint. Aliases are disabled, not
 * deleted, because they appear in past usage rows.
 *
 * The section renders nothing and sends nothing unless the server has the
 * alias API and accepts this user (AiBudgetsAvailabilityService). The first
 * alias list comes from that one shared check, so an AI page load on a server
 * without the feature costs no request from here.
 */
@Component({
  selector: 'df-ai-aliases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    TranslocoModule,
    DfPickerListComponent,
  ],
  template: `
    <ng-container *transloco="let t; read: 'aiBudgets.aliases'">
      <section
        class="aliases"
        *ngIf="available"
        aria-labelledby="aliases-title"
        data-testid="aliases">
        <h3 id="aliases-title">{{ t('title') }}</h3>
        <p class="aliases__hint">{{ t('hint') }}</p>

        <p
          *ngIf="errorMessage"
          class="aliases__error"
          role="alert"
          data-testid="alias-error">
          {{ errorMessage | transloco }}
        </p>

        <p
          *ngIf="!loading && !aliases.length && !errorMessage"
          class="aliases__hint"
          data-testid="alias-empty">
          {{ t('empty') }}
        </p>

        <table
          *ngIf="aliases.length"
          class="aliases__table"
          data-testid="alias-table">
          <thead>
            <tr>
              <th scope="col">{{ t('name') }}</th>
              <th scope="col">{{ t('connection') }}</th>
              <th scope="col">{{ t('model') }}</th>
              <th scope="col">{{ t('active') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let a of visible; trackBy: trackById"
              data-testid="alias-row">
              <td>{{ a.name }}</td>
              <td>{{ connectionName(a.service_id) }}</td>
              <td>{{ a.physical_model }}</td>
              <td>
                <mat-slide-toggle
                  [checked]="a.is_active"
                  [disabled]="isBusy(a)"
                  [attr.aria-label]="t('activeFor', { name: a.name })"
                  (change)="toggleActive(a, $event)"></mat-slide-toggle>
              </td>
            </tr>
          </tbody>
        </table>

        <button
          *ngIf="hiddenCount > 0"
          type="button"
          mat-stroked-button
          class="aliases__more"
          data-testid="alias-more"
          (click)="showMore()">
          {{ t('showMore', { count: nextPage }) }}
        </button>

        <form
          class="aliases__form"
          data-testid="alias-form"
          (ngSubmit)="create()">
          <mat-form-field appearance="outline">
            <mat-label>{{ t('name') }}</mat-label>
            <input
              matInput
              name="name"
              maxlength="128"
              required
              data-testid="alias-name"
              [(ngModel)]="draft.name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ t('model') }}</mat-label>
            <input
              matInput
              name="physical_model"
              maxlength="128"
              required
              data-testid="alias-model"
              [(ngModel)]="draft.physical_model" />
          </mat-form-field>
          <div class="aliases__connection" data-testid="alias-connection">
            <span class="aliases__label">{{ t('connection') }}</span>
            <span class="aliases__hint" data-testid="alias-connection-selected">
              {{
                draft.service_id === null
                  ? t('connectionNone')
                  : t('connectionSelected', {
                      name: connectionName(draft.service_id),
                    })
              }}
            </span>
            <df-picker-list
              testId="alias-connections"
              [items]="connections"
              [selected]="connectionSelected"
              [loading]="connectionsLoading"
              [noun]="t('connectionNoun')"
              [truncated]="connectionsTruncated"
              [remoteSearch]="searchConnections"
              (toggle)="pickConnection($event)"></df-picker-list>
            <p
              *ngIf="!connectionsLoading && !connections.length"
              class="aliases__hint"
              data-testid="alias-connections-empty">
              {{ t('connectionsEmpty') }}
            </p>
          </div>

          <div class="aliases__actions">
            <button
              type="submit"
              mat-stroked-button
              data-testid="alias-add"
              [disabled]="!canCreate">
              {{ creating ? t('adding') : t('add') }}
            </button>
          </div>
        </form>
      </section>
    </ng-container>
  `,
  styles: [
    `
      .aliases {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 24px 40px;
        color: var(--df-text);
      }
      .aliases__hint {
        margin: 0 0 12px;
        color: var(--df-text-muted);
      }
      .aliases__label {
        font-weight: 600;
        margin-right: 8px;
      }
      .aliases__table {
        width: 100%;
        margin-bottom: 16px;
        border-collapse: collapse;
      }
      .aliases__table th,
      .aliases__table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid var(--df-border);
      }
      .aliases__more {
        margin-bottom: 16px;
      }
      .aliases__form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px 16px;
        align-items: start;
      }
      .aliases__connection,
      .aliases__actions {
        grid-column: 1 / -1;
      }
      .aliases__error {
        margin: 0 0 12px;
        padding: 10px 12px;
        color: var(--df-danger);
        background: var(--df-danger-soft);
        border-radius: var(--df-radius-sm);
      }
    `,
  ],
})
export class DfAiAliasesComponent implements OnInit, OnDestroy {
  private api = inject(BudgetsService);
  private availability = inject(AiBudgetsAvailabilityService);
  private destroy$ = new Subject<void>();

  /** False until the shared check says the server has the alias API. */
  available = false;
  loading = false;
  creating = false;
  /** A translation key or a server message. The template pipes it. */
  errorMessage: string | null = null;

  aliases: ModelAlias[] = [];
  /** The rows in the DOM: one page of `aliases`. */
  visible: ModelAlias[] = [];
  hiddenCount = 0;
  private shown = ALIAS_PAGE_SIZE;
  private busy = new Set<number>();

  connections: PickerItem[] = [];
  connectionSelected: PickerId[] = [];
  connectionsTruncated = false;
  connectionsLoading = false;
  private connectionLabels = new Map<number, string>();

  draft = this.emptyDraft();

  ngOnInit(): void {
    // Nothing is requested here until the shared check passes.
    this.availability.available$
      .pipe(
        filter(available => available),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.available = true;
        this.loadAliases();
        this.loadConnections();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAliases(): void {
    const probed = this.availability.takeProbedAliases();
    if (probed) {
      this.setAliases(probed);
      return;
    }
    this.loading = true;
    this.api
      .aliases()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: aliases => this.setAliases(aliases ?? []),
        error: err => (this.errorMessage = normalizeError(err).message),
      });
  }

  private loadConnections(): void {
    this.connectionsLoading = true;
    this.api
      .scopeOptions('service')
      .pipe(
        finalize(() => (this.connectionsLoading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: page => {
          this.connections = page.items;
          this.connectionsTruncated = page.truncated;
          this.rememberConnections(page.items);
        },
        error: err => (this.errorMessage = normalizeError(err).message),
      });
  }

  /** Server-side search, used by the picker when the first page was capped. */
  searchConnections = (query: string): Observable<PickerItem[]> =>
    this.api
      .searchScope('service', query)
      .pipe(tap(items => this.rememberConnections(items)));

  private rememberConnections(items: PickerItem[]): void {
    items.forEach(item =>
      this.connectionLabels.set(Number(item.id), item.label)
    );
  }

  private setAliases(aliases: ModelAlias[]): void {
    this.aliases = aliases;
    this.visible = aliases.slice(0, this.shown);
    this.hiddenCount = aliases.length - this.visible.length;
  }

  showMore(): void {
    this.shown += ALIAS_PAGE_SIZE;
    this.setAliases(this.aliases);
  }

  get nextPage(): number {
    return Math.min(this.hiddenCount, ALIAS_PAGE_SIZE);
  }

  connectionName(id: number): string {
    return this.connectionLabels.get(id) ?? `#${id}`;
  }

  /** The picker allows many; an alias has one connection, so a pick replaces it. */
  pickConnection(id: PickerId): void {
    const picked = Number(id);
    this.draft.service_id = this.draft.service_id === picked ? null : picked;
    this.connectionSelected =
      this.draft.service_id === null ? [] : [this.draft.service_id];
  }

  get canCreate(): boolean {
    return (
      !this.creating &&
      this.draft.name.trim() !== '' &&
      this.draft.physical_model.trim() !== '' &&
      this.draft.service_id !== null
    );
  }

  create(): void {
    // `creating` is set before the request leaves, so a double submit sends one.
    if (!this.canCreate) return;
    this.creating = true;
    this.errorMessage = null;
    this.api
      .createAlias({
        name: this.draft.name.trim(),
        service_id: this.draft.service_id as number,
        physical_model: this.draft.physical_model.trim(),
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        // The row is added only after the server confirms it.
        next: alias => {
          this.setAliases([...this.aliases, alias]);
          this.draft = this.emptyDraft();
          this.connectionSelected = [];
        },
        error: err => (this.errorMessage = normalizeError(err).message),
      });
  }

  isBusy(alias: ModelAlias): boolean {
    return this.busy.has(alias.id);
  }

  toggleActive(alias: ModelAlias, ev: MatSlideToggleChange): void {
    if (this.busy.has(alias.id)) {
      ev.source.checked = alias.is_active;
      return;
    }
    this.errorMessage = null;
    this.busy.add(alias.id);
    this.api
      .updateAlias(alias.id, { is_active: ev.checked })
      .pipe(finalize(() => this.busy.delete(alias.id)))
      .subscribe({
        next: updated => Object.assign(alias, updated),
        error: err => {
          // The switch moved on click. Put it back: nothing was saved.
          ev.source.checked = alias.is_active;
          this.errorMessage = normalizeError(err).message;
        },
      });
  }

  trackById(_: number, row: { id: number }): number {
    return row.id;
  }

  private emptyDraft(): {
    name: string;
    service_id: number | null;
    physical_model: string;
  } {
    return { name: '', service_id: null, physical_model: '' };
  }
}
