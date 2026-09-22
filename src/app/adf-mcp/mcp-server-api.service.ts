/**
 * df-mcp-server admin endpoints the editor reads (ported from the
 * feat/mcp-exposure df-mcp-api.service). All calls are silent and resolve
 * to null on failure — the editor falls back to its client-side simulation.
 *
 * `/_internal` responses are NOT camel-cased by the case interceptor (it
 * only rewrites /api), so their shapes stay snake_case.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent } from 'src/app/shared/utilities/http-contexts';
import {
  McpHealth,
  ServerCatalog,
  serverCatalogFromToolsList,
} from './mcp-effective';
import { McpPreviewIdentity } from './mcp-store';

@Injectable({ providedIn: 'root' })
export class McpServerApiService {
  constructor(private http: HttpClient) {}

  health(): Observable<McpHealth | null> {
    return this.http
      .get<McpHealth>('/_internal/ai/mcp-health', { context: silent() })
      .pipe(catchError(() => of(null)));
  }

  /**
   * The saved server's catalog as the admin (its own tools/list over
   * JSON-RPC — mcp-catalog has no admin view) or as a role / app key
   * (mcp-catalog, data-plane `mcp` services only).
   */
  catalog(
    serviceName: string,
    identity: McpPreviewIdentity
  ): Observable<ServerCatalog | null> {
    if (identity.roleId == null && identity.appId == null) {
      return this.http
        .post<any>(
          `${BASE_URL}/${serviceName}/rpc`,
          { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
          { context: silent() }
        )
        .pipe(
          map(res => serverCatalogFromToolsList(res?.result?.tools ?? [])),
          catchError(() => of(null))
        );
    }
    const params: Record<string, string> = { service: serviceName };
    if (identity.appId != null) params['app_id'] = String(identity.appId);
    else params['role_id'] = String(identity.roleId);
    return this.http
      .get<any>('/_internal/ai/mcp-catalog', { params, context: silent() })
      .pipe(
        map(res =>
          typeof res?.count === 'number' && typeof res?.bytes === 'number'
            ? { count: res.count, bytes: res.bytes, lazy: res.lazy === 'lazy' }
            : null
        ),
        catchError(() => of(null))
      );
  }
}
