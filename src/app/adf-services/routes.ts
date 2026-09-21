import { Routes } from '@angular/router';
import { ROUTES } from '../shared/types/routes';
import { serviceResolver } from './resolvers/services.resolver';
import { serviceTypesResolver } from './resolvers/service-types.resolver';

export const ServiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./df-manage-services/df-manage-services.component').then(
        m => m.DfManageServicesComponent
      ),
  },
  {
    // The shim renders the MCP create page for the AI → MCP section and the
    // legacy generic create form everywhere else.
    path: ROUTES.CREATE,
    loadComponent: () =>
      import('../adf-mcp/df-mcp-route-shim.component').then(
        m => m.DfMcpRouteShimComponent
      ),
    resolve: {
      serviceTypes: serviceTypesResolver,
    },
  },
  {
    // The shim renders the redesigned MCP editor for mcp/system_mcp services
    // and the legacy generic editor for every other type.
    path: ':id',
    loadComponent: () =>
      import('../adf-mcp/df-mcp-route-shim.component').then(
        m => m.DfMcpRouteShimComponent
      ),
    resolve: {
      data: serviceResolver,
      serviceTypes: serviceTypesResolver,
    },
  },
];
