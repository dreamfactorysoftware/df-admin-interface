import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BASE_URL, URLS } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';

export type BudgetDimension = 'global' | 'service' | 'role' | 'user' | 'app';
export type BudgetPeriod = 'monthly' | 'daily' | 'hourly';

/** `/_internal` responses are not camelCased by the case interceptor. */
export interface Budget {
  id: number;
  label: string;
  dimension_type: BudgetDimension;
  dimension_id: number | null;
  dimension_name: string | null;
  period: BudgetPeriod;
  budget_usd: number;
  hard_stop: boolean;
  is_active: boolean;
  alert_webhook_url: string | null;
  has_alert_webhook_auth: boolean;
  spent_usd: number;
  remaining_usd: number;
  utilization: number;
  blocking: boolean;
}

export interface BudgetList {
  resource: Budget[];
  /** Spend comes from usage logs, so with logging off no cap can trip. */
  usage_logging_enabled: boolean;
}

export interface BudgetForm {
  id: number | null;
  label: string;
  dimension_type: BudgetDimension;
  dimension_id: number | null;
  period: BudgetPeriod;
  budget_usd: number | null;
  hard_stop: boolean;
  alert_webhook_url: string;
  /** Write-only: the API never returns it. Blank keeps the stored value. */
  alert_webhook_auth_header: string;
  has_alert_webhook_auth: boolean;
  clear_alert_webhook_auth: boolean;
}

export interface ModelAlias {
  id: number;
  name: string;
  service_id: number;
  physical_model: string;
  label: string | null;
  is_active: boolean;
}

export interface ScopeOption {
  id: number;
  label: string;
}

export const SCOPE_LABELS: Record<BudgetDimension, string> = {
  global: 'All AI spend',
  service: 'AI Connection',
  role: 'Role',
  user: 'User',
  app: 'App',
};

export function emptyBudgetForm(): BudgetForm {
  return {
    id: null,
    label: '',
    dimension_type: 'role',
    dimension_id: null,
    period: 'monthly',
    budget_usd: null,
    hard_stop: false,
    alert_webhook_url: '',
    alert_webhook_auth_header: '',
    has_alert_webhook_auth: false,
    clear_alert_webhook_auth: false,
  };
}

export function budgetToForm(budget: Budget): BudgetForm {
  return {
    ...emptyBudgetForm(),
    id: budget.id,
    label: budget.label,
    dimension_type: budget.dimension_type,
    dimension_id: budget.dimension_id,
    period: budget.period,
    budget_usd: budget.budget_usd,
    hard_stop: budget.hard_stop,
    alert_webhook_url: budget.alert_webhook_url ?? '',
    has_alert_webhook_auth: budget.has_alert_webhook_auth,
  };
}

/** Request body. Never sends a blank auth header: blank means keep it. */
export function budgetPayload(form: BudgetForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    label: form.label.trim(),
    dimension_type: form.dimension_type,
    dimension_id: form.dimension_type === 'global' ? null : form.dimension_id,
    period: form.period,
    budget_usd: form.budget_usd,
    hard_stop: form.hard_stop,
    alert_webhook_url: form.alert_webhook_url.trim() || null,
  };
  if (form.clear_alert_webhook_auth) {
    payload['clear_alert_webhook_auth'] = true;
  } else if (form.alert_webhook_auth_header.trim()) {
    payload['alert_webhook_auth_header'] =
      form.alert_webhook_auth_header.trim();
  }
  return payload;
}

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private http = inject(HttpClient);

  list(): Observable<BudgetList> {
    return this.http.get<BudgetList>('/_internal/ai/budgets', {
      context: silent(),
    });
  }

  create(payload: Record<string, unknown>): Observable<Budget> {
    return this.http.post<Budget>('/_internal/ai/budgets', payload, {
      context: toastOff(),
    });
  }

  update(id: number, payload: Record<string, unknown>): Observable<Budget> {
    return this.http.patch<Budget>(`/_internal/ai/budgets/${id}`, payload, {
      context: toastOff(),
    });
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`/_internal/ai/budgets/${id}`, {
      context: toastOff(),
    });
  }

  aliases(): Observable<ModelAlias[]> {
    return this.http
      .get<{ resource: ModelAlias[] }>('/_internal/ai/aliases', {
        context: silent(),
      })
      .pipe(map(r => r.resource));
  }

  createAlias(payload: Partial<ModelAlias>): Observable<ModelAlias> {
    return this.http.post<ModelAlias>('/_internal/ai/aliases', payload, {
      context: toastOff(),
    });
  }

  updateAlias(
    id: number,
    payload: Partial<ModelAlias>
  ): Observable<ModelAlias> {
    return this.http.patch<ModelAlias>(`/_internal/ai/aliases/${id}`, payload, {
      context: toastOff(),
    });
  }

  /** Records a rule can be scoped to, by name. */
  // ponytail: first 1000 records, searched in the browser. Search on the server
  // if an install has more users than that.
  scopeOptions(dimension: BudgetDimension): Observable<ScopeOption[]> {
    const lookups: Record<
      Exclude<BudgetDimension, 'global'>,
      { url: string; fields: string; filter?: string }
    > = {
      service: {
        url: `${BASE_URL}/system/service`,
        fields: 'id,label,name',
        filter: 'type=ai_connection',
      },
      role: { url: URLS.ROLES, fields: 'id,name' },
      user: { url: `${BASE_URL}/system/user`, fields: 'id,name,email' },
      app: { url: URLS.APP, fields: 'id,name' },
    };
    if (dimension === 'global') {
      return of([]);
    }

    const { url, fields, filter } = lookups[dimension];
    const params: Record<string, string> = { fields, limit: '1000' };
    if (filter) {
      params['filter'] = filter;
    }

    return this.http
      .get<{
        resource: {
          id: number;
          name: string;
          label?: string;
          email?: string;
        }[];
      }>(url, { params, context: silent() })
      .pipe(
        map(r =>
          r.resource.map(row => ({
            id: row.id,
            label: row.email
              ? `${row.name} (${row.email})`
              : row.label || row.name,
          }))
        )
      );
  }
}
