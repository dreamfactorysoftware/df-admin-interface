import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BASE_URL } from '../../shared/constants/urls';
import { toastOff } from '../../shared/utilities/http-contexts';

// toast-off on every request: the data explorer components render their own
// in-page error states (with Retry), so the interceptor must not also toast.

export interface DatabaseService {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  /** Human name of the service type, e.g. "MySQL" for type "mysql". */
  typeLabel?: string;
  isActive: boolean;
}

export interface ServiceType {
  name: string;
  label?: string;
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

export interface FieldInfo {
  name: string;
  label: string;
  type: string;
  dbType: string;
  length?: number;
  precision?: number;
  scale?: number;
  default?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  refTable?: string;
  refField?: string;
  isUnique: boolean;
  isIndex: boolean;
  allowNull: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  autoIncrement: boolean;
}

export interface RelatedInfo {
  name: string;
  type: string;
  refTable: string;
  refField: string;
  field: string;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
}

export interface TableSchemaResponse {
  name: string;
  label?: string;
  plural?: string;
  field: FieldInfo[];
  related?: RelatedInfo[];
}

const DB_GROUPS = ['Database', 'Big Data'];

@Injectable({ providedIn: 'root' })
export class DataExplorerService {
  private http = inject(HttpClient);

  getDatabaseServices(): Observable<DatabaseService[]> {
    // Step 1: service types in the Database and Big Data groups. The label
    // ("MySQL", "PostgreSQL") is what the selector shows under the service
    // name; the raw type name is only used to filter services.
    const typeRequests = DB_GROUPS.map(group =>
      this.http.get<{ resource: ServiceType[] }>(
        `${BASE_URL}/system/service_type`,
        {
          params: { fields: 'name,label', group },
          headers: { 'show-loading': '', 'Cache-Control': 'no-cache, private' },
          context: toastOff(),
        }
      )
    );

    return forkJoin(typeRequests).pipe(
      map(responses => responses.flatMap(r => r.resource || [])),
      switchMap(types => {
        if (types.length === 0) {
          return new Observable<DatabaseService[]>(sub => {
            sub.next([]);
            sub.complete();
          });
        }
        const labelByType = new Map(types.map(t => [t.name, t.label]));
        const typeFilter = `(type in ("${types.map(t => t.name).join('","')}"))`;
        // Step 2: every active database service. No client-side row cap: an
        // instance with hundreds of connections must list all of them, so
        // leave the page size to the server's max_records_returned.
        return this.http
          .get<{ resource: DatabaseService[] }>(`${BASE_URL}/system/service`, {
            params: {
              filter: typeFilter,
              fields: 'id,name,label,description,type,is_active',
              sort: 'name',
            },
            headers: {
              'show-loading': '',
              'Cache-Control': 'no-cache, private',
            },
            context: toastOff(),
          })
          .pipe(
            map(res =>
              (res.resource || [])
                .filter(s => s.isActive !== false)
                .map(s => ({ ...s, typeLabel: labelByType.get(s.type) }))
            )
          );
      })
    );
  }

  getSchema(serviceName: string): Observable<TableInfo[]> {
    return this.http
      .get<SchemaResponse>(`${BASE_URL}/${serviceName}/_schema`, {
        headers: { 'show-loading': '' },
        context: toastOff(),
      })
      .pipe(
        map(res =>
          (res.resource || []).sort((a, b) => a.name.localeCompare(b.name))
        )
      );
  }

  getTableSchema(
    serviceName: string,
    tableName: string
  ): Observable<TableSchemaResponse> {
    return this.http.get<TableSchemaResponse>(
      `${BASE_URL}/${serviceName}/_schema/${tableName}`,
      {
        params: { refresh: 'true' },
        headers: { 'show-loading': '' },
        context: toastOff(),
      }
    );
  }

  getTableData(
    serviceName: string,
    tableName: string,
    limit = 50,
    offset = 0,
    order?: string,
    filter?: string
  ): Observable<TableDataResponse> {
    const params: any = {
      limit: limit.toString(),
      offset: offset.toString(),
      include_count: 'true',
    };
    if (order) {
      params.order = order;
    }
    if (filter) {
      params.filter = filter;
    }
    return this.http.get<TableDataResponse>(
      `${BASE_URL}/${serviceName}/_table/${tableName}`,
      {
        params,
        headers: { 'show-loading': '' },
        context: toastOff(),
      }
    );
  }
}
