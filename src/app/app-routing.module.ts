import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { notLoggedInGuard } from './core/guards/not-logged-in.guard';
import { DfServiceComponent } from './adf-services/df-service/df-service.component';
import { getSystemServiceDataResolver } from './adf-services/resolvers/manage-service.resolver';

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
    path: ROUTES.SERVICES,
    component: DfServiceComponent,
    canActivate: [loggedInGuard],
    resolve: { data: getSystemServiceDataResolver },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
