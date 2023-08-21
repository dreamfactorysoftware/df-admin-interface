import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfManageRolesComponent } from './df-manage-roles/df-manage-roles.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdfRolesRoutingModule } from './adf-roles-routing.module';
import { DfRoleService } from './services/df-role.service';
import { DfCreateRoleComponent } from './df-create-role/df-create-role.component';
import { DfManageRolesTableComponent } from './df-manage-roles/df-manage-roles-table.component';
import { DfManageTableModule } from '../shared/components/df-manage-table/df-manage-table.module';

@NgModule({
  declarations: [
    DfManageRolesComponent,
    DfCreateRoleComponent,
    DfManageRolesTableComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    AdfRolesRoutingModule,
    DfManageTableModule,
  ],
  providers: [DfRoleService],
})
export class AdfRolesModule {}
