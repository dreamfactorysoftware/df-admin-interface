import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { notLoggedInGuard } from './core/guards/not-logged-in.guard';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ROUTES.HOME,
  },
  {
    path: ROUTES.AUTH,
    loadChildren: () =>
      import('./adf-user-management/adf-user-management.module').then(
        m => m.AdfUserManagementModule
      ),
    canActivate: [notLoggedInGuard],
  },
  {
    path: ROUTES.HOME,
    loadChildren: () =>
      import('./adf-home/adf-home.module').then(m => m.AdfHomeModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.APPS,
    loadChildren: () =>
      import('./adf-apps/adf-apps.module').then(m => m.AdfAppsModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.PROFILE,
    loadChildren: () =>
      import('./adf-profile/adf-profile.module').then(m => m.AdfProfileModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.ADMINS,
    loadChildren: () =>
      import('./adf-admins/adf-admins.module').then(m => m.AdfAdminsModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.ROLES,
    loadChildren: () =>
      import('./adf-roles/adf-roles.module').then(m => m.AdfRolesModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.LIMITS,
    loadChildren: () =>
      import('./adf-limits/adf-limits.module').then(m => m.AdfLimitsModule),
  },
  {
    path: ROUTES.USERS,
    loadChildren: () =>
      import('./adf-users/adf-users.module').then(m => m.AdfUsersModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.REPORTS,
    loadChildren: () =>
      import('./adf-reports/adf-reports.module').then(m => m.AdfReportsModule),
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.APIDOCS,
    loadChildren: () =>
      import('./adf-api-docs/df-api-docs.module').then(m => m.DfApiDocsModule),
    canActivate: [loggedInGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
  ],
})
export class AppRoutingModule {}
