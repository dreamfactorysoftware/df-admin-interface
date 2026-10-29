/**
 * HTTP for /api/v2/system/security_baseline (backend contract, section 8).
 * Reads use the default error handling (normalized + toasted by the error
 * interceptor); writes and report downloads are toast-off, so the store
 * shows exactly one toast and keeps what it had.
 */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';
import {
  BaselineChange,
  BaselineDetail,
  BaselineSummary,
  ReportFormat,
} from './compliance.types';

export const SECURITY_BASELINE_URL = `${BASE_URL}/system/security_baseline`;

const REPORT_ACCEPT: Record<ReportFormat, string> = {
  json: 'application/json',
  csv: 'text/csv',
};

@Injectable({ providedIn: 'root' })
export class DfComplianceApiService {
  constructor(private http: HttpClient) {}

  private url(id: string, sub = ''): string {
    return `${SECURITY_BASELINE_URL}/${encodeURIComponent(id)}${sub}`;
  }

  list(): Observable<BaselineSummary[]> {
    return this.http
      .get<{ resource: BaselineSummary[] }>(SECURITY_BASELINE_URL)
      .pipe(map(r => r?.resource ?? []));
  }

  get(id: string): Observable<BaselineDetail> {
    return this.http.get<BaselineDetail>(this.url(id));
  }

  /**
   * What Apply with `{mode: 'on'}` would change now (GET ?mode=on): the
   * same list as `changes`, plus turning masking on. Read-only, and quiet:
   * the Apply dialog falls back to the plain list if it fails.
   */
  changesWithModeOn(id: string): Observable<BaselineChange[]> {
    return this.http
      .get<BaselineDetail>(this.url(id), {
        params: { mode: 'on' },
        context: silent(),
      })
      .pipe(map(d => d?.changes ?? []));
  }

  /** Adopts the baseline and applies its changes; `turnOn` also sets mode on. */
  apply(id: string, turnOn = false): Observable<BaselineDetail> {
    return this.http.post<BaselineDetail>(
      this.url(id, '/apply'),
      turnOn ? { mode: 'on' } : {},
      { context: toastOff() }
    );
  }

  /** Stop tracking: the baseline is no longer adopted; settings stay. */
  stopTracking(id: string): Observable<unknown> {
    return this.http.delete(this.url(id), { context: toastOff() });
  }

  /**
   * The evidence report, verbatim. Read as text, not as a blob: the case
   * interceptor camelCases every application/json body it sees, and a Blob
   * run through it comes back as `{}`. Text passes through untouched, so
   * the saved file is byte-for-byte what the server sent.
   */
  report(id: string, format: ReportFormat): Observable<string> {
    return this.http.get(this.url(id, '/report'), {
      params: { format },
      headers: new HttpHeaders({ Accept: REPORT_ACCEPT[format] }),
      responseType: 'text',
      context: toastOff(),
    });
  }
}
