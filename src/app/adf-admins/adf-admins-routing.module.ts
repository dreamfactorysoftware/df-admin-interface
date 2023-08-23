import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminsResolver } from './resolvers/admins.resolver';
import { DfAdminDetailsComponent } from './df-admin-details/df-admin-details.component';
import { ROUTES } from '../core/constants/routes';
import { DfManageAdminsComponent } from './df-manage-admins/df-manage-admins.component';

const routes: Routes = [
  {
    path: '',
    component: DfManageAdminsComponent,
    resolve: { data: adminsResolver },
  },
  {
    path: `${ROUTES.EDIT}/:id`,
    component: DfAdminDetailsComponent,
    resolve: { data: adminsResolver },
    data: { type: 'edit' },
  },
  {
    path: ROUTES.CREATE,
    component: DfAdminDetailsComponent,
    data: { type: 'create' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfAdminsRoutingModule {}
