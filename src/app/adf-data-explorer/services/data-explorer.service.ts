import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BASE_URL } from '../../shared/constants/urls';

export interface DatabaseService {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  isActive: boolean;
}

export interface ServiceType {
  name: string;
}

export interface TableInfo {
  name: string;
  label?: string;
  plural?: string;
}

export interface SchemaResponse {
  resource: TableInfo[];
}

export interface TableDataResponse {
  resource: any[];
  meta?: {
    count: number;
  };
}

const DB_GROUPS = ['Database', 'Big Data'];

@Injectable({ providedIn: 'root' })
export class DataExplorerService {
  private http = inject(HttpClient);

  getDatabaseServices(): Observable<DatabaseService[]> {
    // Step 1: Get service type names for Database and Big Data groups
    const typeRequests = DB_GROUPS.map(group =>
      this.http.get<{ resource: ServiceType[] }>(
        `${BASE_URL}/system/service_type`,
        {
          params: { fields: 'name', group },
          headers: { 'show-loading': '', 'Cache-Control': 'no-cache, private' },
        }
      )
    );

    return forkJoin(typeRequests).pipe(
      map(responses =>
        responses.flatMap(r => r.resource || []).map(t => t.name)
      ),
      switchMap(typeNames => {
        if (typeNames.length === 0) {
          return new Observable<DatabaseService[]>(sub => {
            sub.next([]);
            sub.complete();
          });
        }
        const typeFilter = `(type in ("${typeNames.join('","')}"))`;
        return this.http
          .get<{ resource: DatabaseService[] }>(
            `${BASE_URL}/system/service`,
            {
              params: {
                filter: typeFilter,
                fields: 'id,name,label,description,type',
                limit: '100',
                sort: 'name',
              },
              headers: { 'show-loading': '', 'Cache-Control': 'no-cache, private' },
            }
          )
          .pipe(
            map(res =>
              (res.resource || []).filter(
                s => s.isActive !== false
              )
            )
          );
      })
    );
  }

  getSchema(serviceName: string): Observable<TableInfo[]> {
    return this.http
      .get<SchemaResponse>(`${BASE_URL}/${serviceName}/_schema`, {
        headers: { 'show-loading': '' },
      })
      .pipe(
        map(res =>
          (res.resource || []).sort((a, b) => a.name.localeCompare(b.name))
        )
      );
  }

  getTableData(
    serviceName: string,
    tableName: string,
    limit = 50,
    offset = 0,
    order?: string
  ): Observable<TableDataResponse> {
    const params: any = {
      limit: limit.toString(),
      offset: offset.toString(),
      include_count: 'true',
    };
    if (order) {
      params.order = order;
    }
    return this.http.get<TableDataResponse>(
      `${BASE_URL}/${serviceName}/_table/${tableName}`,
      {
        params,
        headers: { 'show-loading': '' },
      }
    );
  }
}
