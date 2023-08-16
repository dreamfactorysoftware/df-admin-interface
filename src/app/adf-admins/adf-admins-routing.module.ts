import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DfManageAdminsComponent } from './df-manage-admins/df-manage-admins.component';
import { adminResolver } from './resolvers/admin.resolver';
import { DfAdminDetailsComponent } from './df-admin-details/df-admin-details.component';

const routes: Routes = [
  {
    path: '',
    component: DfManageAdminsComponent,
    resolve: { data: adminResolver },
  },
  {
    path: 'edit/:id',
    component: DfAdminDetailsComponent,
    resolve: { data: adminResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfAdminsRoutingModule {}
