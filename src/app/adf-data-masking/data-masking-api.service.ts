/**
 * HTTP for /api/v2/system/data_masking (backend contract, section 8). Wire
 * keys are snake_case: the case interceptor camelCases responses and
 * snake_cases request bodies, so this file speaks camelCase only. Data
 * (class ids, column names, formats) is never used as an object key.
 *
 * Reads use the default error
 * handling (normalized + toasted by the error interceptor) and callers keep
 * whatever they last had, so a failed call never blanks the page. Writes
 * are toast-off: the store shows one toast and rolls back.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';
import {
  AccessPatch,
  AccessSettings,
  ActivityEvent,
  ActivityPage,
  ActivityQuery,
  BaselineSummary,
  BuiltInRules,
  DetectionRule,
  MaskSetting,
  MaskedColumn,
  MaskingMode,
  MaskingOverview,
  RuleTestResult,
  ServiceTables,
} from './data-masking.types';
import { MaskFormat } from './data-masking.catalog';

export const DATA_MASKING_URL = `${BASE_URL}/system/data_masking`;

interface ListResponse<T> {
  resource: T[];
  /** Activity: older events exist (has_more on the wire). */
  hasMore?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DfDataMaskingApiService {
  constructor(private http: HttpClient) {}

  /**
   * `quiet` skips the error toast, for callers that only peek at the
   * overview (Compliance reads the mode) and degrade on their own.
   */
  overview(quiet = false): Observable<MaskingOverview> {
    return this.http.get<MaskingOverview>(
      DATA_MASKING_URL,
      quiet ? { context: silent() } : {}
    );
  }

  setMode(mode: MaskingMode): Observable<MaskingOverview> {
    return this.http.patch<MaskingOverview>(
      DATA_MASKING_URL,
      { mode },
      { context: toastOff() }
    );
  }

  tables(): Observable<ServiceTables[]> {
    return this.http
      .get<ListResponse<ServiceTables>>(`${DATA_MASKING_URL}/table`)
      .pipe(map(r => r?.resource ?? []));
  }

  columns(service: string): Observable<MaskedColumn[]> {
    return this.http
      .get<ListResponse<MaskedColumn>>(`${DATA_MASKING_URL}/column`, {
        params: { service },
      })
      .pipe(map(r => r?.resource ?? []));
  }

  /**
   * null = not sensitive; a class id = masked with that class. The id goes
   * in the body: column names can hold characters a route segment cannot.
   */
  decide(id: string, cls: string | null): Observable<MaskedColumn> {
    return this.http.patch<MaskedColumn>(
      `${DATA_MASKING_URL}/column`,
      { id, class: cls },
      { context: toastOff() }
    );
  }

  /**
   * How many tables a database service lists (DreamFactory's own _table
   * resource). First run uses it to tell an empty database from one worth
   * scanning; it is quiet because the caller degrades on a failure.
   */
  tableCount(service: string): Observable<number> {
    return this.http
      .get<
        ListResponse<unknown>
      >(`${BASE_URL}/${encodeURIComponent(service)}/_table`, { params: { as_list: true }, context: silent() })
      .pipe(map(r => (Array.isArray(r?.resource) ? r.resource.length : 0)));
  }

  /** Compliance baselines and whether each is tracked (quiet). */
  baselines(): Observable<BaselineSummary[]> {
    return this.http
      .get<ListResponse<BaselineSummary>>(
        `${BASE_URL}/system/security_baseline`,
        {
          context: silent(),
        }
      )
      .pipe(map(r => r?.resource ?? []));
  }

  scan(service?: string): Observable<MaskingOverview> {
    return this.http.post<MaskingOverview>(
      `${DATA_MASKING_URL}/scan`,
      service ? { service } : {},
      { context: toastOff() }
    );
  }

  /** `quiet` for background re-reads that keep what is on screen. */
  access(quiet = false): Observable<AccessSettings> {
    return this.http.get<AccessSettings>(
      `${DATA_MASKING_URL}/access`,
      quiet ? { context: silent() } : {}
    );
  }

  updateAccess(patch: AccessPatch): Observable<AccessSettings> {
    return this.http.patch<AccessSettings>(
      `${DATA_MASKING_URL}/access`,
      patch,
      { context: toastOff() }
    );
  }

  masks(): Observable<MaskSetting[]> {
    return this.http
      .get<ListResponse<MaskSetting>>(`${DATA_MASKING_URL}/mask`)
      .pipe(map(r => r?.resource ?? []));
  }

  setMask(cls: string, format: MaskFormat): Observable<MaskSetting[]> {
    return this.http
      .patch<
        ListResponse<MaskSetting>
      >(`${DATA_MASKING_URL}/mask`, { resource: [{ class: cls, format }] }, { context: toastOff() })
      .pipe(map(r => r?.resource ?? []));
  }

  rules(): Observable<DetectionRule[]> {
    return this.http
      .get<ListResponse<DetectionRule>>(`${DATA_MASKING_URL}/rule`)
      .pipe(map(r => r?.resource ?? []));
  }

  builtInRules(): Observable<BuiltInRules> {
    return this.http.get<BuiltInRules>(`${DATA_MASKING_URL}/rule/builtin`);
  }

  addRule(
    rule: Pick<DetectionRule, 'match' | 'pattern' | 'class'>
  ): Observable<DetectionRule> {
    return this.http.post<DetectionRule>(`${DATA_MASKING_URL}/rule`, rule, {
      context: toastOff(),
    });
  }

  deleteRule(id: number): Observable<unknown> {
    return this.http.delete(`${DATA_MASKING_URL}/rule/${id}`, {
      context: toastOff(),
    });
  }

  testRule(
    rule: Pick<DetectionRule, 'match' | 'pattern'>
  ): Observable<RuleTestResult> {
    return this.http.post<RuleTestResult>(
      `${DATA_MASKING_URL}/rule/test`,
      rule,
      { context: toastOff() }
    );
  }

  /** One page of activity, filtered and paged by the server. */
  activity(q: ActivityQuery = {}): Observable<ActivityPage> {
    let params = new HttpParams();
    if (q.kinds?.length) params = params.set('kind', q.kinds.join(','));
    if (q.limit) params = params.set('limit', q.limit);
    if (q.before) params = params.set('before', q.before);
    return this.http
      .get<ListResponse<ActivityEvent>>(`${DATA_MASKING_URL}/activity`, {
        params,
      })
      .pipe(map(r => ({ events: r?.resource ?? [], hasMore: !!r?.hasMore })));
  }
}
