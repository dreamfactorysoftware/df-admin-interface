import { NgModule } from '@angular/core';

import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { AdfUserDetailsModule } from '../shared/components/df-user-details/adf-user-details.module';
import { AdfUsersRoutingModule } from './adf-users-routing.module';
import { DfUserService } from './services/df-user.service';
import { DfRoleService } from '../adf-roles/services/df-role.service';
import { DfManageUsersComponent } from './df-manage-users/df-manage-users.component';
import { DfManageUsersTableComponent } from './df-manage-users/df-manage-users-table.component';
import { DfUserDetailsComponent } from './df-user-details/df-user-details.component';
@NgModule({
  declarations: [
    DfManageUsersComponent,
    DfManageUsersTableComponent,
    DfUserDetailsComponent,
  ],
  imports: [
    AdfUsersRoutingModule,
    AdfManageTableModule,
    MatDividerModule,
    MatTabsModule,
    AdfUserDetailsModule,
  ],
  providers: [DfUserService, DfRoleService],
})
export class AdfUsersModule {}
