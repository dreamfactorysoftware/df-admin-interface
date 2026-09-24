import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { URLS } from '../constants/urls';
import {
  AccessUsageMeta,
  AccessUsageResult,
  AccessUsageRow,
  AccessUsageSubject,
} from '../types/access-usage';
import { mapSnakeToCamel } from '../utilities/case';
import { silent } from '../utilities/http-contexts';

export interface AccessUsageQuery {
  staleDays?: number;
  includeNeverUsed?: boolean;
}

export function unavailableAccessUsage(): AccessUsageResult {
  return { available: false, rows: new Map(), meta: null };
}

/**
 * Reads GET system/access_usage for one subject kind and indexes it by
 * subject id so list tables can join it client-side.
 *
 * Silent by design: older DreamFactory versions 404, restricted admins may
 * 403. Every failure resolves to `available: false` with no toast, and the
 * tables then look exactly as they did before the feature existed.
 */
@Injectable({ providedIn: 'root' })
export class DfAccessUsageService {
  private http = inject(HttpClient);

  load(
    subject: AccessUsageSubject,
    query: AccessUsageQuery = {}
  ): Observable<AccessUsageResult> {
    const params = new HttpParams()
      .set('subject', subject)
      .set('stale_days', String(query.staleDays ?? 90))
      .set('include_never_used', String(query.includeNeverUsed ?? true));
    return this.http
      .get<unknown>(URLS.ACCESS_USAGE, { params, context: silent() })
      .pipe(
        map(body => toAccessUsageResult(body)),
        catchError(() => of(unavailableAccessUsage()))
      );
  }
}

/**
 * Normalize a response body. The case interceptor normally camelCases it
 * already; mapping again is idempotent and keeps this robust either way.
 */
export function toAccessUsageResult(body: unknown): AccessUsageResult {
  const normalized = mapSnakeToCamel(body) as {
    resource?: unknown;
    meta?: AccessUsageMeta;
  } | null;
  if (!normalized || !Array.isArray(normalized.resource)) {
    return unavailableAccessUsage();
  }
  const rows = new Map<number, AccessUsageRow>();
  for (const item of normalized.resource as AccessUsageRow[]) {
    const id = Number(item?.subjectId);
    if (item && Number.isFinite(id)) {
      rows.set(id, { ...item, subjectId: id });
    }
  }
  return { available: true, rows, meta: normalized.meta ?? null };
}
