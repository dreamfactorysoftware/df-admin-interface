import { Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import {
  serviceResolver,
  servicesResolver,
} from './resolvers/services.resolver';
import { serviceTypesResolver } from './resolvers/service-types.resolver';

export const ServiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./df-manage-services/df-manage-services-table.component').then(
        m => m.DfManageServicesTableComponent
      ),
    resolve: {
      data: servicesResolver(),
    },
  },
  {
    path: ROUTES.CREATE,
    loadComponent: () =>
      import('./df-service-details/df-service-details.component').then(
        m => m.DfServiceDetailsComponent
      ),
    resolve: {
      serviceTypes: serviceTypesResolver,
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./df-service-details/df-service-details.component').then(
        m => m.DfServiceDetailsComponent
      ),
    resolve: {
      data: serviceResolver,
      serviceTypes: serviceTypesResolver,
    },
  },
];
