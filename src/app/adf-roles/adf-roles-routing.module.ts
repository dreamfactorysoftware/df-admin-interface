import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DfManageRolesComponent } from './df-manage-roles/df-manage-roles.component';
import { DfCreateRoleComponent } from './df-create-role/df-create-role.component';
import { roleResolver } from './resolvers/role.resolver';

const routes: Routes = [
  {
    path: '',
    component: DfManageRolesComponent,
    resolve: { data: roleResolver },
  },
  {
    path: 'create',
    component: DfCreateRoleComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfRolesRoutingModule {}
