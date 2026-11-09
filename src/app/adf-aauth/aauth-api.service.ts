/**
 * HTTP for /api/v2/system/aauth (design contract 4.7). Wire keys are
 * snake_case; the case interceptor camelCases responses and snake_cases
 * request bodies, so this file speaks camelCase only.
 *
 * Reads use the default error handling (toast) unless `quiet`; writes are
 * toast-off so the store shows a single toast and rolls back.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';
import {
  AauthAgent,
  AauthGrant,
  AauthOverview,
  AauthScope,
  ActivityRow,
  AgentStatus,
  PersonServer,
  PersonServerPatch,
  PlaygroundRun,
  PlaygroundSend,
  ScopePatch,
} from './aauth.types';

export const AAUTH_URL = `${BASE_URL}/system/aauth`;

interface ListResponse<T> {
  resource: T[];
}

const list = <T>(r: ListResponse<T> | null | undefined): T[] =>
  r && Array.isArray(r.resource) ? r.resource : [];

const quietly = (quiet: boolean) => (quiet ? { context: silent() } : {});

@Injectable({ providedIn: 'root' })
export class DfAauthApiService {
  constructor(private http: HttpClient) {}

  overview(quiet = false): Observable<AauthOverview> {
    return this.http.get<AauthOverview>(AAUTH_URL, quietly(quiet));
  }

  setEnabled(enabled: boolean): Observable<AauthOverview> {
    return this.http.patch<AauthOverview>(
      AAUTH_URL,
      { enabled },
      { context: toastOff() }
    );
  }

  scopes(quiet = false): Observable<AauthScope[]> {
    return this.http
      .get<ListResponse<AauthScope>>(`${AAUTH_URL}/scopes`, quietly(quiet))
      .pipe(map(list));
  }

  updateScope(roleId: number, patch: ScopePatch): Observable<AauthScope> {
    return this.http.patch<AauthScope>(`${AAUTH_URL}/scopes/${roleId}`, patch, {
      context: toastOff(),
    });
  }

  personServers(quiet = false): Observable<PersonServer[]> {
    return this.http
      .get<
        ListResponse<PersonServer>
      >(`${AAUTH_URL}/person_servers`, quietly(quiet))
      .pipe(map(list));
  }

  addPersonServer(issuer: string): Observable<PersonServer> {
    return this.http.post<PersonServer>(
      `${AAUTH_URL}/person_servers`,
      { issuer },
      { context: toastOff() }
    );
  }

  updatePersonServer(
    id: number,
    patch: PersonServerPatch
  ): Observable<PersonServer> {
    return this.http.patch<PersonServer>(
      `${AAUTH_URL}/person_servers/${id}`,
      patch,
      { context: toastOff() }
    );
  }

  deletePersonServer(id: number): Observable<unknown> {
    return this.http.delete(`${AAUTH_URL}/person_servers/${id}`, {
      context: toastOff(),
    });
  }

  agents(quiet = false): Observable<AauthAgent[]> {
    return this.http
      .get<ListResponse<AauthAgent>>(`${AAUTH_URL}/agents`, quietly(quiet))
      .pipe(map(list));
  }

  setAgentStatus(id: number, status: AgentStatus): Observable<AauthAgent> {
    return this.http.patch<AauthAgent>(
      `${AAUTH_URL}/agents/${id}`,
      { status },
      { context: toastOff() }
    );
  }

  activity(
    limit: number,
    beforeId?: number,
    quiet = false
  ): Observable<ActivityRow[]> {
    let params = new HttpParams().set('limit', limit);
    if (beforeId) params = params.set('before_id', beforeId);
    return this.http
      .get<ListResponse<ActivityRow>>(`${AAUTH_URL}/activity`, {
        params,
        ...quietly(quiet),
      })
      .pipe(map(list));
  }

  grants(quiet = false): Observable<AauthGrant[]> {
    return this.http
      .get<ListResponse<AauthGrant>>(`${AAUTH_URL}/grants`, quietly(quiet))
      .pipe(map(list));
  }

  revokeGrant(id: number): Observable<unknown> {
    return this.http.delete(`${AAUTH_URL}/grants/${id}`, {
      context: toastOff(),
    });
  }

  playgroundSend(req: PlaygroundSend): Observable<PlaygroundRun> {
    return this.http.post<PlaygroundRun>(
      `${AAUTH_URL}/playground`,
      { action: 'send', ...req },
      { context: toastOff() }
    );
  }

  /** Background poll: silent, so a blip never toasts every 2 s. */
  playgroundAdvance(runId: string): Observable<PlaygroundRun> {
    return this.http.post<PlaygroundRun>(
      `${AAUTH_URL}/playground`,
      { action: 'advance', runId },
      { context: silent() }
    );
  }

  playgroundReset(): Observable<unknown> {
    return this.http.post(
      `${AAUTH_URL}/playground`,
      { action: 'reset' },
      { context: toastOff() }
    );
  }
}
