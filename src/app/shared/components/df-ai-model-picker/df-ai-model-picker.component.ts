import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faCircleCheck,
  faCircleXmark,
  faKeyboard,
} from '@fortawesome/free-solid-svg-icons';

interface ProviderModel {
  id?: string;
  name?: string;
  context_window?: number | null;
}

interface TestConnectionResponse {
  success: boolean;
  provider?: string;
  resource?: Array<ProviderModel | string>;
  error?: { message?: string };
}

interface NormalizedModel {
  id: string;
  label: string;
  context?: number | null;
}

@Component({
  selector: 'df-ai-model-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FontAwesomeModule,
  ],
  template: `
    <div class="model-picker">
      <div class="model-picker__header">
        <span class="model-picker__title">Default Model</span>
        <button
          *ngIf="!customMode"
          type="button"
          mat-stroked-button
          class="model-picker__refresh"
          [disabled]="loading"
          (click)="fetch()">
          <mat-spinner *ngIf="loading" diameter="14"></mat-spinner>
          <fa-icon *ngIf="!loading" [icon]="faArrowsRotate"></fa-icon>
          <span>{{
            models.length ? 'Refresh' : 'Fetch available models'
          }}</span>
        </button>
        <button
          type="button"
          mat-button
          class="model-picker__custom-toggle"
          (click)="toggleCustom()">
          <fa-icon [icon]="faKeyboard"></fa-icon>
          <span>{{ customMode ? 'Use list' : 'Type custom' }}</span>
        </button>
      </div>

      <div *ngIf="error" class="model-picker__error">
        <fa-icon [icon]="faCircleXmark"></fa-icon>
        <span>{{ error }}</span>
      </div>

      <ng-container *ngIf="!customMode">
        <mat-form-field
          *ngIf="models.length > 0"
          appearance="outline"
          subscriptSizing="dynamic"
          class="model-picker__select">
          <mat-label>Model</mat-label>
          <mat-select
            [value]="currentValue"
            (selectionChange)="select($event.value)">
            <mat-option *ngFor="let m of models" [value]="m.id">
              <span class="model-picker__option">
                <span class="model-picker__option-label">{{ m.label }}</span>
                <span *ngIf="m.context" class="model-picker__option-meta"
                  >{{ m.context | number }} ctx</span
                >
              </span>
            </mat-option>
          </mat-select>
        </mat-form-field>

        <p
          *ngIf="!loading && models.length === 0 && !error && !lastFetched"
          class="model-picker__hint">
          {{ fetchHint }}
        </p>

        <p
          *ngIf="!loading && models.length === 0 && lastFetched"
          class="model-picker__hint">
          No models reported by the provider. Switch to "Type custom" if you
          know the model id.
        </p>

        <p *ngIf="currentValue" class="model-picker__current">
          <fa-icon
            [icon]="faCircleCheck"
            class="model-picker__current-ok"></fa-icon>
          Selected:
          <code>{{ currentValue }}</code>
        </p>
      </ng-container>

      <mat-form-field
        *ngIf="customMode"
        appearance="outline"
        subscriptSizing="dynamic"
        class="model-picker__custom">
        <mat-label>Model id</mat-label>
        <input
          matInput
          [value]="currentValue || ''"
          (input)="onCustomInput($event)"
          placeholder="e.g. claude-sonnet-4-5-20250929" />
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      /* Theme tokens: light defaults; dark values apply under the host form's
         .dark-theme and match the original whites, so dark mode is unchanged. */
      :host {
        --p-surface: rgba(0, 0, 0, 0.02);
        --p-border: rgba(0, 0, 0, 0.12);
        --p-code-bg: rgba(0, 0, 0, 0.06);
        --p-text-muted: rgba(0, 0, 0, 0.6);
        --p-text-hint: rgba(0, 0, 0, 0.72);
        --p-text-strong: rgba(0, 0, 0, 0.87);
      }
      :host-context(.dark-theme) {
        --p-surface: rgba(255, 255, 255, 0.02);
        --p-border: rgba(255, 255, 255, 0.08);
        --p-code-bg: rgba(255, 255, 255, 0.08);
        --p-text-muted: rgba(255, 255, 255, 0.6);
        --p-text-hint: rgba(255, 255, 255, 0.75);
        --p-text-strong: rgba(255, 255, 255, 0.9);
      }

      .model-picker {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        padding: 1.25rem 1.5rem;
        margin: 1rem 0;
        background: var(--p-surface);
        border: 1px solid var(--p-border);
        border-radius: 8px;
        font-size: 16px;

        &__header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex-wrap: wrap;
        }
        &__title {
          font-weight: 600;
          font-size: 18px;
          margin-right: auto;
        }
        &__refresh,
        &__custom-toggle {
          display: inline-flex !important;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem !important;
          padding: 0 0.875rem !important;
          min-height: 38px !important;
        }
        &__select,
        &__custom {
          width: 100%;
        }

        &__option {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          width: 100%;
        }
        &__option-label {
          flex: 1;
        }
        &__option-meta {
          font-size: 14px;
          color: var(--p-text-muted);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
        }

        &__hint {
          margin: 0;
          font-size: 15px;
          color: var(--p-text-hint);
          font-style: italic;
          line-height: 1.5;
        }
        &__error {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          border-radius: 4px;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #ff8585;
          font-size: 15px;
        }
        &__current {
          margin: 0;
          font-size: 15px;
          color: var(--p-text-strong);
          display: flex;
          align-items: center;
          gap: 0.5rem;

          code {
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            font-size: 14px;
            background: var(--p-code-bg);
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
          }
        }
        &__current-ok {
          color: #4ade80;
        }
      }
    `,
  ],
})
export class DfAiModelPickerComponent implements OnInit {
  /** Service form. Reads config.{provider, api_key, base_url, ...}, writes config.defaultModel. */
  @Input({ required: true }) form!: FormGroup;

  private http = inject(HttpClient);

  loading = false;
  models: NormalizedModel[] = [];
  error: string | null = null;
  customMode = false;
  lastFetched = false;

  faArrowsRotate = faArrowsRotate;
  faCircleCheck = faCircleCheck;
  faCircleXmark = faCircleXmark;
  faKeyboard = faKeyboard;

  ngOnInit(): void {
    // If the form already has a model that's not in the (empty) list, start
    // in custom mode so the value is editable rather than appearing missing.
    if (this.currentValue) {
      this.customMode = true;
    }
  }

  get currentValue(): string {
    return this.form.get('config.defaultModel')?.value ?? '';
  }

  get fetchHint(): string {
    const provider = this.form.get('config.provider')?.value;
    if (!provider) {
      return 'Pick a provider above first, then click "Fetch available models".';
    }
    if (provider === 'openai_compatible' || provider === 'ollama') {
      return 'Fill in Base URL (and API Key if your endpoint requires one), then click "Fetch available models".';
    }
    return 'Fill in API Key above, then click "Fetch available models".';
  }

  select(id: string): void {
    this.form.get('config.defaultModel')?.setValue(id);
  }

  onCustomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.get('config.defaultModel')?.setValue(value);
  }

  toggleCustom(): void {
    this.customMode = !this.customMode;
  }

  fetch(): void {
    const config = this.form.get('config')?.value ?? {};
    const provider = config.provider;
    if (!provider) {
      this.error = 'Pick a provider above first.';
      return;
    }

    this.loading = true;
    this.error = null;

    // DF camel-cases /api/* response bodies, so saved connections may
    // have baseUrl/apiKey on the form rather than base_url/api_key.
    const body = {
      provider,
      api_key: config.api_key ?? config.apiKey ?? null,
      base_url: config.base_url ?? config.baseUrl ?? null,
      organization_id: config.organization_id ?? config.organizationId ?? null,
      extra_headers: config.extra_headers ?? config.extraHeaders ?? null,
      timeout: config.timeout ?? null,
    };

    this.http
      .post<TestConnectionResponse>('/_internal/ai/test-connection', body)
      .subscribe({
        next: res => {
          this.loading = false;
          this.lastFetched = true;
          if (!res.success) {
            this.error = res.error?.message ?? 'Provider rejected the request.';
            return;
          }
          this.models = (res.resource ?? []).map(this.normalize);
          // If the form's current model isn't in the returned list and we
          // have models, leave the value alone — admin may have a custom
          // model id intentionally.
        },
        error: err => {
          this.loading = false;
          this.lastFetched = true;
          this.error =
            err?.error?.error?.message ??
            err?.error?.message ??
            err?.message ??
            'Network error fetching models.';
        },
      });
  }

  private normalize(m: ProviderModel | string): NormalizedModel {
    if (typeof m === 'string') {
      return { id: m, label: m };
    }
    return {
      id: m.id ?? m.name ?? 'unknown',
      label: m.name ?? m.id ?? 'unknown',
      context: m.context_window ?? null,
    };
  }
}
