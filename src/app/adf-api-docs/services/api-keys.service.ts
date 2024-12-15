import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap, forkJoin, of } from 'rxjs';
import { URLS } from 'src/app/shared/constants/urls';
import { ApiKeyInfo, ServiceApiKeys } from 'src/app/shared/types/api-keys';

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

interface RolesResponse {
  resource: Role[];
}

interface App {
  name: string;
  apiKey: string;
  roleId: number;
  id: number;
  description?: string;
  isActive?: boolean;
}

interface AppsResponse {
  resource: App[];
}

@Injectable({
  providedIn: 'root'
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

    return this.http.get<RolesResponse>(`${URLS.ROLES}?related=role_service_access_by_role_id`).pipe(
      switchMap((roles) => {
        const relevantRoles = roles.resource.filter(role => {
          if (!role.roleServiceAccessByRoleId) {
            return false;
          }
          
          return role.roleServiceAccessByRoleId.some(access => 
            access.serviceId === serviceId
          );
        });

        if (!relevantRoles.length) {
          return of([]);
        }

        const appRequests = relevantRoles.map(role => 
          this.http.get<AppsResponse>(`${URLS.APP}`, {
            params: {
              filter: `role_id=${role.id}`,
              fields: '*'
            }
          })
        );

        return forkJoin(appRequests).pipe(
          map((appsResponses) => {
            const keys: ApiKeyInfo[] = appsResponses
              .flatMap(response => response.resource)
              .filter((app): app is App => !!app && !!app.apiKey)
              .map(app => ({
                name: app.name,
                apiKey: app.apiKey
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