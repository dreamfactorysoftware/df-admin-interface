import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { BudgetsService, ModelAlias, ScopeOption } from './budgets.service';

/** Model names for the OpenAI-compatible endpoint. Aliases are disabled, not
 *  deleted, because they appear in past usage rows. */
@Component({
  selector: 'df-ai-aliases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <section class="aliases" *ngIf="available" aria-labelledby="aliases-title">
      <h3 id="aliases-title">Model aliases</h3>
      <p class="aliases__hint">
        Names that clients send as "model" to the OpenAI-compatible endpoint.
      </p>

      <table *ngIf="aliases.length" class="aliases__table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">AI Connection</th>
            <th scope="col">Model</th>
            <th scope="col">Active</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of aliases; trackBy: trackById">
            <td>{{ a.name }}</td>
            <td>{{ connectionName(a.service_id) }}</td>
            <td>{{ a.physical_model }}</td>
            <td>
              <mat-slide-toggle
                [checked]="a.is_active"
                [attr.aria-label]="'Active: ' + a.name"
                (change)="toggleActive(a, $event)"></mat-slide-toggle>
            </td>
          </tr>
        </tbody>
      </table>

      <form class="aliases__form" (ngSubmit)="create()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input
            matInput
            name="name"
            maxlength="128"
            required
            [(ngModel)]="draft.name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>AI Connection</mat-label>
          <mat-select name="service_id" required [(ngModel)]="draft.service_id">
            <mat-option *ngFor="let c of connections" [value]="c.id">
              {{ c.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Model</mat-label>
          <input
            matInput
            name="physical_model"
            maxlength="128"
            required
            [(ngModel)]="draft.physical_model" />
        </mat-form-field>
        <button
          type="submit"
          mat-stroked-button
          [disabled]="
            !draft.name || !draft.service_id || !draft.physical_model
          ">
          Add alias
        </button>
      </form>

      <p *ngIf="errorMessage" class="aliases__error" role="alert">
        {{ errorMessage }}
      </p>
    </section>
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
      .aliases__form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px 16px;
        align-items: start;
      }
      .aliases__error {
        color: var(--df-danger);
      }
    `,
  ],
})
export class DfAiAliasesComponent implements OnInit {
  private api = inject(BudgetsService);

  /** Stays false for a non-admin, whom the API refuses. */
  available = false;
  aliases: ModelAlias[] = [];
  connections: ScopeOption[] = [];
  draft = this.emptyDraft();
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.api.aliases().subscribe({
      next: aliases => {
        this.aliases = aliases;
        this.available = true;
      },
      error: () => (this.available = false),
    });
    this.api
      .scopeOptions('service')
      .subscribe(options => (this.connections = options));
  }

  connectionName(id: number): string {
    return this.connections.find(c => c.id === id)?.label ?? `#${id}`;
  }

  create(): void {
    this.errorMessage = null;
    this.api.createAlias(this.draft as Partial<ModelAlias>).subscribe({
      next: alias => {
        this.aliases = [...this.aliases, alias];
        this.draft = this.emptyDraft();
      },
      error: err => (this.errorMessage = normalizeError(err).message),
    });
  }

  toggleActive(alias: ModelAlias, ev: MatSlideToggleChange): void {
    this.errorMessage = null;
    this.api.updateAlias(alias.id, { is_active: ev.checked }).subscribe({
      next: updated => Object.assign(alias, updated),
      error: err => {
        ev.source.checked = !ev.checked;
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
