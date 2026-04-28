import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BASE_URL } from 'src/app/shared/constants/urls';

export type TimeRange = '24h' | '7d' | '30d' | 'all';

export interface UsageResponse {
  period: string;
  since: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  errors: number;
  avg_latency_ms: number;
  by_service: GroupRowRaw[];
  by_user: GroupRowRaw[];
  by_role: GroupRowRaw[];
  by_provider: GroupRowRaw[];
  by_model: ModelRowRaw[];
  by_resource: ResourceRowRaw[];
  series: SeriesRowRaw[];
}

interface GroupRowRaw {
  service_id?: number;
  user_id?: number | null;
  role_id?: number | null;
  provider?: string;
  requests: number | string;
  input_tokens: number | string;
  output_tokens: number | string;
  avg_latency?: number | string;
  errors?: number | string;
}

interface ModelRowRaw {
  model: string;
  provider: string;
  requests: number | string;
  input_tokens: number | string;
  output_tokens: number | string;
}

interface ResourceRowRaw {
  resource: string;
  requests: number | string;
}

interface SeriesRowRaw {
  date: string;
  requests: number | string;
  input_tokens: number | string;
  output_tokens: number | string;
  errors: number | string;
}

interface ServiceLookupRow {
  id: number;
  name: string;
  label?: string;
  type: string;
}

interface RoleLookupRow {
  id: number;
  name: string;
}

interface UserLookupRow {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

export interface UsageBundle {
  raw: UsageResponse;
  services: Map<number, ServiceLookupRow>;
  users: Map<number, string>;
  roles: Map<number, string>;
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private http = inject(HttpClient);

  loadAll(range: TimeRange): Observable<UsageBundle> {
    const period = range === 'all' ? '3650d' : range;

    return forkJoin({
      raw: this.http
        .get<UsageResponse>('/_internal/ai/usage', { params: { period } })
        .pipe(
          catchError(() =>
            of({
              period,
              since: new Date(Date.now() - 7 * 86400000).toISOString(),
              total_requests: 0,
              total_input_tokens: 0,
              total_output_tokens: 0,
              errors: 0,
              avg_latency_ms: 0,
              by_service: [],
              by_user: [],
              by_role: [],
              by_provider: [],
              by_model: [],
              by_resource: [],
              series: [],
            } as UsageResponse)
          )
        ),
      services: this.listServices(),
      users: this.listUsers(),
      roles: this.listRoles(),
    }).pipe(map(b => b));
  }

  private listServices(): Observable<Map<number, ServiceLookupRow>> {
    return this.http
      .get<{ resource: ServiceLookupRow[] }>(`${BASE_URL}/system/service`, {
        params: {
          fields: 'id,name,label,type',
          filter: '(type = "ai_connection") or (type = "ai_chat")',
        },
      })
      .pipe(
        map(res => {
          const m = new Map<number, ServiceLookupRow>();
          (res.resource ?? []).forEach(s => m.set(s.id, s));
          return m;
        }),
        catchError(() => of(new Map<number, ServiceLookupRow>()))
      );
  }

  private listUsers(): Observable<Map<number, string>> {
    // /api/v2/system/admin requires root-admin and is gated by df-compliance
    // (returns 500/403 for restricted admins). We only fetch /system/user
    // here — admin names not appearing in the dashboard is acceptable; the
    // by_user breakdown falls back to "user #N".
    return this.http
      .get<{ resource: UserLookupRow[] }>(`${BASE_URL}/system/user`, {
        params: { fields: 'id,name,username,email' },
      })
      .pipe(
        map(res => {
          const m = new Map<number, string>();
          (res.resource ?? []).forEach(u =>
            m.set(u.id, u.name || u.username || u.email || `user #${u.id}`)
          );
          return m;
        }),
        catchError(() => of(new Map<number, string>()))
      );
  }

  private listRoles(): Observable<Map<number, string>> {
    return this.http
      .get<{ resource: RoleLookupRow[] }>(`${BASE_URL}/system/role`, {
        params: { fields: 'id,name' },
      })
      .pipe(
        map(res => {
          const m = new Map<number, string>();
          (res.resource ?? []).forEach(r => m.set(r.id, r.name));
          return m;
        }),
        catchError(() => of(new Map<number, string>()))
      );
  }
}

/** Helpers used by the dashboard to render group rows. The backend may
 *  return numeric fields as strings (DB driver dependent) — coerce here. */
export function n(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  if (typeof v === 'string') {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}
