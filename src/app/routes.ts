import { Routes } from '@angular/router';
import { ROUTES } from './shared/types/routes';
import { loggedInGuard } from './shared/guards/logged-in.guard';
import { notLoggedInGuard } from './shared/guards/not-logged-in.guard';
import { appsResolver } from './adf-apps/resolvers/manage-apps.resolver';
import {
  userResolver,
  usersResolver,
} from './adf-users/resolvers/users.resolver';
import { editAppResolver } from './adf-apps/resolvers/edit-app.resolver';
import { adminsResolver } from './adf-admins/resolvers/admins.resolver';
import {
  roleResolver,
  rolesResolver,
} from './adf-roles/resolvers/role.resolver';
import { limitsResolver } from './adf-limits/resolvers/limits.resolver';
import { serviceReportsResolver } from './adf-reports/resolvers/service-report.resolver';
import { DfProfileService } from './adf-profile/services/df-profile.service';
import { DfPasswordService } from './adf-user-management/services/df-password.service';
import { profileResolver } from './adf-profile/resolvers/profile.resolver';
import { corsConfigResolver } from './adf-config/resolvers/df-cors-config.resolver';
import { schedulerResolver } from './adf-scheduler/resolvers/scheduler.resolver';
import { DfCacheResolver } from './adf-config/resolvers/df-cache.resolver';
import { apiDocResolver } from './adf-api-docs/resolvers/api-docs.resolver';
import {
  DfEmailTemplateDetailsResolver,
  DfEmailTemplatesResolver,
} from './adf-config/resolvers/df-email-templates.resolver';
import {
  DfTableDetailsResolver,
  DfTableFieldResolver,
  DfTableRelationshipsEditResolver,
  schemaResolver,
} from './adf-schema/resolvers/df-schema.resolver';
import { DfGlobalLookupKeysResolver } from './adf-config/resolvers/df-global-lookup-keys.resolver';
import { ServiceRoutes } from './adf-services/routes';
import { servicesResolver } from './adf-services/resolvers/services.resolver';
import { HomeRoutes } from './adf-home/routes';
import { provideTranslocoScope } from '@ngneat/transloco';
import { AuthRoutes } from './adf-user-management/routes';
import { serviceTypesResolver } from './adf-services/resolvers/service-types.resolver';
import {
  entityResolver,
  entitiesResolver,
  fileResolver,
} from './adf-files/resolver/df-files.resolver';
import {
  eventScriptResolver,
  eventScriptsResolver,
} from './adf-event-scripts/resolvers/scripts.resolver';
import { eventsResolver } from './adf-event-scripts/resolvers/events.resolver';
import { systemEventsResolver } from './adf-services/resolvers/system-events.resolver';
import { checkStatusResolver } from './adf-config/resolvers/df-check-status.resolver';
import { licenseGuard } from './shared/guards/license.guard';
import { errorGaurd } from './shared/guards/error.guard';
import { paywallGuard } from './shared/guards/paywall.guard';
import { rootAdminGuard } from './shared/guards/admin.guard';
import { SERVICE_GROUPS } from './shared/constants/serviceGroups';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ROUTES.HOME,
  },
  {
    path: ROUTES.ERROR,
    loadComponent: () =>
      import('./shared/components/df-error/df-error.component').then(
        m => m.DfErrorComponent
      ),
    canActivate: [errorGaurd],
  },
  {
    path: ROUTES.AUTH,
    children: AuthRoutes,
    canActivate: [notLoggedInGuard],
    providers: [provideTranslocoScope('userManagement')],
  },
  {
    path: ROUTES.HOME,
    children: HomeRoutes,
    canActivate: [loggedInGuard, licenseGuard],
    providers: [provideTranslocoScope('home')],
  },
  {
    path: ROUTES.LICENSE_EXPIRED,
    loadComponent: () =>
      import(
        './shared/components/df-license-expired/df-license-expired.component'
      ).then(m => m.DfLicenseExpiredComponent),
    canActivate: [licenseGuard],
  },
  {
    path: ROUTES.API_CONNECTIONS,
    children: [
      {
        path: '',
        redirectTo: ROUTES.API_TYPES,
        pathMatch: 'full',
      },
      {
        path: ROUTES.API_TYPES,
        children: [
          {
            path: '',
            redirectTo: ROUTES.DATABASE,
            pathMatch: 'full',
          },
          {
            path: ROUTES.DATABASE,
            children: ServiceRoutes,
            data: {
              groups: SERVICE_GROUPS[ROUTES.DATABASE],
            },
          },
          {
            path: ROUTES.SCRIPTING,
            children: ServiceRoutes,
            data: {
              groups: SERVICE_GROUPS[ROUTES.SCRIPTING],
            },
          },
          {
            path: ROUTES.NETWORK,
            children: ServiceRoutes,
            data: {
              groups: SERVICE_GROUPS[ROUTES.NETWORK],
            },
          },
          {
            path: ROUTES.FILE,
            children: ServiceRoutes,
            data: {
              groups: SERVICE_GROUPS[ROUTES.FILE],
            },
          },
          {
            path: ROUTES.UTILITY,
            children: ServiceRoutes,
            data: {
              groups: SERVICE_GROUPS[ROUTES.UTILITY],
            },
            resolve: {
              systemEvents: systemEventsResolver,
            },
          },
        ],
        providers: [
          provideTranslocoScope('services'),
          provideTranslocoScope('scripts'),
        ],
      },
      {
        path: ROUTES.ROLE_BASED_ACCESS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-roles/df-manage-roles/df-manage-roles.component'
              ).then(m => m.DfManageRolesComponent),
            resolve: { data: rolesResolver() },
          },
          {
            path: 'create',
            loadComponent: () =>
              import(
                './adf-roles/df-role-details/df-role-details.component'
              ).then(m => m.DfRoleDetailsComponent),
            resolve: { services: servicesResolver(0) },
            data: { type: 'create' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './adf-roles/df-role-details/df-role-details.component'
              ).then(m => m.DfRoleDetailsComponent),
            resolve: { data: roleResolver, services: servicesResolver(0) },
            data: { type: 'edit' },
          },
        ],
        providers: [provideTranslocoScope('roles')],
      },
      {
        path: ROUTES.API_KEYS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-apps/df-manage-apps/df-manage-apps-table.component'
              ).then(m => m.DfManageAppsTableComponent),
            resolve: {
              data: appsResolver(0),
            },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import('./adf-apps/df-app-details/df-app-details.component').then(
                m => m.DfAppDetailsComponent
              ),
            resolve: {
              roles: rolesResolver(0),
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./adf-apps/df-app-details/df-app-details.component').then(
                m => m.DfAppDetailsComponent
              ),
            resolve: {
              roles: rolesResolver(0),
              appData: editAppResolver,
            },
          },
        ],
        providers: [provideTranslocoScope('apps')],
      },
      {
        path: ROUTES.EVENT_SCRIPTS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-event-scripts/df-manage-scripts/df-manage-scripts.component'
              ).then(m => m.DfManageScriptsComponent),
            resolve: {
              data: eventScriptsResolver,
            },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-event-scripts/df-script-details/df-script-details.component'
              ).then(m => m.DfScriptDetailsComponent),
            resolve: {
              data: eventsResolver,
            },
            data: { type: 'create' },
            canActivate: [paywallGuard(['script_Type', 'event_script'])],
          },
          {
            path: ':name',
            loadComponent: () =>
              import(
                './adf-event-scripts/df-script-details/df-script-details.component'
              ).then(m => m.DfScriptDetailsComponent),
            resolve: {
              data: eventScriptResolver,
            },
            data: { type: 'edit' },
            canActivate: [paywallGuard(['script_Type', 'event_script'])],
          },
        ],
        providers: [provideTranslocoScope('scripts')],
      },
      {
        path: ROUTES.API_DOCS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-api-docs/df-api-docs/df-api-docs-table.component'
              ).then(m => m.DfApiDocsTableComponent),
            resolve: {
              data: servicesResolver(100, '(type not like "%swagger%")'),
              serviceTypes: serviceTypesResolver,
            },
          },
          {
            path: ':name',
            loadComponent: () =>
              import('./adf-api-docs/df-api-docs/df-api-docs.component').then(
                m => m.DfApiDocsComponent
              ),
            resolve: {
              data: apiDocResolver,
            },
          },
        ],
        providers: [provideTranslocoScope('apiDocs')],
      },
    ],
    canActivate: [loggedInGuard, licenseGuard],
  },
  {
    path: ROUTES.API_SECURITY,
    children: [
      { path: '', redirectTo: ROUTES.RATE_LIMITING, pathMatch: 'full' },
      {
        path: ROUTES.RATE_LIMITING,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-limits/df-manage-limits/df-manage-limits.component'
              ).then(m => m.DfManageLimitsComponent),
            resolve: { data: limitsResolver() },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-limits/df-limit-details/df-limit-details.component'
              ).then(m => m.DfLimitDetailsComponent),
            resolve: {
              data: limitsResolver(),
              users: usersResolver(0),
              roles: rolesResolver(0),
              services: servicesResolver(0),
            },
            data: { type: 'create' },
            canActivate: [paywallGuard('limit')],
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './adf-limits/df-limit-details/df-limit-details.component'
              ).then(m => m.DfLimitDetailsComponent),
            resolve: {
              data: limitsResolver(),
              users: usersResolver(0),
              roles: rolesResolver(0),
              services: servicesResolver(0),
            },
            data: { type: 'edit' },
            canActivate: [paywallGuard('limit')],
          },
        ],
        providers: [provideTranslocoScope('limits')],
      },
      {
        path: ROUTES.AUTHENTICATION,
        children: ServiceRoutes,
        data: {
          groups: SERVICE_GROUPS[ROUTES.AUTHENTICATION],
        },
        providers: [provideTranslocoScope('services')],
      },
    ],
    canActivate: [loggedInGuard, licenseGuard],
  },
  {
    path: ROUTES.SYSTEM_SETTINGS,
    children: [
      { path: '', redirectTo: ROUTES.CONFIG, pathMatch: 'full' },
      {
        path: ROUTES.CONFIG,
        children: [
          {
            path: ROUTES.SYSTEM_INFO,
            loadComponent: () =>
              import(
                './adf-config/df-system-info/df-system-info.component'
              ).then(m => m.DfSystemInfoComponent),
            providers: [provideTranslocoScope('systemInfo')],
            resolve: {
              data: checkStatusResolver,
            },
          },
          {
            path: ROUTES.CORS,
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    './adf-config/df-cors/df-manage-cors-table.component'
                  ).then(m => m.DfManageCorsTableComponent),
                resolve: {
                  data: corsConfigResolver,
                },
              },
              {
                path: ROUTES.CREATE,
                loadComponent: () =>
                  import(
                    './adf-config/df-cors/df-cors-config-details.component'
                  ).then(m => m.DfCorsConfigDetailsComponent),
                data: { type: 'create' },
              },
              {
                path: ':id',
                loadComponent: () =>
                  import(
                    './adf-config/df-cors/df-cors-config-details.component'
                  ).then(m => m.DfCorsConfigDetailsComponent),
                resolve: {
                  data: corsConfigResolver,
                },
                data: { type: 'edit' },
              },
            ],
            providers: [provideTranslocoScope('cors')],
          },
          {
            path: ROUTES.CACHE,
            loadComponent: () =>
              import('./adf-config/df-cache/df-cache.component').then(
                m => m.DfCacheComponent
              ),
            resolve: {
              data: DfCacheResolver,
            },
            providers: [provideTranslocoScope('cache')],
          },
          {
            path: ROUTES.EMAIL_TEMPLATES,
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    './adf-config/df-email-templates/df-email-templates.component'
                  ).then(m => m.DfEmailTemplatesComponent),
                resolve: {
                  data: DfEmailTemplatesResolver,
                },
              },
              {
                path: ROUTES.CREATE,
                loadComponent: () =>
                  import(
                    './adf-config/df-email-template-details/df-email-template-details.component'
                  ).then(m => m.DfEmailTemplateDetailsComponent),
                data: { type: 'create' },
              },
              {
                path: ':id',
                loadComponent: () =>
                  import(
                    './adf-config/df-email-template-details/df-email-template-details.component'
                  ).then(m => m.DfEmailTemplateDetailsComponent),
                resolve: { data: DfEmailTemplateDetailsResolver },
                data: { type: 'edit' },
              },
            ],
            providers: [provideTranslocoScope('emailTemplates')],
          },
          {
            path: ROUTES.GLOBAL_LOOKUP_KEYS,
            loadComponent: () =>
              import(
                './adf-config/df-global-lookup-keys/df-global-lookup-keys.component'
              ).then(m => m.DfGlobalLookupKeysComponent),
            resolve: {
              data: DfGlobalLookupKeysResolver,
            },
          },
        ],
      },
      {
        path: ROUTES.SCHEDULER,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-scheduler/df-manage-scheduler/df-manage-scheduler.component'
              ).then(m => m.DfManageSchedulerComponent),
            resolve: {
              data: schedulerResolver,
            },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-scheduler/df-scheduler-details/df-scheduler-details.component'
              ).then(m => m.DfSchedulerDetailsComponent),
            resolve: {
              data: servicesResolver(0),
            },
            canActivate: [paywallGuard('scheduler')],
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './adf-scheduler/df-scheduler-details/df-scheduler-details.component'
              ).then(m => m.DfSchedulerDetailsComponent),
            resolve: {
              data: servicesResolver(0),
              schedulerObject: schedulerResolver,
            },
            canActivate: [paywallGuard('scheduler')],
          },
        ],
        providers: [provideTranslocoScope('scheduler')],
      },
      {
        path: ROUTES.LOGS,
        children: ServiceRoutes,
        data: {
          groups: SERVICE_GROUPS[ROUTES.LOGS],
        },
        resolve: {
          systemEvents: systemEventsResolver,
        },
        providers: [provideTranslocoScope('services')],
      },
      {
        path: ROUTES.REPORTING,
        loadComponent: () =>
          import(
            './adf-reports/df-manage-service-report/df-manage-service-report.component'
          ).then(m => m.DfManageServiceReportComponent),
        resolve: { data: serviceReportsResolver },
      },
      {
        path: ROUTES.DF_PLATFORM_APIS,
        children: ServiceRoutes,
        data: {
          system: true,
        },
        providers: [provideTranslocoScope('services')],
      },
    ],
    canActivate: [loggedInGuard, licenseGuard],
  },
  {
    path: ROUTES.ADMIN_SETTINGS,
    children: [
      { path: '', redirectTo: ROUTES.ADMINS, pathMatch: 'full' },
      {
        path: ROUTES.ADMINS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-admins/df-manage-admins/df-manage-admins.component'
              ).then(m => m.DfManageAdminsComponent),
            resolve: { data: adminsResolver() },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-admins/df-admin-details/df-admin-details.component'
              ).then(m => m.DfAdminDetailsComponent),
            data: { type: 'create' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './adf-admins/df-admin-details/df-admin-details.component'
              ).then(m => m.DfAdminDetailsComponent),
            resolve: { data: adminsResolver() },
            data: { type: 'edit' },
          },
        ],
        providers: [
          provideTranslocoScope('admins'),
          provideTranslocoScope('userManagement'),
        ],
        canActivate: [rootAdminGuard],
      },
      {
        path: ROUTES.SCHEMA,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-schema/df-manage-databases-table/df-manage-databases-table.component'
              ).then(m => m.DfManageDatabasesTableComponent),
            resolve: {
              data: servicesResolver(),
            },
          },
          {
            path: ':name',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    './adf-schema/df-manage-tables-table/df-manage-tables-table.component'
                  ).then(m => m.DfManageTablesTableComponent),
                resolve: {
                  data: schemaResolver,
                },
              },
              {
                path: ROUTES.CREATE,
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import(
                        './adf-schema/df-table-details/df-table-details.component'
                      ).then(m => m.DfTableDetailsComponent),
                    data: { type: 'create' },
                  },
                  {
                    path: ':fieldName',
                    loadComponent: () =>
                      import(
                        './adf-schema/df-field-details/df-field-details.component'
                      ).then(m => m.DfFieldDetailsComponent),
                    data: { type: 'edit' },
                  },
                ],
              },
              {
                path: ':id',
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import(
                        './adf-schema/df-table-details/df-table-details.component'
                      ).then(m => m.DfTableDetailsComponent),
                    resolve: { data: DfTableDetailsResolver },
                    data: { type: 'edit' },
                  },
                  {
                    path: ROUTES.FIELDS,
                    children: [
                      {
                        path: '',
                        redirectTo: ROUTES.CREATE,
                        pathMatch: 'full',
                      },
                      {
                        path: ROUTES.CREATE,
                        loadComponent: () =>
                          import(
                            './adf-schema/df-field-details/df-field-details.component'
                          ).then(m => m.DfFieldDetailsComponent),
                        data: { type: 'create' },
                      },
                      {
                        path: ':fieldName',
                        loadComponent: () =>
                          import(
                            './adf-schema/df-field-details/df-field-details.component'
                          ).then(m => m.DfFieldDetailsComponent),
                        data: { type: 'edit' },
                      },
                    ],
                  },
                  {
                    path: ROUTES.RELATIONSHIPS,
                    children: [
                      {
                        path: '',
                        redirectTo: ROUTES.CREATE,
                        pathMatch: 'full',
                      },
                      {
                        path: ROUTES.CREATE,
                        loadComponent: () =>
                          import(
                            './adf-schema/df-relationship-details/df-relationship-details.component'
                          ).then(m => m.DfRelationshipDetailsComponent),
                        resolve: {
                          fields: DfTableFieldResolver,
                          services: servicesResolver(0),
                        },
                        data: { type: 'create' },
                      },
                      {
                        path: ':relName',
                        loadComponent: () =>
                          import(
                            './adf-schema/df-relationship-details/df-relationship-details.component'
                          ).then(m => m.DfRelationshipDetailsComponent),
                        resolve: {
                          data: DfTableRelationshipsEditResolver,
                          fields: DfTableFieldResolver,
                          services: servicesResolver(0),
                        },
                        data: { type: 'edit' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        providers: [provideTranslocoScope('schema')],
        data: {
          groups: ['Database'],
          system: false,
        },
      },
      {
        path: ROUTES.USERS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './adf-users/df-manage-users/df-manage-users.component'
              ).then(m => m.DfManageUsersComponent),
            resolve: { data: usersResolver() },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-users/df-user-details/df-user-details.component'
              ).then(m => m.DfUserDetailsComponent),
            data: { type: 'create' },
            resolve: {
              apps: appsResolver(0),
              roles: rolesResolver(0),
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './adf-users/df-user-details/df-user-details.component'
              ).then(m => m.DfUserDetailsComponent),
            resolve: {
              data: userResolver,
              apps: appsResolver(0),
              roles: rolesResolver(0),
            },
            data: { type: 'edit' },
          },
        ],
        providers: [
          provideTranslocoScope('users'),
          provideTranslocoScope('roles'),
          provideTranslocoScope('userManagement'),
        ],
      },
      {
        path: ROUTES.FILES,
        data: { type: 'files' },
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./adf-files/df-files/df-files.component').then(
                m => m.DfFilesComponent
              ),
            resolve: { data: entitiesResolver },
          },
          {
            path: ':entity',
            loadComponent: () =>
              import('./adf-files/df-files/df-files.component').then(
                m => m.DfFilesComponent
              ),
            resolve: { data: entityResolver },
          },
        ],
        providers: [provideTranslocoScope('files')],
      },
      {
        path: ROUTES.LOGS,
        data: { type: 'logs' },
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./adf-files/df-files/df-files.component').then(
                m => m.DfFilesComponent
              ),
            resolve: { data: entitiesResolver },
          },
          {
            path: `${ROUTES.VIEW}/:entity`,
            loadComponent: () =>
              import('./adf-files/df-log-viewer/df-log-viewer.component').then(
                m => m.DfLogViewerComponent
              ),
            resolve: { data: fileResolver },
          },
          {
            path: ':entity',
            loadComponent: () =>
              import('./adf-files/df-files/df-files.component').then(
                m => m.DfFilesComponent
              ),
            resolve: { data: entityResolver },
          },
        ],
        providers: [provideTranslocoScope('files')],
      },
    ],
    canActivate: [loggedInGuard, licenseGuard],
  },
  {
    path: ROUTES.PROFILE,
    loadComponent: () =>
      import('./adf-profile/df-profile/df-profile.component').then(
        m => m.DfProfileComponent
      ),
    resolve: { data: profileResolver },
    canActivate: [loggedInGuard, licenseGuard],
    providers: [
      DfProfileService,
      DfPasswordService,
      provideTranslocoScope('userManagement'),
    ],
  },
];
