import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BASE_URL, URLS } from 'src/app/shared/constants/urls';
import { PickerItem } from 'src/app/shared/components/df-picker-list/df-picker-list.component';
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
  /**
   * False when the server has alert webhooks turned off. Then it refuses a
   * webhook URL with 400. Absent on servers that predate the switch.
   */
  alert_webhooks_enabled?: boolean;
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

/** Scope types in form order. Labels are `aiBudgets.scope.<type>` keys. */
export const SCOPE_TYPES: BudgetDimension[] = [
  'global',
  'service',
  'role',
  'user',
  'app',
];

export const BUDGET_PERIODS: BudgetPeriod[] = ['monthly', 'daily', 'hourly'];

/** Records loaded up front for a scope picker. The rest is found by search. */
export const SCOPE_LOAD_LIMIT = 100;
const SCOPE_SEARCH_LIMIT = 50;

export interface ScopePage {
  items: PickerItem[];
  /** True when the server holds more records than were loaded. */
  truncated: boolean;
}

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

/**
 * Request body. Never sends a blank auth header: blank means keep it. With
 * alert webhooks turned off on the server, no webhook field is sent at all.
 */
export function budgetPayload(
  form: BudgetForm,
  webhooksEnabled = true
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    label: form.label.trim(),
    dimension_type: form.dimension_type,
    dimension_id: form.dimension_type === 'global' ? null : form.dimension_id,
    period: form.period,
    budget_usd: form.budget_usd,
    hard_stop: form.hard_stop,
  };
  if (!webhooksEnabled) {
    return payload;
  }
  payload['alert_webhook_url'] = form.alert_webhook_url.trim() || null;
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

  /**
   * The first page of records a rule can be scoped to, by name. The picker
   * shows a bounded list; `searchScope` finds records past the first page.
   */
  scopeOptions(dimension: BudgetDimension): Observable<ScopePage> {
    if (dimension === 'global') {
      return of({ items: [], truncated: false });
    }
    const lookup = SCOPE_LOOKUPS[dimension];
    const params: Record<string, string> = {
      fields: lookup.fields,
      sort: 'name',
      limit: String(SCOPE_LOAD_LIMIT),
      include_count: 'true',
    };
    if (lookup.filter) {
      params['filter'] = lookup.filter;
    }
    return this.http
      .get<ScopeResponse>(lookup.url, { params, context: silent() })
      .pipe(
        map(res => {
          const rows = res.resource ?? [];
          return {
            items: rows.map(scopeItem),
            truncated: (res.meta?.count ?? rows.length) > rows.length,
          };
        })
      );
  }

  /** Server-side search for a scope record that the first page did not hold. */
  searchScope(
    dimension: BudgetDimension,
    query: string
  ): Observable<PickerItem[]> {
    if (dimension === 'global') {
      return of([]);
    }
    const lookup = SCOPE_LOOKUPS[dimension];
    const q = query.replace(/["\\%]/g, '');
    const match = lookup.search
      .map(field => `(${field} like "%${q}%")`)
      .join(' or ');
    const filter = lookup.filter ? `(${lookup.filter}) and (${match})` : match;
    return this.http
      .get<ScopeResponse>(lookup.url, {
        params: {
          fields: lookup.fields,
          sort: 'name',
          limit: String(SCOPE_SEARCH_LIMIT),
          filter,
        },
        context: silent(),
      })
      .pipe(map(res => (res.resource ?? []).map(scopeItem)));
  }
}

interface ScopeRow {
  id: number;
  name: string;
  label?: string;
  email?: string;
}

interface ScopeResponse {
  resource?: ScopeRow[];
  meta?: { count?: number };
}

const SCOPE_LOOKUPS: Record<
  Exclude<BudgetDimension, 'global'>,
  { url: string; fields: string; search: string[]; filter?: string }
> = {
  service: {
    url: `${BASE_URL}/system/service`,
    fields: 'id,name,label',
    search: ['name', 'label'],
    filter: 'type = "ai_connection"',
  },
  role: { url: URLS.ROLES, fields: 'id,name', search: ['name'] },
  user: {
    url: `${BASE_URL}/system/user`,
    fields: 'id,name,email',
    search: ['name', 'email'],
  },
  app: { url: URLS.APP, fields: 'id,name', search: ['name'] },
};

function scopeItem(row: ScopeRow): PickerItem {
  return {
    id: row.id,
    label: row.email ? `${row.name} (${row.email})` : row.label || row.name,
    // The search box also matches the API name behind a display label.
    keywords: row.name,
  };
}
