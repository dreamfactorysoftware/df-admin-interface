import { Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { notLoggedInGuard } from './core/guards/not-logged-in.guard';
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
import {
  ADMIN_SERVICE_PROVIDERS,
  APP_SERVICE_PROVIDERS,
  CORS_CONFIG_SERVICE_PROVIDERS,
  LIMIT_CACHE_SERVICE_PROVIDERS,
  CACHE_SERVICE_PROVIDERS,
  LIMIT_SERVICE_PROVIDERS,
  REPORT_SERVICE_PROVIDERS,
  ROLE_SERVICE_PROVIDERS,
  SCHEDULER_SERVICE_PROVIDER,
  USER_SERVICE_PROVIDERS,
  API_DOCS_SERVICE_PROVIDERS,
  EMAIL_TEMPLATES_SERVICE_PROVIDERS,
  SERVICES_SERVICE_PROVIDERS,
  SERVICE_TYPES_SERVICE_PROVIDERS,
  LOOKUP_KEYS_SERVICE_PROVIDERS,
  SERVICE_TYPE_SERVICE_PROVIDERS,
  BASE_SERVICE_PROVIDERS,
  SERVICE_SERVICE_PROVIDERS,
  SCRIPTS_SERVICE_PROVIDERS,
} from './core/constants/providers';
import { serviceReportsResolver } from './adf-reports/resolvers/service-report.resolver';
import { DfProfileService } from './adf-profile/services/df-profile.service';
import { DfPasswordService } from './adf-user-management/services/df-password.service';
import { profileResolver } from './adf-profile/resolvers/profile.resolver';
import { DfPlaceHolderComponent } from './shared/components/df-placeholder/df-placeholder.component';
import { corsConfigResolver } from './adf-config/resolvers/df-cors-config.resolver';
import { schedulerResolver } from './adf-scheduler/resolvers/scheduler.resolver';
import { DfSystemInfoResolver } from './adf-config/resolvers/df-system-info.resolver';
import { DfCacheResolver } from './adf-config/resolvers/df-cache.resolver';
import { apiDocResolver } from './adf-api-docs/resolvers/api-docs.resolver';
import {
  DfEmailTemplateDetailsResolver,
  DfEmailTemplatesResolver,
} from './adf-config/resolvers/df-email-templates.resolver';
import {
  schemaResolver,
  schemaServiceResolver,
  schemaServiceTypeResolver,
} from './adf-schema/resolvers/df-schema.resolver';
import { DfDatabaseSchemaService } from './adf-schema/services/df-database-schema.service';
import { DfGlobalLookupKeysResolver } from './adf-config/resolvers/df-global-lookup-keys.resolver';
import { ServiceRoutes } from './adf-services/routes';
import { servicesResolver } from './adf-services/resolvers/services.resolver';
import { HomeRoutes } from './adf-home/routes';
import { provideTranslocoScope } from '@ngneat/transloco';
import { AuthRoutes } from './adf-user-management/routes';
import { serviceTypesResolver } from './adf-services/resolvers/service-types.resolver';
import { DfScriptsComponent } from './adf-scripts/df-scripts/df-scripts.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ROUTES.HOME,
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
    canActivate: [loggedInGuard],
    providers: [provideTranslocoScope('home')],
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
              groups: ['Database', 'Big Data'],
            },
          },
          {
            path: ROUTES.CUSTOM,
            children: ServiceRoutes,
            data: {
              groups: ['Script', 'Remote Service'],
            },
          },
          {
            path: ROUTES.FILE,
            children: ServiceRoutes,
            data: {
              groups: ['File', 'Excel'],
            },
          },
          {
            path: ROUTES.UTILITY,
            children: ServiceRoutes,
            data: {
              groups: [
                'Cache',
                'Email',
                'Notification',
                'Log',
                'Source Control',
                'IoT',
              ],
            },
          },
        ],
        providers: [
          ...SERVICE_SERVICE_PROVIDERS,
          ...SERVICE_TYPE_SERVICE_PROVIDERS,
          provideTranslocoScope('services'),
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
                './adf-roles/df-create-role/df-create-role.component'
              ).then(m => m.DfCreateRoleComponent),
          },
          {
            path: `${ROUTES.EDIT}/:id`,
            loadComponent: () =>
              import(
                './adf-roles/df-create-role/df-create-role.component'
              ).then(m => m.DfCreateRoleComponent),
            resolve: { data: roleResolver },
          },
        ],
        providers: [...ROLE_SERVICE_PROVIDERS, provideTranslocoScope('roles')],
      },
      {
        path: ROUTES.API_KEYS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./adf-apps/df-manage-apps/df-manage-apps.component').then(
                m => m.DfManageAppsComponent
              ),
            resolve: {
              data: appsResolver(0),
            },
          },
          {
            path: `${ROUTES.EDIT}/:id`,
            loadComponent: () =>
              import('./adf-apps/df-app-details/df-app-details.component').then(
                m => m.DfAppDetailsComponent
              ),
            resolve: {
              roles: rolesResolver(0),
              appData: editAppResolver,
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
            path: ROUTES.IMPORT,
            loadComponent: () =>
              import('./adf-apps/df-import-app/df-import-app.component').then(
                m => m.DfImportAppComponent
              ),
          },
        ],
        providers: [
          ...APP_SERVICE_PROVIDERS,
          ...ROLE_SERVICE_PROVIDERS,
          provideTranslocoScope('apps'),
        ],
      },
      {
        path: ROUTES.SCRIPTS,
        component: DfScriptsComponent,
        resolve: { data: servicesResolver() },
        providers: [
          ...SCRIPTS_SERVICE_PROVIDERS,
          ...SERVICES_SERVICE_PROVIDERS,
          ...SERVICE_TYPE_SERVICE_PROVIDERS,
        ],
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
              data: servicesResolver(10, '(type not like "%swagger%")'),
              serviceTypes: serviceTypesResolver,
            },
            providers: [
              ...SERVICE_TYPE_SERVICE_PROVIDERS,
              ...SERVICE_SERVICE_PROVIDERS,
            ],
          },
          {
            path: `${ROUTES.VIEW}/:name`,
            loadComponent: () =>
              import('./adf-api-docs/df-api-docs/df-api-docs.component').then(
                m => m.DfApiDocsComponent
              ),
            resolve: {
              data: apiDocResolver,
            },
            providers: [...API_DOCS_SERVICE_PROVIDERS],
          },
        ],
        providers: [provideTranslocoScope('apiDocs')],
      },
    ],
    canActivate: [loggedInGuard],
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
              import('./adf-limits/df-limit/df-limit.component').then(
                m => m.DfLimitComponent
              ),
            resolve: {
              data: limitsResolver(),
              users: usersResolver,
              roles: rolesResolver(0),
              services: servicesResolver(0),
            },
          },
          {
            path: `${ROUTES.EDIT}/:id`,
            loadComponent: () =>
              import('./adf-limits/df-limit/df-limit.component').then(
                m => m.DfLimitComponent
              ),
            resolve: {
              data: limitsResolver(),
              users: usersResolver,
              roles: rolesResolver(0),
              services: servicesResolver(0),
            },
          },
        ],
        providers: [
          ...LIMIT_SERVICE_PROVIDERS,
          ...USER_SERVICE_PROVIDERS,
          ...ROLE_SERVICE_PROVIDERS,
          ...LIMIT_CACHE_SERVICE_PROVIDERS,
          provideTranslocoScope('limits'),
          ...SERVICE_SERVICE_PROVIDERS,
          ...SERVICE_TYPE_SERVICE_PROVIDERS,
        ],
      },
      {
        path: ROUTES.AUTHENTICATION,
        children: ServiceRoutes,
        data: {
          groups: ['LDAP', 'SSO', 'OAuth'],
        },
        providers: [
          ...SERVICE_SERVICE_PROVIDERS,
          ...SERVICE_TYPE_SERVICE_PROVIDERS,
          provideTranslocoScope('services'),
        ],
      },
    ],
    canActivate: [loggedInGuard],
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
            resolve: {
              data: DfSystemInfoResolver,
            },
            providers: [provideTranslocoScope('systemInfo')],
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
              },
              {
                path: `${ROUTES.EDIT}/:id`,
                loadComponent: () =>
                  import(
                    './adf-config/df-cors/df-cors-config-details.component'
                  ).then(m => m.DfCorsConfigDetailsComponent),
                resolve: {
                  data: corsConfigResolver,
                },
              },
            ],
            providers: [
              ...CORS_CONFIG_SERVICE_PROVIDERS,
              provideTranslocoScope('cors'),
            ],
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
            providers: [
              ...CACHE_SERVICE_PROVIDERS,
              provideTranslocoScope('cache'),
            ],
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
                path: `${ROUTES.EDIT}/:id`,
                loadComponent: () =>
                  import(
                    './adf-config/df-email-template-details/df-email-template-details.component'
                  ).then(m => m.DfEmailTemplateDetailsComponent),
                resolve: { data: DfEmailTemplateDetailsResolver },
                data: { type: 'edit' },
              },
              {
                path: ROUTES.CREATE,
                loadComponent: () =>
                  import(
                    './adf-config/df-email-template-details/df-email-template-details.component'
                  ).then(m => m.DfEmailTemplateDetailsComponent),
                data: { type: 'create' },
              },
            ],
            providers: [
              ...EMAIL_TEMPLATES_SERVICE_PROVIDERS,
              provideTranslocoScope('emailTemplates'),
            ],
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
            providers: [...LOOKUP_KEYS_SERVICE_PROVIDERS],
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
                './adf-scheduler/df-manage-scheduler/df-manage-scheduler-table.component'
              ).then(m => m.DfManageSchedulerTableComponent),
            resolve: {
              data: schedulerResolver,
            },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-scheduler/df-scheduler/df-scheduler.component'
              ).then(m => m.DfSchedulerComponent),
            resolve: {
              data: servicesResolver(0),
            },
          },
          {
            path: `${ROUTES.EDIT}/:id`,
            loadComponent: () =>
              import(
                './adf-scheduler/df-scheduler/df-scheduler.component'
              ).then(m => m.DfSchedulerComponent),
            resolve: {
              data: servicesResolver(0),
              schedulerObject: schedulerResolver,
            },
          },
        ],
        providers: [
          ...SCHEDULER_SERVICE_PROVIDER,
          ...SERVICE_TYPE_SERVICE_PROVIDERS,
          ...SERVICE_SERVICE_PROVIDERS,
          ...BASE_SERVICE_PROVIDERS,
          provideTranslocoScope('scheduler'),
        ],
      },
      {
        path: ROUTES.LOGS,
        component: DfPlaceHolderComponent,
      },
      {
        path: ROUTES.REPORTING,
        loadComponent: () =>
          import(
            './adf-reports/df-manage-service-report/df-manage-service-report-table.component'
          ).then(m => m.DfManageServiceReportTableComponent),
        resolve: { data: serviceReportsResolver },
        providers: [...REPORT_SERVICE_PROVIDERS],
      },
      {
        path: ROUTES.DF_PLATFORM_APIS,
        children: ServiceRoutes,
        data: {
          system: true,
        },
        providers: [
          ...SERVICE_SERVICE_PROVIDERS,
          ...SERVICE_TYPE_SERVICE_PROVIDERS,
          provideTranslocoScope('services'),
        ],
      },
    ],
    canActivate: [loggedInGuard],
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
            path: `${ROUTES.EDIT}/:id`,
            loadComponent: () =>
              import(
                './adf-admins/df-admin-details/df-admin-details.component'
              ).then(m => m.DfAdminDetailsComponent),
            resolve: { data: adminsResolver() },
            data: { type: 'edit' },
          },
          {
            path: ROUTES.CREATE,
            loadComponent: () =>
              import(
                './adf-admins/df-admin-details/df-admin-details.component'
              ).then(m => m.DfAdminDetailsComponent),
            data: { type: 'create' },
          },
        ],
        providers: [
          ...ADMIN_SERVICE_PROVIDERS,
          ...ROLE_SERVICE_PROVIDERS,
          provideTranslocoScope('admins'),
          provideTranslocoScope('userManagement'),
        ],
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
              data: schemaServiceResolver,
              serviceTypes: schemaServiceTypeResolver,
            },
          },
          {
            path: `${ROUTES.VIEW}/:name`,
            loadComponent: () =>
              import(
                './adf-schema/df-manage-tables-table/df-manage-tables-table.component'
              ).then(m => m.DfManageTablesTableComponent),
            resolve: {
              data: schemaResolver,
            },
          },
        ],
        providers: [
          ...SERVICES_SERVICE_PROVIDERS,
          ...SERVICE_TYPES_SERVICE_PROVIDERS,
          DfDatabaseSchemaService,
        ],
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
            resolve: { data: usersResolver },
          },
          {
            path: `${ROUTES.EDIT}/:id`,
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
        ],
        providers: [
          ...USER_SERVICE_PROVIDERS,
          ...APP_SERVICE_PROVIDERS,
          ...ROLE_SERVICE_PROVIDERS,
          provideTranslocoScope('users'),
          provideTranslocoScope('roles'),
          provideTranslocoScope('userManagement'),
        ],
      },
      {
        path: ROUTES.FILES,
        component: DfPlaceHolderComponent,
      },
    ],
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.PROFILE,
    loadComponent: () =>
      import('./adf-profile/df-profile/df-profile.component').then(
        m => m.DfProfileComponent
      ),
    resolve: { data: profileResolver },
    canActivate: [loggedInGuard],
    providers: [
      DfProfileService,
      DfPasswordService,
      provideTranslocoScope('userManagement'),
    ],
  },
  {
    path: ROUTES.LAUNCHPAD,
    component: DfPlaceHolderComponent,
    canActivate: [loggedInGuard],
  },
];
