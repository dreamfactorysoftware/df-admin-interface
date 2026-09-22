/**
 * HTTP for the Tools tab's Access section: df-mcp-server's admin-only
 * mcp-access endpoint plus the standard system role / app API. Reads are
 * silent (the section degrades); writes are toast-off (the caller shows
 * the error inline).
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';
import { RoleAccessRow } from './mcp-access';

/** `/_internal` responses are not camelCased by the case interceptor. */
export interface McpAccessRole {
  role_id: number;
  name: string;
  granted: boolean;
  requests: number;
  denied: number;
  last_seen: string | null;
}

export interface McpAccess {
  service_id: number;
  service: string;
  require_role_access: boolean;
  roles: McpAccessRole[];
}

export interface McpRole {
  id: number;
  name: string;
  isActive?: boolean;
  rows: RoleAccessRow[];
}

export interface McpApp {
  id: number;
  name: string;
  roleId: number | null;
}

@Injectable({ providedIn: 'root' })
export class DfMcpAccessApiService {
  constructor(private http: HttpClient) {}

  /** Roles seen / granted on the server over the last 30 days; null if the endpoint is missing. */
  access(serviceId: number): Observable<McpAccess | null> {
    return this.http
      .get<McpAccess>('/_internal/ai/mcp-access', {
        params: { service: String(serviceId), period: '30d' },
        context: silent(),
      })
      .pipe(catchError(() => of(null)));
  }

  roles(): Observable<McpRole[]> {
    return this.http
      .get<any>(`${BASE_URL}/system/role`, {
        params: {
          fields: 'id,name,is_active',
          related: 'role_service_access_by_role_id',
          limit: '1000',
        },
        context: silent(),
      })
      .pipe(
        map(res =>
          (res?.resource ?? []).map(
            (r: any): McpRole => ({
              id: r.id,
              name: r.name,
              isActive: r.isActive,
              rows: (r.roleServiceAccessByRoleId ?? []).map(
                (row: any): RoleAccessRow => ({
                  id: row.id,
                  serviceId: row.serviceId,
                  component: row.component,
                  verbMask: row.verbMask ?? 0,
                  requestorMask: row.requestorMask,
                  filters: row.filters ?? null,
                })
              ),
            })
          )
        ),
        catchError(() => of([]))
      );
  }

  /** Active apps bound to a role (the role's API keys, by name only). */
  apps(): Observable<McpApp[]> {
    return this.http
      .get<any>(`${BASE_URL}/system/app`, {
        params: { fields: 'id,name,role_id,is_active', limit: '1000' },
        context: silent(),
      })
      .pipe(
        map(res =>
          (res?.resource ?? [])
            .filter((a: any) => a.isActive !== false && a.roleId != null)
            .map(
              (a: any): McpApp => ({ id: a.id, name: a.name, roleId: a.roleId })
            )
        ),
        catchError(() => of([]))
      );
  }

  /** Table names of a database service (for table-level grants). */
  listTables(serviceName: string): Observable<string[]> {
    return this.http
      .get<any>(`${BASE_URL}/${serviceName}/_table`, {
        params: { as_list: 'true' },
        context: silent(),
      })
      .pipe(
        map(res => (Array.isArray(res?.resource) ? res.resource : [])),
        catchError(() => of([]))
      );
  }

  /** PATCH role access rows (update by id / create / unlink with role_id null). */
  patchRoleAccess(
    roleId: number,
    rows: Array<Record<string, unknown>>
  ): Observable<unknown> {
    return this.http.patch(
      `${BASE_URL}/system/role/${roleId}`,
      { role_service_access_by_role_id: rows },
      { context: toastOff() }
    );
  }

  createRole(
    name: string,
    description: string,
    rows: Array<Record<string, unknown>>
  ): Observable<number> {
    return this.http
      .post<any>(
        `${BASE_URL}/system/role`,
        {
          resource: [
            {
              name,
              description,
              is_active: true,
              role_service_access_by_role_id: rows,
            },
          ],
        },
        { params: { fields: 'id' }, context: toastOff() }
      )
      .pipe(map(res => res?.resource?.[0]?.id));
  }

  /** Create an app (API key) bound to a role; resolves to the key. */
  createAppKey(name: string, roleId: number): Observable<string | null> {
    return this.http
      .post<any>(
        `${BASE_URL}/system/app`,
        { resource: [{ name, type: 0, role_id: roleId, is_active: true }] },
        { params: { fields: 'id,api_key' }, context: toastOff() }
      )
      .pipe(map(res => res?.resource?.[0]?.apiKey ?? null));
  }
}
