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
              >, including {{ firstModelLabel }}</span
            >
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Departure treatment: token-only chrome (light/dark/phosphor come
         free), status surfaces on the shared success/danger tokens. */
      .test-conn {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin: 1rem 0;
        font-size: 1.4rem;

        &__button {
          align-self: flex-start;
          display: inline-flex !important;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.3rem !important;
          min-height: 38px !important;
        }

        &__result {
          display: flex;
          gap: 0.75rem;
          padding: 0.875rem 1.125rem;
          border-radius: var(--df-radius-sm);
          align-items: flex-start;
          font-size: 1.4rem;

          &--ok {
            background: var(--df-success-soft);
            border: 1px solid var(--df-success-border);
            color: var(--df-success);
          }

          &--err {
            background: var(--df-danger-soft);
            border: 1px solid var(--df-danger-border);
            color: var(--df-danger);
          }
        }

        &__detail {
          flex: 1;
          color: var(--df-text);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;

          strong {
            font-weight: 600;
            font-size: 1.4rem;
          }

          p {
            margin: 0;
            color: var(--df-text-2);
            font-size: 1.3rem;
          }
        }

        &__models {
          font-size: 1.3rem;
        }
      }
    `,
  ],
})
export class DfAiTestConnectionComponent {
  /** Service form. Reads config.provider, config.api_key, config.base_url etc. */
  @Input({ required: true }) form!: FormGroup;

  /** Service id when editing an existing AI Connection. The backend uses
   *  this to fall back to the saved config for any field the form left
   *  blank — so admins can click Test without re-entering saved secrets. */
  @Input() serviceId: number | null = null;

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
    // DF's case interceptor camel-cases /api/* response bodies, so an
    // edited connection's form has baseUrl/apiKey not base_url/api_key.
    // Read both — picks whichever the form actually carries.
    const provider = config.provider;
    // The edit form redisplays a saved key as the protection mask. Never
    // send the mask as a real key — null it so the backend falls back to
    // the stored secret via service_id.
    const rawApiKey = config.api_key ?? config.apiKey ?? null;
    const apiKey = rawApiKey === '**********' ? null : rawApiKey;
    const baseUrl = config.base_url ?? config.baseUrl ?? null;
    const orgId = config.organization_id ?? config.organizationId ?? null;
    const extraHeaders = config.extra_headers ?? config.extraHeaders ?? null;
    const timeout = config.timeout ?? null;

    if (!provider) {
      this.result = {
        success: false,
        error: { message: 'Pick a provider before testing.' },
      };
      return;
    }

    // Provider-level field validation, so the user gets a useful message
    // instead of "No host part in the URL" or "invalid x-api-key".
    // ollama has a default base_url; only openai_compatible truly requires one.
    const needsKey = provider !== 'ollama' && provider !== 'openai_compatible';
    const needsUrl = provider === 'openai_compatible';

    // When editing an existing connection, the backend will fall back to
    // the saved config for any field this form left blank — so we don't
    // require the user to re-type a previously-saved api_key just to test.
    const hasSavedConfig = this.serviceId != null;

    if (needsKey && !apiKey && !hasSavedConfig) {
      this.result = {
        success: false,
        error: {
          message:
            provider +
            ' requires an API key. Fill in API Key, then test. ' +
            '(Existing connections fall back to the saved key automatically.)',
        },
      };
      return;
    }
    if (needsUrl && !baseUrl && !hasSavedConfig) {
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

    const body: Record<string, unknown> = {
      provider,
      api_key: apiKey,
      base_url: baseUrl,
      organization_id: orgId,
      extra_headers: extraHeaders,
      timeout,
    };
    if (this.serviceId) {
      // Backend uses this to fall back to the saved api_key / base_url /
      // org_id / extra_headers for any field this form sent blank. Lets
      // the user click Test without re-typing the (already-saved) secret.
      body['service_id'] = this.serviceId;
    }

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
