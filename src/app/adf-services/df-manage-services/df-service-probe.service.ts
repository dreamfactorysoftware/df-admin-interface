import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, startWith } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { AppError, normalizeError } from 'src/app/shared/utilities/app-error';
import { toastOff } from 'src/app/shared/utilities/http-contexts';
import { healthCheckEndpointsInfo } from 'src/app/adf-api-docs/constants/health-check-endpoints';

/** `unsupported` is an honest "not checked", never folded into a pass. */
export type ProbeState = 'checking' | 'ok' | 'failed' | 'unsupported';

export interface ProbeResult {
  state: ProbeState;
  /** Only on 'failed'; carries status, request and the raw body for details. */
  error?: AppError | null;
}

/**
 * Asks a service whether it can actually answer.
 *
 * DF never re-checks a connection after the service is created - df-core's
 * ServiceHealthChecker runs on static::created and persists nothing - so
 * credentials that rot later are invisible until a request fails. This makes
 * that request: the same endpoint the API Docs page checks (/_schema for a
 * database, / for file storage, from healthCheckEndpointsInfo), keyed by the
 * route's service group.
 *
 * Results are cached per service name for the life of the app so paging back
 * and forth over a list does not re-open connections; refresh() drops the
 * cache after a config change.
 */
@Injectable({ providedIn: 'root' })
export class DfServiceProbeService {
  private cache = new Map<string, Observable<ProbeResult>>();

  constructor(private http: HttpClient) {}

  /** The probe endpoint for a route group, or undefined when the type has no
   * defined way to be checked (scripting, remote, auth, most utilities). */
  endpointFor(group?: string | null): string | undefined {
    return group ? healthCheckEndpointsInfo[group]?.[0]?.endpoint : undefined;
  }

  /**
   * Emits 'checking' immediately, then the verdict. Types with no mapped
   * endpoint resolve straight to 'unsupported' without a request.
   */
  probe(serviceName: string, group?: string | null): Observable<ProbeResult> {
    const endpoint = this.endpointFor(group);
    if (!serviceName || !endpoint) {
      return of({ state: 'unsupported' as const });
    }

    const key = `${serviceName}:${endpoint}`;
    let probe$ = this.cache.get(key);
    if (!probe$) {
      const url = `${BASE_URL}/${serviceName}${endpoint}`;
      probe$ = this.http
        // Left as JSON on purpose: DF returns the driver's own words in an
        // { error: { message } } envelope and normalizeError can only read
        // that out of a parsed body. Asking for text (as the API Docs probe
        // does) collapses every failure into the generic errors.http5xx.
        // toastOff so a dead connection reports in place instead of throwing
        // a global error toast on page load.
        .get(url, { context: toastOff() })
        .pipe(
          map(() => ({ state: 'ok' as const })),
          catchError((error: unknown) =>
            of({
              state: 'failed' as const,
              error: normalizeError(error, { url, method: 'GET' }),
            })
          ),
          startWith({ state: 'checking' as const }),
          shareReplay(1)
        );
      this.cache.set(key, probe$);
    }
    return probe$;
  }

  /** Drop cached verdicts so the next probe re-asks. */
  refresh(serviceName?: string): void {
    if (!serviceName) {
      this.cache.clear();
      return;
    }
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${serviceName}:`)) {
        this.cache.delete(key);
      }
    }
  }
}
