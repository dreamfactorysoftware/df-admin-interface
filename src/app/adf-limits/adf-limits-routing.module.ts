import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DfManageLimitsComponent } from './df-manage-limits/df-manage-limits.component';
import { limitsResolver } from './resolvers/limits.resolver';
import { DfLimitComponent } from './df-limit/df-limit.component';
import { ROUTES } from '../core/constants/routes';
import {
  roleResolver,
  getRolesResolver,
} from '../adf-roles/resolvers/role.resolver';
import { getSystemServiceDataListResolver } from '../adf-services/resolvers/service-data-service.resolver';
import { usersResolver } from '../adf-users/resolvers/users.resolver';

const routes: Routes = [
  {
    path: '',
    component: DfManageLimitsComponent,
    resolve: { data: limitsResolver },
  },
  {
    path: ROUTES.CREATE,
    component: DfLimitComponent,
    resolve: {
      data: limitsResolver,
      users: usersResolver,
      roles: roleResolver,
      services: getSystemServiceDataListResolver,
    },
  },
  {
    path: `${ROUTES.EDIT}/:id`,
    component: DfLimitComponent,
    resolve: {
      data: limitsResolver,
      users: usersResolver,
      roles: getRolesResolver,
      services: getSystemServiceDataListResolver,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfLimitsRoutingModule {}
