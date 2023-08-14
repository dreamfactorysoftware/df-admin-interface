import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';
import { loggedInGuard } from './core/guards/logged-in.guard';
import { notLoggedInGuard } from './core/guards/not-logged-in.guard';

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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
