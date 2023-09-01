import { Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { notLoggedInGuard } from './core/guards/not-logged-in.guard';
import { urlQueryLoginGuard } from './adf-user-management/guards/url-query-login.guard';
import { oauthLoginGuard } from './adf-user-management/guards/oauth-login.guard';
import { openRegisterGuard } from './adf-user-management/guards/open-register.guard';
import { appsResolver } from './adf-apps/resolvers/manage-apps.resolver';
import {
  userResolver,
  usersResolver,
} from './adf-users/resolvers/users.resolver';
import { editAppResolver } from './adf-apps/resolvers/edit-app.resolver';
import { adminsResolver } from './adf-admins/resolvers/admins.resolver';
import { rolesResolver } from './adf-roles/resolvers/role.resolver';
import { limitsResolver } from './adf-limits/resolvers/limits.resolver';
import { getSystemServiceDataListResolver } from './adf-services/resolvers/service-data-service.resolver';
import {
  ADMIN_SERVICE_PROVIDERS,
  APP_SERVICE_PROVIDERS,
  CORS_CONFIG_SERVICE_PROVIDERS,
  LIMIT_CACHE_SERVICE_PROVIDERS,
  CACHE_SERVICE_PROVIDERS,
  LIMIT_SERVICE_PROVIDERS,
  REPORT_SERVICE_PROVIDERS,
  ROLE_SERVICE_PROVIDERS,
  USER_SERVICE_PROVIDERS,
} from './core/constants/providers';
import { serviceReportsResolver } from './adf-reports/resolvers/service-report.resolver';
import { DfProfileService } from './adf-profile/services/df-profile.service';
import { DfPasswordService } from './adf-user-management/services/df-password.service';
import { profileResolver } from './adf-profile/resolvers/profile.resolver';
import { DfServiceDataService } from './adf-services/services/service-data.service';
import { DfPlaceHolderComponent } from './shared/components/df-placeholder/df-placeholder.component';
import { corsConfigResolver } from './adf-config/resolvers/df-cors-config.resolver';
import { DfSystemInfoResolver } from './adf-config/resolvers/df-system-info.resolver';
import { DfCacheResolver } from './adf-config/resolvers/df-cache.resolver';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ROUTES.HOME,
  },
  {
    path: ROUTES.AUTH,
    children: [
      { path: '', redirectTo: ROUTES.LOGIN, pathMatch: 'full' },
      {
        path: ROUTES.LOGIN,
        loadComponent: () =>
          import('./adf-user-management/df-login/df-login.component').then(
            m => m.DfLoginComponent
          ),
        canActivate: [urlQueryLoginGuard, oauthLoginGuard],
      },
      {
        path: ROUTES.REGISTER,
        loadComponent: () =>
          import(
            './adf-user-management/df-register/df-register.component'
          ).then(m => m.DfRegisterComponent),
        canActivate: [openRegisterGuard],
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        loadComponent: () =>
          import(
            './adf-user-management/df-forgot-password/df-forgot-password.component'
          ).then(m => m.DfForgotPasswordComponent),
      },
      {
        path: ROUTES.RESET_PASSWORD,
        loadComponent: () =>
          import(
            './adf-user-management/df-password-reset/df-password-reset.component'
          ).then(m => m.DfPasswordResetComponent),
        data: { type: 'reset' },
      },
      {
        path: ROUTES.USER_INVITE,
        loadComponent: () =>
          import(
            './adf-user-management/df-password-reset/df-password-reset.component'
          ).then(m => m.DfPasswordResetComponent),
        data: { type: 'invite' },
      },
      {
        path: ROUTES.REGISTER_CONFIRM,
        loadComponent: () =>
          import(
            './adf-user-management/df-password-reset/df-password-reset.component'
          ).then(m => m.DfPasswordResetComponent),
        data: { type: 'register' },
      },
    ],
    canActivate: [notLoggedInGuard],
  },
  {
    path: ROUTES.HOME,
    children: [
      { path: '', redirectTo: ROUTES.WELCOME, pathMatch: 'full' },
      {
        path: ROUTES.WELCOME,
        loadComponent: () =>
          import('./adf-home/df-welcome-page/df-welcome-page.component').then(
            m => m.DfWelcomePageComponent
          ),
      },
      {
        path: ROUTES.QUICKSTART,
        loadComponent: () =>
          import(
            './adf-home/df-quickstart-page/df-quickstart-page.component'
          ).then(m => m.DfQuickstartPageComponent),
      },
      {
        path: ROUTES.RESOURCES,
        loadComponent: () =>
          import(
            './adf-home/df-resources-page/df-resources-page.component'
          ).then(m => m.DfResourcesPageComponent),
      },
      {
        path: ROUTES.DOWNLOAD,
        loadComponent: () =>
          import('./adf-home/df-download-page/df-download-page.component').then(
            m => m.DfDownloadPageComponent
          ),
      },
    ],
    canActivate: [loggedInGuard],
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
            component: DfPlaceHolderComponent,
          },
          {
            path: ROUTES.CUSTOM,
            component: DfPlaceHolderComponent,
          },
          {
            path: ROUTES.FILE,
            component: DfPlaceHolderComponent,
          },
          {
            path: ROUTES.UTILITY,
            component: DfPlaceHolderComponent,
          },
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
        ],
        providers: [...ROLE_SERVICE_PROVIDERS],
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
              data: appsResolver,
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
        providers: [...APP_SERVICE_PROVIDERS, ...ROLE_SERVICE_PROVIDERS],
      },
      {
        path: ROUTES.SCRIPTS,
        component: DfPlaceHolderComponent,
      },
      {
        path: ROUTES.API_DOCS,
        component: DfPlaceHolderComponent,
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
              services: getSystemServiceDataListResolver,
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
              services: getSystemServiceDataListResolver,
            },
          },
        ],
        providers: [
          ...LIMIT_SERVICE_PROVIDERS,
          ...USER_SERVICE_PROVIDERS,
          ...ROLE_SERVICE_PROVIDERS,
          ...LIMIT_CACHE_SERVICE_PROVIDERS,
          DfServiceDataService,
        ],
      },
      {
        path: ROUTES.AUTHENTICATION,
        component: DfPlaceHolderComponent,
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
          },
          {
            path: ROUTES.CORS,
            providers: [...CORS_CONFIG_SERVICE_PROVIDERS],
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
            providers: [...CACHE_SERVICE_PROVIDERS],
          },
        ],
      },
      {
        path: ROUTES.SCHEDULER,
        component: DfPlaceHolderComponent,
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
        component: DfPlaceHolderComponent,
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
        providers: [...ADMIN_SERVICE_PROVIDERS, ...ROLE_SERVICE_PROVIDERS],
      },
      {
        path: ROUTES.SCHEMA,
        component: DfPlaceHolderComponent,
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
    providers: [DfProfileService, DfPasswordService],
  },
  {
    path: ROUTES.DATA,
    component: DfPlaceHolderComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.PACKAGES,
    component: DfPlaceHolderComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.LAUNCHPAD,
    component: DfPlaceHolderComponent,
    canActivate: [loggedInGuard],
  },
];
