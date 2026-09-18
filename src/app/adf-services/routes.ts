import { Routes } from '@angular/router';
import { ROUTES } from '../shared/types/routes';
import { serviceResolver } from './resolvers/services.resolver';
import { serviceTypesResolver } from './resolvers/service-types.resolver';
import { serviceChanged, serviceDetailMatcher } from '../adf-ai/mcp/mcp-tabs';

export const ServiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./df-manage-services/df-manage-services.component').then(
        m => m.DfManageServicesComponent
      ),
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
    // `:id` plus an optional MCP page tab segment (/ai/mcp/:id/<tab>) as one
    // route, so tab changes reuse the component and skip the resolvers.
    matcher: serviceDetailMatcher,
    runGuardsAndResolvers: serviceChanged,
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
