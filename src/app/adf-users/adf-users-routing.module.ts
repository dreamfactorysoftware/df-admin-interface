import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { DfManageUsersComponent } from './df-manage-users/df-manage-users.component';
import {
  rolesResolver,
  userAppsResolver,
  userResolver,
  usersResolver,
} from './resolvers/users.resolver';
import { DfUserDetailsComponent } from './df-user-details/df-user-details.component';

const routes: Routes = [
  {
    path: '',
    component: DfManageUsersComponent,
    resolve: { data: usersResolver },
  },
  {
    path: `${ROUTES.EDIT}/:id`,
    component: DfUserDetailsComponent,
    resolve: {
      data: userResolver,
      apps: userAppsResolver,
      roles: rolesResolver,
    },
    data: { type: 'edit' },
  },
  {
    path: ROUTES.CREATE,
    component: DfUserDetailsComponent,
    data: { type: 'create' },
    resolve: {
      apps: userAppsResolver,
      roles: rolesResolver,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUsersRoutingModule {}
