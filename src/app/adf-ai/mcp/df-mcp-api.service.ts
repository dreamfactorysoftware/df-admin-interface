import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';
import { McpBackend, RoleAccessRow } from './mcp-model';

/*
 * Shapes served by df-mcp-server's admin endpoints. `/_internal` responses
 * are NOT camel-cased by the case interceptor (it only rewrites /api), so
 * these stay snake_case; `/api/v2/system/*` responses arrive camelCased.
 */

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

export interface McpCatalogTool {
  name: string;
  title?: string;
  description?: string;
  category?: string;
  write?: boolean;
  service?: string;
}

export interface McpCatalogBackend {
  name: string;
  type: string;
  category: 'database' | 'file' | string;
  /** Union of the role's verbs on this service: ['GET', 'POST', ...]. */
  verbs: string[];
  component_scoped: boolean;
  components: string[];
}

export interface McpCatalog {
  service?: { id: number; name: string; type: string };
  role?: { id: number; name: string; is_active: boolean };
  app_id?: number | null;
  lazy_mode?: string;
  tool_style?: string;
  backends?: McpCatalogBackend[];
  tools: McpCatalogTool[];
  count: number;
  bytes: number;
  lazy: 'lazy' | 'direct' | 'passthrough';
  facade: string[];
}

export interface McpHealth {
  status: string;
  checks: Array<{ id: string; status: string; message: string }>;
  daemons: Array<{ type: string; reachable: boolean }>;
}

export interface McpUsage {
  by_tool: Array<{ tool_name: string; requests: number }>;
  by_role: Array<{ role_id: number | null; requests: number }>;
  by_app: Array<{ app_id: number | null; requests: number }>;
  series: Array<{ date: string; requests: number }>;
  total_requests?: number;
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
  apiKey: string | null;
}

/** Calibration source for catalog bytes: which endpoint answered. */
export type CatalogSource = 'catalog' | 'rpc' | 'estimate';

@Injectable({ providedIn: 'root' })
export class DfMcpApiService {
  constructor(private http: HttpClient) {}

  /** Endpoint an MCP client connects to. */
  endpointUrl(serviceName: string): string {
    return `${window.location.origin}/mcp/${serviceName}`;
  }

  /**
   * Backends an MCP server can attach: the `exposed_services.values` of the
   * type schema when the daemon publishes them, else every active database
   * and file service. Ids come from the service table so role rows can be
   * matched to backends.
   */
  attachableBackends(
    attachableNames: string[] | null
  ): Observable<McpBackend[]> {
    return forkJoin({
      types: this.http.get<any>(`${BASE_URL}/system/service_type`, {
        params: { fields: 'name,group' },
        context: silent(),
      }),
      services: this.http.get<any>(`${BASE_URL}/system/service`, {
        params: { fields: 'id,name,label,type,is_active' },
        context: silent(),
      }),
    }).pipe(
      map(({ types, services }) => {
        const kindOf: Record<string, 'database' | 'file'> = {};
        for (const t of types?.resource ?? []) {
          if (t.group === 'Database') kindOf[t.name] = 'database';
          if (t.group === 'File') kindOf[t.name] = 'file';
        }
        const allowed = attachableNames ? new Set(attachableNames) : null;
        return (services?.resource ?? [])
          .filter(
            (s: any) =>
              s.isActive !== false &&
              kindOf[s.type] &&
              (!allowed || allowed.has(s.name))
          )
          .map(
            (s: any): McpBackend => ({
              id: s.id,
              name: s.name,
              label: s.label || s.name,
              kind: kindOf[s.type],
            })
          );
      }),
      catchError(() => of([]))
    );
  }

  /** Every service id -> name, for reach summaries across non-backends. */
  serviceNames(): Observable<Record<number, string>> {
    return this.http
      .get<any>(`${BASE_URL}/system/service`, {
        params: { fields: 'id,name' },
        context: silent(),
      })
      .pipe(
        map(res => {
          const out: Record<number, string> = {};
          for (const s of res?.resource ?? []) out[s.id] = s.name;
          return out;
        }),
        catchError(() => of({}))
      );
  }

  access(service: string | number): Observable<McpAccess | null> {
    return this.http
      .get<McpAccess>('/_internal/ai/mcp-access', {
        params: { service: String(service), period: '30d' },
        context: silent(),
      })
      .pipe(catchError(() => of(null)));
  }

  /**
   * Catalog preview as one role or app key. The endpoint needs one of the
   * two (there is no admin view); null when it is missing or errors.
   */
  catalog(
    service: string | number,
    identity: { roleId?: number; appId?: number }
  ): Observable<McpCatalog | null> {
    if (identity.appId == null && identity.roleId == null) return of(null);
    const params: Record<string, string> = { service: String(service) };
    if (identity.appId != null) params['app_id'] = String(identity.appId);
    else params['role_id'] = String(identity.roleId);
    return this.http
      .get<McpCatalog>('/_internal/ai/mcp-catalog', {
        params,
        context: silent(),
      })
      .pipe(catchError(() => of(null)));
  }

  /**
   * Fallback catalog: the server's own tools/list over JSON-RPC, as the
   * admin. Returns the tool names and the real byte size of the list.
   */
  rpcToolsList(
    serviceName: string
  ): Observable<{ names: string[]; bytes: number } | null> {
    return this.http
      .post<any>(
        `${BASE_URL}/${serviceName}/rpc`,
        { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
        { context: silent() }
      )
      .pipe(
        map(res => {
          const tools: any[] = res?.result?.tools ?? [];
          if (!tools.length) return null;
          return {
            names: tools.map(t => t.name),
            bytes: JSON.stringify(tools).length,
          };
        }),
        catchError(() => of(null))
      );
  }

  health(): Observable<McpHealth | null> {
    return this.http
      .get<McpHealth>('/_internal/ai/mcp-health', { context: silent() })
      .pipe(catchError(() => of(null)));
  }

  usage(serviceId: number, period = '7d'): Observable<McpUsage | null> {
    return this.http
      .get<McpUsage>('/_internal/ai/mcp-usage', {
        params: { period, service_id: String(serviceId) },
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

  apps(): Observable<McpApp[]> {
    return this.http
      .get<any>(`${BASE_URL}/system/app`, {
        params: { fields: 'id,name,role_id,api_key,is_active', limit: '1000' },
        context: silent(),
      })
      .pipe(
        map(res =>
          (res?.resource ?? [])
            .filter((a: any) => a.isActive !== false && a.roleId != null)
            .map(
              (a: any): McpApp => ({
                id: a.id,
                name: a.name,
                roleId: a.roleId,
                apiKey: a.apiKey ?? null,
              })
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
        {
          resource: [{ name, type: 0, role_id: roleId, is_active: true }],
        },
        { params: { fields: 'id,api_key' }, context: toastOff() }
      )
      .pipe(map(res => res?.resource?.[0]?.apiKey ?? null));
  }

  createService(payload: Record<string, unknown>): Observable<number> {
    return this.http
      .post<any>(
        `${BASE_URL}/system/service`,
        { resource: [payload] },
        { params: { fields: 'id' }, context: toastOff() }
      )
      .pipe(map(res => res?.resource?.[0]?.id));
  }
}
