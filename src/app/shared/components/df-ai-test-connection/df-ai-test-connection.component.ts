import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faCircleXmark,
  faPlugCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

interface TestConnectionResponse {
  success: boolean;
  provider?: string;
  resource?: Array<{ id?: string; name?: string } | string>;
  error?: { message?: string };
}

@Component({
  selector: 'df-ai-test-connection',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
  ],
  template: `
    <div class="test-conn">
      <button
        type="button"
        mat-stroked-button
        class="test-conn__button"
        [disabled]="loading"
        (click)="run()">
        <mat-spinner *ngIf="loading" diameter="16"></mat-spinner>
        <fa-icon *ngIf="!loading" [icon]="faPlugCircleCheck"></fa-icon>
        <span>{{ loading ? 'Testing…' : 'Test connection' }}</span>
      </button>

      <div
        *ngIf="result"
        class="test-conn__result"
        [class.test-conn__result--ok]="result.success"
        [class.test-conn__result--err]="!result.success">
        <fa-icon
          [icon]="result.success ? faCheckCircle : faCircleXmark"></fa-icon>
        <div class="test-conn__detail">
          <strong>{{
            result.success ? 'Connection succeeded' : 'Connection failed'
          }}</strong>
          <p *ngIf="!result.success && result.error?.message">
            {{ result.error?.message }}
          </p>
          <p *ngIf="result.success && modelCount > 0" class="test-conn__models">
            {{ modelCount }} models available
            <span *ngIf="firstModelLabel"
              >— including {{ firstModelLabel }}</span
            >
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .test-conn {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        margin: 0.75rem 0;

        &__button {
          align-self: flex-start;
          display: inline-flex !important;
          align-items: center;
          gap: 0.5rem;
        }

        &__result {
          display: flex;
          gap: 0.625rem;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          align-items: flex-start;

          &--ok {
            background: rgba(46, 160, 67, 0.1);
            border: 1px solid rgba(46, 160, 67, 0.4);
            color: #4ade80;
          }

          &--err {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.4);
            color: #ff6b6b;
          }
        }

        &__detail {
          flex: 1;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          strong {
            font-weight: 600;
          }

          p {
            margin: 0;
            color: rgba(255, 255, 255, 0.7);
          }
        }

        &__models {
          font-size: 0.8125rem;
        }
      }
    `,
  ],
})
export class DfAiTestConnectionComponent {
  /** Service form. Reads config.provider, config.api_key, config.base_url etc. */
  @Input({ required: true }) form!: FormGroup;

  private http = inject(HttpClient);

  loading = false;
  result: TestConnectionResponse | null = null;

  faPlugCircleCheck = faPlugCircleCheck;
  faCheckCircle = faCheckCircle;
  faCircleXmark = faCircleXmark;

  get modelCount(): number {
    return this.result?.resource?.length ?? 0;
  }

  get firstModelLabel(): string | null {
    const m = this.result?.resource?.[0];
    if (!m) {
      return null;
    }
    if (typeof m === 'string') {
      return m;
    }
    return m.name || m.id || null;
  }

  run(): void {
    const config = this.form.get('config')?.value ?? {};
    const provider = config.provider;
    if (!provider) {
      this.result = {
        success: false,
        error: { message: 'Pick a provider before testing.' },
      };
      return;
    }

    // Provider-level field validation, so the user gets a useful message
    // instead of "No host part in the URL" or "invalid x-api-key".
    const needsKey = provider !== 'ollama' && provider !== 'openai_compatible';
    const needsUrl =
      provider === 'openai_compatible' || provider === 'ollama';

    if (needsKey && !config.api_key) {
      this.result = {
        success: false,
        error: {
          message:
            provider + ' requires an API key. Fill in API Key, then test.',
        },
      };
      return;
    }
    if (needsUrl && !config.base_url) {
      this.result = {
        success: false,
        error: {
          message:
            provider +
            ' requires a Base URL (e.g. http://host:8090/v1). Fill in Base URL, then test.',
        },
      };
      return;
    }

    this.loading = true;
    this.result = null;

    const body = {
      provider,
      api_key: config.api_key ?? null,
      base_url: config.base_url ?? null,
      organization_id: config.organization_id ?? null,
      extra_headers: config.extra_headers ?? null,
      timeout: config.timeout ?? null,
    };

    this.http
      .post<TestConnectionResponse>('/_internal/ai/test-connection', body)
      .subscribe({
        next: res => {
          this.result = res;
          this.loading = false;
        },
        error: err => {
          this.result = {
            success: false,
            error: {
              message:
                err?.error?.error?.message ??
                err?.error?.message ??
                err?.message ??
                'Network error.',
            },
          };
          this.loading = false;
        },
      });
  }
}
