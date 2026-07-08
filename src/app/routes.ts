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
import { ApiBuilderRoutes } from './adf-api-builder/routes';
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
import { globalLicenseGuard } from './shared/guards/global-license.guard';
import { errorGuard } from './shared/guards/error.guard';
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
    canActivate: [errorGuard],
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
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
    providers: [provideTranslocoScope('home')],
  },
  {
    path: ROUTES.LICENSE_EXPIRED,
    loadComponent: () =>
      import('./shared/components/df-license-expired/df-license-expired.component').then(
        m => m.DfLicenseExpiredComponent
      ),
    canActivate: [licenseGuard],
  },
  {
    path: ROUTES.API_BUILDER,
    redirectTo: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.API_BUILDER}`,
    pathMatch: 'full',
    // navLinkPath lets the side-nav link straight to the destination and
    // match it for the active state; a redirect's own path never appears
    // in router.url, so without this the item could never highlight.
    data: {
      navLinkPath: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.API_BUILDER}`,
    },
  },
  {
    path: ROUTES.ALERTS,
    loadComponent: () =>
      import('./adf-alerts/df-alerts.component').then(m => m.DfAlertsComponent),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.AGENTS,
    loadComponent: () =>
      import('./adf-agents/df-agents.component').then(m => m.DfAgentsComponent),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.API_CONNECTIONS,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./adf-section-overviews/df-api-connections-overview.component').then(
            m => m.DfApiConnectionsOverviewComponent
          ),
      },
      {
        path: ROUTES.API_TYPES,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./adf-section-overviews/df-api-types-overview.component').then(
                m => m.DfApiTypesOverviewComponent
              ),
          },
          {
            path: ROUTES.API_BUILDER,
            children: ApiBuilderRoutes,
            data: {
              groups: SERVICE_GROUPS[ROUTES.API_BUILDER],
            },
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
              import('./adf-roles/df-manage-roles/df-manage-roles.component').then(
                m => m.DfManageRolesComponent
              ),
            resolve: { data: rolesResolver() },
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./adf-roles/df-role-details/df-role-details.component').then(
                m => m.DfRoleDetailsComponent
              ),
            resolve: { services: servicesResolver(0) },
            data: { type: 'create' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./adf-roles/df-role-details/df-role-details.component').then(
                m => m.DfRoleDetailsComponent
              ),
            resolve: { data: roleResolver, services: servicesResolver(0) },
            data: { type: 'edit' },
          },
          {
            path: ':id/scope',
            loadComponent: () =>
              import('./adf-roles/df-role-scope-page/df-role-scope-page.component').then(
                m => m.DfRoleScopePageComponent
              ),
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
              import('./adf-apps/df-manage-apps/df-manage-apps-table.component').then(
                m => m.DfManageAppsTableComponent
              ),
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
              import('./adf-event-scripts/df-manage-scripts/df-manage-scripts.component').then(
                m => m.DfManageScriptsComponent
              ),
            resolve: {
              data: eventScriptsResolver,
            },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import('./adf-event-scripts/df-script-details/df-script-details.component').then(
                m => m.DfScriptDetailsComponent
              ),
            resolve: {
              data: eventsResolver,
            },
            data: { type: 'create' },
            canActivate: [paywallGuard(['script_Type', 'event_script'])],
          },
          {
            path: ':name',
            loadComponent: () =>
              import('./adf-event-scripts/df-script-details/df-script-details.component').then(
                m => m.DfScriptDetailsComponent
              ),
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
              import('./adf-api-docs/df-api-docs/df-api-docs-table.component').then(
                m => m.DfApiDocsTableComponent
              ),
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
            // Angular reuses this component when navigating between services;
            // re-run the resolver on every :name change so the doc (and the
            // component's serviceName / token pickers) refresh for the new
            // service instead of showing the previously-loaded one.
            runGuardsAndResolvers: 'paramsChange',
          },
        ],
        providers: [provideTranslocoScope('apiDocs')],
      },
      {
        path: ROUTES.DATA_EXPLORER,
        loadComponent: () =>
          import('./adf-data-explorer/df-data-explorer.component').then(
            m => m.DfDataExplorerComponent
          ),
        providers: [provideTranslocoScope('dataExplorer')],
      },
    ],
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
  },
  {
    path: ROUTES.API_SECURITY,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./adf-section-overviews/df-security-overview.component').then(
            m => m.DfSecurityOverviewComponent
          ),
      },
      {
        path: ROUTES.AUTHENTICATION,
        children: ServiceRoutes,
        data: {
          groups: SERVICE_GROUPS[ROUTES.AUTHENTICATION],
        },
        providers: [provideTranslocoScope('services')],
      },
      {
        path: ROUTES.RATE_LIMITING,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./adf-limits/df-manage-limits/df-manage-limits.component').then(
                m => m.DfManageLimitsComponent
              ),
            resolve: { data: limitsResolver() },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import('./adf-limits/df-limit-details/df-limit-details.component').then(
                m => m.DfLimitDetailsComponent
              ),
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
              import('./adf-limits/df-limit-details/df-limit-details.component').then(
                m => m.DfLimitDetailsComponent
              ),
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
        path: ROUTES.ROLE_BASED_ACCESS,
        redirectTo: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
        pathMatch: 'full',
        data: {
          navLinkPath: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
          navLabelPath: `/${ROUTES.API_SECURITY}/${ROUTES.ROLE_BASED_ACCESS}`,
        },
      },
      {
        path: ROUTES.API_KEYS,
        redirectTo: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
        pathMatch: 'full',
        data: {
          navLinkPath: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
          navLabelPath: `/${ROUTES.API_SECURITY}/${ROUTES.API_KEYS}`,
        },
      },
    ],
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
  },
  {
    path: ROUTES.SYSTEM_SETTINGS,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./adf-section-overviews/df-system-overview.component').then(
            m => m.DfSystemOverviewComponent
          ),
      },
      {
        path: ROUTES.CONFIG,
        children: [
          {
            path: ROUTES.SYSTEM_INFO,
            loadComponent: () =>
              import('./adf-config/df-system-info/df-system-info.component').then(
                m => m.DfSystemInfoComponent
              ),
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
                  import('./adf-config/df-cors/df-manage-cors-table.component').then(
                    m => m.DfManageCorsTableComponent
                  ),
                resolve: {
                  data: corsConfigResolver,
                },
              },
              {
                path: ROUTES.CREATE,
                loadComponent: () =>
                  import('./adf-config/df-cors/df-cors-config-details.component').then(
                    m => m.DfCorsConfigDetailsComponent
                  ),
                data: { type: 'create' },
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./adf-config/df-cors/df-cors-config-details.component').then(
                    m => m.DfCorsConfigDetailsComponent
                  ),
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
            path: ROUTES.CONFIG_PACKAGE,
            loadComponent: () =>
              import('./adf-config/df-config-package/df-config-package.component').then(
                m => m.DfConfigPackageComponent
              ),
          },
          {
            path: ROUTES.EMAIL_TEMPLATES,
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./adf-config/df-email-templates/df-email-templates.component').then(
                    m => m.DfEmailTemplatesComponent
                  ),
                resolve: {
                  data: DfEmailTemplatesResolver,
                },
              },
              {
                path: ROUTES.CREATE,
                loadComponent: () =>
                  import('./adf-config/df-email-template-details/df-email-template-details.component').then(
                    m => m.DfEmailTemplateDetailsComponent
                  ),
                data: { type: 'create' },
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./adf-config/df-email-template-details/df-email-template-details.component').then(
                    m => m.DfEmailTemplateDetailsComponent
                  ),
                resolve: { data: DfEmailTemplateDetailsResolver },
                data: { type: 'edit' },
              },
            ],
            providers: [provideTranslocoScope('emailTemplates')],
          },
          {
            path: ROUTES.GLOBAL_LOOKUP_KEYS,
            loadComponent: () =>
              import('./adf-config/df-global-lookup-keys/df-global-lookup-keys.component').then(
                m => m.DfGlobalLookupKeysComponent
              ),
            resolve: {
              data: DfGlobalLookupKeysResolver,
            },
          },
          {
            path: ROUTES.INTERCOM,
            loadComponent: () =>
              import('./adf-config/df-intercom/df-intercom-config.component').then(
                m => m.DfIntercomConfigComponent
              ),
          },
        ],
      },
      {
        path: ROUTES.SCHEDULER,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./adf-scheduler/df-manage-scheduler/df-manage-scheduler.component').then(
                m => m.DfManageSchedulerComponent
              ),
            resolve: {
              data: schedulerResolver,
            },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import('./adf-scheduler/df-scheduler-details/df-scheduler-details.component').then(
                m => m.DfSchedulerDetailsComponent
              ),
            resolve: {
              data: servicesResolver(0),
            },
            canActivate: [paywallGuard('scheduler')],
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./adf-scheduler/df-scheduler-details/df-scheduler-details.component').then(
                m => m.DfSchedulerDetailsComponent
              ),
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
        path: ROUTES.FILE_LOGS,
        redirectTo: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.LOGS}`,
        pathMatch: 'full',
        data: {
          navLinkPath: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.LOGS}`,
          navLabelPath: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.FILE_LOGS}`,
        },
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
          import('./adf-reports/df-manage-service-report/df-manage-service-report.component').then(
            m => m.DfManageServiceReportComponent
          ),
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
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
  },
  {
    path: ROUTES.ADMIN_SETTINGS,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./adf-section-overviews/df-admin-settings-overview.component').then(
            m => m.DfAdminSettingsOverviewComponent
          ),
      },
      {
        path: ROUTES.ADMINS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./adf-admins/df-manage-admins/df-manage-admins.component').then(
                m => m.DfManageAdminsComponent
              ),
            resolve: { data: adminsResolver() },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import('./adf-admins/df-admin-details/df-admin-details.component').then(
                m => m.DfAdminDetailsComponent
              ),
            data: { type: 'create' },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./adf-admins/df-admin-details/df-admin-details.component').then(
                m => m.DfAdminDetailsComponent
              ),
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
              import('./adf-schema/df-manage-databases-table/df-manage-databases-table.component').then(
                m => m.DfManageDatabasesTableComponent
              ),
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
                  import('./adf-schema/df-manage-tables-table/df-manage-tables-table.component').then(
                    m => m.DfManageTablesTableComponent
                  ),
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
                      import('./adf-schema/df-table-details/df-table-details.component').then(
                        m => m.DfTableDetailsComponent
                      ),
                    data: { type: 'create' },
                  },
                  {
                    path: ':fieldName',
                    loadComponent: () =>
                      import('./adf-schema/df-field-details/df-field-details.component').then(
                        m => m.DfFieldDetailsComponent
                      ),
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
                      import('./adf-schema/df-table-details/df-table-details.component').then(
                        m => m.DfTableDetailsComponent
                      ),
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
                          import('./adf-schema/df-field-details/df-field-details.component').then(
                            m => m.DfFieldDetailsComponent
                          ),
                        data: { type: 'create' },
                      },
                      {
                        path: ':fieldName',
                        loadComponent: () =>
                          import('./adf-schema/df-field-details/df-field-details.component').then(
                            m => m.DfFieldDetailsComponent
                          ),
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
                          import('./adf-schema/df-relationship-details/df-relationship-details.component').then(
                            m => m.DfRelationshipDetailsComponent
                          ),
                        resolve: {
                          fields: DfTableFieldResolver,
                          services: servicesResolver(0),
                        },
                        data: { type: 'create' },
                      },
                      {
                        path: ':relName',
                        loadComponent: () =>
                          import('./adf-schema/df-relationship-details/df-relationship-details.component').then(
                            m => m.DfRelationshipDetailsComponent
                          ),
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
              import('./adf-users/df-manage-users/df-manage-users.component').then(
                m => m.DfManageUsersComponent
              ),
            resolve: { data: usersResolver() },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import('./adf-users/df-user-details/df-user-details.component').then(
                m => m.DfUserDetailsComponent
              ),
            data: { type: 'create' },
            resolve: {
              apps: appsResolver(0),
              roles: rolesResolver(0),
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./adf-users/df-user-details/df-user-details.component').then(
                m => m.DfUserDetailsComponent
              ),
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
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
  },
  {
    path: ROUTES.AI,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./adf-ai-setup/df-ai-setup.component').then(
            m => m.DfAiSetupComponent
          ),
      },
      {
        path: ROUTES.AI_SETUP,
        loadComponent: () =>
          import('./adf-ai-setup/df-ai-setup.component').then(
            m => m.DfAiSetupComponent
          ),
      },
      // Order matters: nav is auto-generated from this list. Setup and connections
      // come first because they're the gateway primary; conversations,
      // usage, and MCP are sibling consumers; chat-services is admin
      // configuration (rare touch) so it goes last.
      {
        path: ROUTES.AI_CONNECTIONS,
        children: ServiceRoutes,
        data: {
          groups: SERVICE_GROUPS[ROUTES.AI_CONNECTIONS],
        },
      },
      {
        path: ROUTES.AI_USAGE,
        loadComponent: () =>
          import('./adf-ai-usage/df-ai-usage.component').then(
            m => m.DfAiUsageComponent
          ),
      },
      {
        path: ROUTES.AI_CHAT_UI,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./adf-ai-chat/df-ai-chat.component').then(
                m => m.DfAiChatComponent
              ),
          },
          {
            path: ':sessionId',
            loadComponent: () =>
              import('./adf-ai-chat/df-ai-chat.component').then(
                m => m.DfAiChatComponent
              ),
          },
        ],
      },
      {
        path: ROUTES.AI_MCP,
        children: ServiceRoutes,
        data: {
          groups: SERVICE_GROUPS[ROUTES.AI_MCP],
        },
      },
      // Admin-only setup for the in-DF chat UI. Goes last because most
      // admins won't touch this often.
      {
        path: ROUTES.AI_CHAT_SERVICES,
        children: ServiceRoutes,
        data: {
          groups: SERVICE_GROUPS[ROUTES.AI_CHAT_SERVICES],
        },
      },
    ],
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
    providers: [provideTranslocoScope('services')],
  },
  {
    path: ROUTES.PROFILE,
    loadComponent: () =>
      import('./adf-profile/df-profile/df-profile.component').then(
        m => m.DfProfileComponent
      ),
    resolve: { data: profileResolver },
    canActivate: [loggedInGuard, licenseGuard, globalLicenseGuard],
    providers: [
      DfProfileService,
      DfPasswordService,
      provideTranslocoScope('userManagement'),
    ],
  },
];
