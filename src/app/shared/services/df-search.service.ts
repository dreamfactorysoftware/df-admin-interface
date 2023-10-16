import { Inject, Injectable } from '@angular/core';
import { SERVICE_GROUPS } from '../constants/serviceGroups';
import { ROUTES } from '../types/routes';
import {
  ADMIN_SERVICE_TOKEN,
  APP_SERVICE_TOKEN,
  EMAIL_TEMPLATES_SERVICE_TOKEN,
  EVENT_SCRIPT_SERVICE_TOKEN,
  LIMIT_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
  USER_SERVICE_TOKEN,
} from '../constants/tokens';
import { DfBaseCrudService } from './df-base-crud.service';
import {
  BehaviorSubject,
  catchError,
  forkJoin,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { GenericListResponse } from '../types/generic-http';
import { AdminProfile, UserProfile } from '../types/user';
import { Service, ServiceType } from '../types/service';
import { AppType } from '../types/apps';
import { RoleType } from '../types/role';
import { UntilDestroy } from '@ngneat/until-destroy';
import { getFilterQuery } from '../utilities/filter-queries';
import { DfPaywallService } from './df-paywall.service';

type SearchResult = Array<{
  path: string;
  items: Array<{ label: string; segment: string | number }>;
}>;

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})
export class DfSearchService {
  private resultsSubject = new BehaviorSubject<SearchResult>([]);
  results$ = this.resultsSubject.asObservable();
  private recentsSubject = new BehaviorSubject<SearchResult>([]);
  recents$ = this.recentsSubject.asObservable();

  constructor(
    @Inject(ADMIN_SERVICE_TOKEN) private adminService: DfBaseCrudService,
    @Inject(USER_SERVICE_TOKEN) private userService: DfBaseCrudService,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService,
    @Inject(SERVICE_TYPE_SERVICE_TOKEN)
    private serviceTypeService: DfBaseCrudService,
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService,
    @Inject(APP_SERVICE_TOKEN) private appService: DfBaseCrudService,
    @Inject(EVENT_SCRIPT_SERVICE_TOKEN)
    private eventScriptService: DfBaseCrudService,
    @Inject(LIMIT_SERVICE_TOKEN) private limitService: DfBaseCrudService,
    @Inject(EMAIL_TEMPLATES_SERVICE_TOKEN)
    private emailTemplatesService: DfBaseCrudService
  ) {
    this.results$.subscribe(results => {
      if (results.length) {
        this.recentsSubject.next(results);
      }
    });
  }

  search(value: string) {
    const results: SearchResult = [];
    this.resultsSubject.next(results);
    return forkJoin({
      admins: this.adminService
        .getAll<GenericListResponse<AdminProfile>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('user')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(admins => {
            if (admins && admins.resource && admins.resource.length) {
              results.push({
                path: `${ROUTES.ADMIN_SETTINGS}/${ROUTES.ADMINS}`,
                items: admins.resource.map(admin => ({
                  label: admin.name,
                  segment: admin.id,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
      users: this.userService
        .getAll<GenericListResponse<UserProfile>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('user')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(users => {
            if (users && users.resource && users.resource.length) {
              results.push({
                path: `${ROUTES.ADMIN_SETTINGS}/${ROUTES.USERS}`,
                items: users.resource.map(user => ({
                  label: user.name,
                  segment: user.id,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
      services: forkJoin({
        services: this.servicesService.getAll<GenericListResponse<Service>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('services')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        }),
        serviceTypes: this.serviceTypeService.getAll<
          GenericListResponse<ServiceType>
        >({ additionalHeaders: [{ key: 'skip-error', value: 'true' }] }),
      }).pipe(
        catchError(() => {
          return of(null);
        }),
        tap(resp => {
          if (resp && resp.serviceTypes) {
            const servicesGroupedByType: Record<string, Service[]> =
              resp.services.resource.reduce(
                (acc, service) => {
                  if (!acc[service.type]) {
                    acc[service.type] = [];
                  }
                  acc[service.type].push(service);
                  return acc;
                },
                {} as Record<string, Service[]>
              );
            const routeMap: Record<string, string> = {};
            resp.serviceTypes.resource.forEach(serviceType => {
              const route = this.getServiceRoute(serviceType.group);
              if (route) {
                routeMap[serviceType.name] = route;
              }
            });
            const groupedByRouteTemp: Record<string, Service[]> = {};
            for (const [serviceType, services] of Object.entries(
              servicesGroupedByType
            )) {
              const route = routeMap[serviceType];
              if (!groupedByRouteTemp[route]) {
                groupedByRouteTemp[route] = [];
              }
              groupedByRouteTemp[route].push(...services);
            }

            Object.entries(groupedByRouteTemp)
              .map(([route, services]) => ({ route, services }))
              .filter(
                entry =>
                  entry.services.length > 0 && entry.route !== 'undefined'
              )
              .forEach(item =>
                results.push({
                  path: item.route,
                  items: item.services.map(service => ({
                    label: service.name,
                    segment: service.id,
                  })),
                })
              );
            if (resp.services.resource.length) {
              results.push({
                path: `${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
                items: resp.services.resource.map(service => ({
                  label: service.name,
                  segment: service.name,
                })),
              });
            }
            const matchedServiceTypes: ServiceType[] =
              resp.serviceTypes.resource.filter(serviceType =>
                serviceType.name.includes(value.toLowerCase())
              );
            matchedServiceTypes.forEach(serviceType => {
              const routeForServiceType = this.getServiceRoute(
                serviceType.group
              );
              if (routeForServiceType) {
                results.push({
                  path: routeForServiceType,
                  items: [
                    {
                      label: serviceType.label,
                      segment: ROUTES.CREATE,
                    },
                  ],
                });
              }
            });
            this.resultsSubject.next(results);
          }
        })
      ),
      roles: this.roleService
        .getAll<GenericListResponse<RoleType>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('roles')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(roles => {
            if (roles && roles.resource && roles.resource.length) {
              results.push({
                path: `${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
                items: roles.resource.map(role => ({
                  label: role.name,
                  segment: role.id,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
      apps: this.appService
        .getAll<GenericListResponse<AppType>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('apps')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(apps => {
            if (apps && apps.resource && apps.resource.length) {
              results.push({
                path: `${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
                items: apps.resource.map((app: any) => ({
                  label: app.name,
                  segment: app.id,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
      eventScripts: this.eventScriptService
        .getAll<GenericListResponse<any>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('eventScripts')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(eventScripts => {
            if (
              eventScripts &&
              eventScripts.resource &&
              eventScripts.resource.length
            ) {
              results.push({
                path: `${ROUTES.API_CONNECTIONS}/${ROUTES.EVENT_SCRIPTS}`,
                items: eventScripts.resource.map(eventScript => ({
                  label: eventScript.name,
                  segment: eventScript.name,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
      limits: this.limitService
        .getAll<GenericListResponse<any>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('limits')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(limits => {
            if (limits && limits.resource && limits.resource.length) {
              results.push({
                path: `${ROUTES.API_SECURITY}/${ROUTES.RATE_LIMITING}`,
                items: limits.resource.map(limit => ({
                  label: limit.name,
                  segment: limit.id,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
      emailTemplates: this.emailTemplatesService
        .getAll<GenericListResponse<any>>({
          limit: 0,
          includeCount: false,
          filter: getFilterQuery('emailTemplates')(value),
          additionalHeaders: [{ key: 'skip-error', value: 'true' }],
        })
        .pipe(
          catchError(() => {
            return of(null);
          }),
          tap(emailTemplates => {
            if (
              emailTemplates &&
              emailTemplates.resource &&
              emailTemplates.resource.length
            ) {
              results.push({
                path: `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.EMAIL_TEMPLATES}`,
                items: emailTemplates.resource.map(emailTemplate => ({
                  label: emailTemplate.name,
                  segment: emailTemplate.id,
                })),
              });
              this.resultsSubject.next(results);
            }
          })
        ),
    });
  }

  private getServiceRoute(type: string) {
    const apiTypeRoute = `${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}`;
    const serviceRoutes = [
      {
        route: `${apiTypeRoute}/${ROUTES.DATABASE}`,
        types: SERVICE_GROUPS[ROUTES.DATABASE],
      },
      {
        route: `${apiTypeRoute}/${ROUTES.SCRIPTING}`,
        types: SERVICE_GROUPS[ROUTES.SCRIPTING],
      },
      {
        route: `${apiTypeRoute}/${ROUTES.NETWROK}`,
        types: SERVICE_GROUPS[ROUTES.NETWROK],
      },
      {
        route: `${apiTypeRoute}/${ROUTES.FILE}`,
        types: SERVICE_GROUPS[ROUTES.FILE],
      },
      {
        route: `${apiTypeRoute}/${ROUTES.UTILITY}`,
        types: SERVICE_GROUPS[ROUTES.UTILITY],
      },
      {
        route: `${ROUTES.API_SECURITY}/${ROUTES.AUTHENTICATION}`,
        types: SERVICE_GROUPS[ROUTES.AUTHENTICATION],
      },
      {
        route: `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.LOGS}`,
        types: SERVICE_GROUPS[ROUTES.LOGS],
      },
    ];
    return serviceRoutes.find(route => route.types.includes(type))?.route;
  }
}
