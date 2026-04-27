import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { UsageSessionRow } from '../types/usage';
import { ChatService } from 'src/app/adf-ai-chat/types/chat';

interface ServiceListResponse {
  resource: ChatService[];
}

interface SessionListResponse {
  resource: Array<UsageSessionRow>;
}

interface RoleRow {
  id: number;
  name: string;
}

interface UserRow {
  id: number;
  name: string;
  username: string;
  email: string;
}

interface AiConnectionRow {
  id: number;
  name: string;
  config?: { provider?: string };
}

export interface UsageBundle {
  sessions: UsageSessionRow[];
  services: ChatService[];
  users: Map<number, string>;
  roles: Map<number, string>;
  /** ai_service_id -> provider name (for cost estimation lookups). */
  connectionProviders: Map<number, string>;
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private http = inject(HttpClient);

  /**
   * Fetch every chat service's sessions and the user/role lookup tables in
   * parallel. Returns a single shaped bundle the dashboard can render.
   *
   * Client-side aggregation — fine for PoC scale. Phase 1 swaps to a backend
   * rollup endpoint.
   */
  loadAll(): Observable<UsageBundle> {
    return forkJoin({
      services: this.listChatServices(),
      users: this.listUsers(),
      roles: this.listRoles(),
      connections: this.listAiConnections(),
    }).pipe(
      switchMap(({ services, users, roles, connections }) => {
        if (services.length === 0) {
          return of({
            sessions: [] as UsageSessionRow[],
            services,
            users,
            roles,
            connectionProviders: connections,
          });
        }
        const perService = services.map(svc =>
          this.http
            .get<SessionListResponse>(`${BASE_URL}/${svc.name}/session`, {
              params: { status: 'all' },
            })
            .pipe(
              map(res =>
                (res.resource ?? []).map(s => ({
                  ...s,
                  service_name: svc.name,
                  service_label: svc.label,
                }))
              ),
              catchError(() => of([] as UsageSessionRow[]))
            )
        );
        return forkJoin(perService).pipe(
          map(arrays => ({
            sessions: arrays.flat(),
            services,
            users,
            roles,
            connectionProviders: connections,
          }))
        );
      })
    );
  }

  private listChatServices(): Observable<ChatService[]> {
    return this.http
      .get<ServiceListResponse>(`${BASE_URL}/system/service`, {
        params: {
          filter: 'type = "ai_chat"',
          fields: 'id,name,label,type,description,is_active',
        },
      })
      .pipe(
        map(res => res.resource ?? []),
        catchError(() => of([] as ChatService[]))
      );
  }

  private listUsers(): Observable<Map<number, string>> {
    return this.http
      .get<{ resource: UserRow[] }>(`${BASE_URL}/system/user`, {
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
      .get<{ resource: RoleRow[] }>(`${BASE_URL}/system/role`, {
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

  private listAiConnections(): Observable<Map<number, string>> {
    return this.http
      .get<{ resource: AiConnectionRow[] }>(`${BASE_URL}/system/service`, {
        params: {
          filter: 'type = "ai_connection"',
          fields: 'id,name,config',
          related: 'service_doc_by_service_id',
        },
      })
      .pipe(
        map(res => {
          const m = new Map<number, string>();
          (res.resource ?? []).forEach(c => {
            if (c.config?.provider) {
              m.set(c.id, c.config.provider);
            }
          });
          return m;
        }),
        catchError(() => of(new Map<number, string>()))
      );
  }
}
