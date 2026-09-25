import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent, toastOff } from 'src/app/shared/utilities/http-contexts';
import {
  SemanticDefinition,
  SemanticEntry,
  SemanticKind,
  SemanticPreviewBlock,
  SemanticValidateResult,
} from './semantic-catalog';

export interface SchemaTableInfo {
  fields: string[];
  related: string[];
}

/**
 * /api/v2/system/semantic (df-semantic) plus the service's own _schema for
 * the table and column pickers (the same endpoints the Schema screens'
 * resolvers read). Catalog calls are toast-off: every failure is shown
 * inline next to what caused it, using the server's 400 message.
 */
@Injectable({ providedIn: 'root' })
export class SemanticCatalogApiService {
  private readonly base = `${BASE_URL}/system/semantic`;

  constructor(private http: HttpClient) {}

  private svc(service: string) {
    return `${this.base}/${encodeURIComponent(service)}`;
  }

  list(service: string): Observable<SemanticEntry[]> {
    return this.http
      .get<{ resource: SemanticEntry[] }>(this.svc(service), {
        context: toastOff(),
      })
      .pipe(map(res => res?.resource ?? []));
  }

  create(
    service: string,
    entry: {
      kind: SemanticKind;
      name: string;
      description?: string;
      definition: SemanticDefinition;
    }
  ): Observable<SemanticEntry> {
    return this.http
      .post<{ resource: SemanticEntry[] }>(this.svc(service), entry, {
        context: toastOff(),
      })
      .pipe(map(res => res.resource[0]));
  }

  update(
    service: string,
    id: number,
    patch: {
      name?: string;
      description?: string;
      definition?: SemanticDefinition;
    }
  ): Observable<SemanticEntry> {
    return this.http.patch<SemanticEntry>(`${this.svc(service)}/${id}`, patch, {
      context: toastOff(),
    });
  }

  approve(service: string, id: number): Observable<SemanticEntry> {
    return this.http.post<SemanticEntry>(
      `${this.svc(service)}/${id}/approve`,
      {},
      { context: toastOff() }
    );
  }

  unapprove(service: string, id: number): Observable<SemanticEntry> {
    return this.http.post<SemanticEntry>(
      `${this.svc(service)}/${id}/unapprove`,
      {},
      { context: toastOff() }
    );
  }

  remove(service: string, id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(`${this.svc(service)}/${id}`, {
      context: toastOff(),
    });
  }

  validate(service: string): Observable<SemanticValidateResult> {
    return this.http.post<SemanticValidateResult>(
      `${this.svc(service)}/_validate`,
      {},
      { context: toastOff() }
    );
  }

  preview(service: string): Observable<SemanticPreviewBlock | null> {
    return this.http
      .get<{
        semantics: SemanticPreviewBlock | null;
      }>(`${this.svc(service)}/_preview`, { context: toastOff() })
      .pipe(map(res => res?.semantics ?? null));
  }

  /** Table names for the pickers; empty on failure (pickers fall back to text). */
  tables(service: string): Observable<string[]> {
    return this.http
      .get<{
        resource: Array<{ name: string }>;
      }>(`${BASE_URL}/${encodeURIComponent(service)}/_schema`, {
        params: { fields: 'name' },
        context: silent(),
      })
      .pipe(
        map(res => (res?.resource ?? []).map(t => t.name).sort()),
        catchError(() => of([]))
      );
  }

  /** A table's column and relationship names; null on failure. */
  table(service: string, table: string): Observable<SchemaTableInfo | null> {
    return this.http
      .get<{
        field?: Array<{ name: string }>;
        related?: Array<{ name: string }>;
      }>(
        `${BASE_URL}/${encodeURIComponent(service)}/_schema/${encodeURIComponent(table)}`,
        { context: silent() }
      )
      .pipe(
        map(res => ({
          fields: (res?.field ?? []).map(f => f.name),
          related: (res?.related ?? []).map(r => r.name),
        })),
        catchError(() => of(null))
      );
  }
}
