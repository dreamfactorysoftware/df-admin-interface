import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
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
    // Step 1: Get service type names for Database and Big Data groups
    const typeRequests = DB_GROUPS.map(group =>
      this.http.get<{ resource: ServiceType[] }>(
        `${BASE_URL}/system/service_type`,
        {
          params: { fields: 'name', group },
          headers: { 'show-loading': '', 'Cache-Control': 'no-cache, private' },
          context: toastOff(),
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
          .get<{ resource: DatabaseService[] }>(`${BASE_URL}/system/service`, {
            params: {
              filter: typeFilter,
              fields: 'id,name,label,description,type',
              limit: '100',
              sort: 'name',
            },
            headers: {
              'show-loading': '',
              'Cache-Control': 'no-cache, private',
            },
            context: toastOff(),
          })
          .pipe(
            map(res => (res.resource || []).filter(s => s.isActive !== false))
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

  /**
   * One-click starter key: a role that can only GET this one table, and an
   * app (API key) bound to it. Safe to click again: an existing key or role
   * with the generated name is reused instead of failing on the unique name.
   */
  createReadOnlyKey(
    serviceName: string,
    tableName: string
  ): Observable<{ roleName: string; apiKey: string }> {
    const roleName = `${serviceName}_${tableName}_read`;
    const byName = (name: string, fields: string) => ({
      params: { filter: `name="${name}"`, fields },
      context: toastOff(),
    });
    const done = (apiKey: string) => ({ roleName, apiKey });
    return this.http
      .get<{
        resource: { apiKey: string }[];
      }>(`${BASE_URL}/system/app`, byName(roleName, 'api_key'))
      .pipe(
        switchMap(app =>
          app.resource.length
            ? of(done(app.resource[0].apiKey))
            : this.findOrCreateReadRole(serviceName, tableName, roleName).pipe(
                switchMap(roleId =>
                  this.http.post<{ resource: { apiKey: string }[] }>(
                    `${BASE_URL}/system/app`,
                    {
                      resource: [
                        {
                          name: roleName,
                          description: `API key for role ${roleName}. Created from Data Explorer.`,
                          type: 0,
                          isActive: true,
                          roleId,
                        },
                      ],
                    },
                    { params: { fields: 'api_key' }, context: toastOff() }
                  )
                ),
                map(created => done(created.resource[0].apiKey))
              )
        )
      );
  }

  private findOrCreateReadRole(
    serviceName: string,
    tableName: string,
    roleName: string
  ): Observable<number> {
    const byName = (name: string) => ({
      params: { filter: `name="${name}"`, fields: 'id' },
      context: toastOff(),
    });
    type Ids = { resource: { id: number }[] };
    return forkJoin([
      this.http.get<Ids>(`${BASE_URL}/system/role`, byName(roleName)),
      this.http.get<Ids>(`${BASE_URL}/system/service`, byName(serviceName)),
    ]).pipe(
      switchMap(([role, service]) =>
        role.resource.length
          ? of(role.resource[0].id)
          : this.http
              .post<Ids>(
                `${BASE_URL}/system/role`,
                {
                  resource: [
                    {
                      name: roleName,
                      description: `Read-only access to ${serviceName}/_table/${tableName}. Created from Data Explorer.`,
                      isActive: true,
                      roleServiceAccessByRoleId: [
                        {
                          serviceId: service.resource[0].id,
                          component: `_table/${tableName}`,
                          verbMask: 1, // GET
                          requestorMask: 1, // API
                        },
                      ],
                    },
                  ],
                },
                { context: toastOff() }
              )
              .pipe(map(created => created.resource[0].id))
      )
    );
  }
}
