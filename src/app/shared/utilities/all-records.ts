import { HttpClient, HttpContext } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

interface RecordsPage<T> {
  resource?: T[];
  meta?: { count?: number };
}

/**
 * Every record of a DreamFactory list endpoint (e.g. system/app). The server
 * caps each response at its max records per request (DB_MAX_RECORDS_RETURNED,
 * 1000 by default) and drops the rest without saying so, so this asks for the
 * total with include_count and fetches the remainder by offset, one page at a
 * time. The number of requests depends only on how many records exist, which
 * is one on almost every instance.
 */
export function getAllRecords<T>(
  http: HttpClient,
  url: string,
  params: Record<string, string> = {},
  context?: HttpContext
): Observable<T[]> {
  const page = (offset: number) =>
    http
      .get<RecordsPage<T>>(url, {
        params: {
          ...params,
          include_count: 'true',
          ...(offset ? { offset: String(offset) } : {}),
        },
        context,
      })
      .pipe(
        map(res => ({
          rows: res?.resource ?? [],
          total: res?.meta?.count ?? 0,
          offset,
        }))
      );

  return page(0).pipe(
    expand(({ rows, total, offset }) => {
      const next = offset + rows.length;
      return rows.length && next < total ? page(next) : EMPTY;
    }),
    reduce((all, { rows }) => all.concat(rows), [] as T[])
  );
}
