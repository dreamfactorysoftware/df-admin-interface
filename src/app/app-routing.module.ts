import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { notLoggedInGuard } from './core/guards/not-logged-in.guard';
import { DfServiceComponent } from './adf-services/df-service/df-service.component';
import { getSystemServiceDataResolver } from './adf-services/resolvers/manage-service.resolver';

import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { DfCreateServiceComponent } from './adf-services/df-create-service/df-create-service.component';
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ROUTES.HOME,
  },
  {
    path: 'services',
    redirectTo: ROUTES.MANAGE_SERVICES,
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
    path: ROUTES.CREATE_SERVICES,
    component: DfCreateServiceComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: ROUTES.MANAGE_SERVICES,
    component: DfServiceComponent,
    canActivate: [loggedInGuard],
    resolve: { data: getSystemServiceDataResolver },
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
