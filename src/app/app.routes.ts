import { Routes } from '@angular/router';
import { loggedInGuard } from './shared/guards/logged-in.guard';
import { licenseGuard } from './shared/guards/license.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./adf-home/df-welcome-page/df-welcome-page.component').then(
        m => m.DfWelcomePageComponent
      ),
    canActivate: [loggedInGuard, licenseGuard],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./adf-user-management/df-login/df-login.component').then(
        m => m.DfLoginComponent
      )
  },
  // Add other routes as needed
]; 