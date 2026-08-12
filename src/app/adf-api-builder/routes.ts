import { Routes } from '@angular/router';
import { ROUTES } from '../shared/types/routes';

export const ApiBuilderRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./df-api-builder.component').then(m => m.DfApiBuilderComponent),
  },
  {
    path: ROUTES.CREATE,
    loadComponent: () =>
      import('./df-api-builder.component').then(m => m.DfApiBuilderComponent),
  },
];
