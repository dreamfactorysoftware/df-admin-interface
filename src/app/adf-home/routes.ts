import { Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';

export const HomeRoutes: Routes = [
  { path: '', redirectTo: ROUTES.WELCOME, pathMatch: 'full' },
  {
    path: ROUTES.WELCOME,
    loadComponent: () =>
      import('./df-welcome-page/df-welcome-page.component').then(
        m => m.DfWelcomePageComponent
      ),
  },
  {
    path: ROUTES.QUICKSTART,
    loadComponent: () =>
      import('./df-quickstart-page/df-quickstart-page.component').then(
        m => m.DfQuickstartPageComponent
      ),
  },
  {
    path: ROUTES.RESOURCES,
    loadComponent: () =>
      import('./df-resources-page/df-resources-page.component').then(
        m => m.DfResourcesPageComponent
      ),
  },
  {
    path: ROUTES.DOWNLOAD,
    loadComponent: () =>
      import('./df-download-page/df-download-page.component').then(
        m => m.DfDownloadPageComponent
      ),
  },
];
