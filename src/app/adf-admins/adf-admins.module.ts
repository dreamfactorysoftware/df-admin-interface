import { NgModule } from '@angular/core';
import { DfManageAdminsTableComponent } from './df-manage-admins/df-manage-admins-table.component';
import { AdfAdminsRoutingModule } from './adf-admins-routing.module';
import { DfAdminService } from './services/df-admin.service';
import { DfAdminDetailsComponent } from './df-admin-details/df-admin-details.component';
import { DfManageAdminsComponent } from './df-manage-admins/df-manage-admins.component';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { DfRoleService } from '../adf-roles/services/df-role.service';
import { AdfUserDetailsModule } from '../shared/components/df-user-details/adf-user-details.module';
@NgModule({
  declarations: [
    DfManageAdminsComponent,
    DfAdminDetailsComponent,
    DfManageAdminsTableComponent,
  ],
  imports: [
    AdfAdminsRoutingModule,
    AdfManageTableModule,
    MatDividerModule,
    MatTabsModule,
    AdfUserDetailsModule,
  ],
  providers: [DfAdminService, DfRoleService],
})
export class AdfAdminsModule {}
