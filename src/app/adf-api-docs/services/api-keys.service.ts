import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap, of } from 'rxjs';
import { URLS } from 'src/app/shared/constants/urls';
import { ApiKeyInfo, ServiceApiKeys } from 'src/app/shared/types/api-keys';
import { getAllRecords } from 'src/app/shared/utilities/all-records';

interface RoleServiceAccess {
  serviceId: number;
  roleId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters: any[];
  filterOp: string;
  id: number;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleServiceAccess[];
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number;
}

interface App {
  name: string;
  apiKey: string;
  roleId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ApiKeysService {
  private serviceApiKeysCache = new Map<number, ServiceApiKeys>();
  private currentServiceKeys = new BehaviorSubject<ApiKeyInfo[]>([]);

  constructor(private http: HttpClient) {}

  getApiKeysForService(serviceId: number): Observable<ApiKeyInfo[]> {
    if (serviceId === -1) {
      return of([]);
    }

    if (this.serviceApiKeysCache.has(serviceId)) {
      const cached = this.serviceApiKeysCache.get(serviceId);
      if (cached) {
        this.currentServiceKeys.next(cached.keys);
        return of(cached.keys);
      }
    }

    return getAllRecords<Role>(this.http, URLS.ROLES, {
      related: 'role_service_access_by_role_id',
    }).pipe(
      switchMap(roles => {
        const relevantRoles = roles.filter(role => {
          if (!role.roleServiceAccessByRoleId) {
            return false;
          }

          return role.roleServiceAccessByRoleId.some(
            access => access.serviceId === serviceId
          );
        });

        if (!relevantRoles.length) {
          return of([]);
        }

        // All apps in one paged GET, matched to the roles here. One request
        // per role meant hundreds of parallel requests on instances with many
        // roles, which ran MySQL out of connections.
        return getAllRecords<App>(this.http, URLS.APP, {
          fields: 'name,api_key,role_id',
        }).pipe(
          map(apps => {
            const appsByRole = new Map<number, App[]>();
            for (const app of apps) {
              if (app?.roleId == null) {
                continue;
              }
              const roleApps = appsByRole.get(app.roleId) ?? [];
              roleApps.push(app);
              appsByRole.set(app.roleId, roleApps);
            }

            const keys: ApiKeyInfo[] = relevantRoles
              .flatMap(role => appsByRole.get(role.id) ?? [])
              .filter(app => !!app.apiKey)
              .map(app => ({
                name: app.name,
                apiKey: app.apiKey,
              }));

            this.serviceApiKeysCache.set(serviceId, { serviceId, keys });
            this.currentServiceKeys.next(keys);
            return keys;
          })
        );
      })
    );
  }

  clearCache() {
    this.serviceApiKeysCache.clear();
    this.currentServiceKeys.next([]);
  }
}
