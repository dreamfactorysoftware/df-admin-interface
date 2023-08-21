import { NgModule } from '@angular/core';
import { DfManageAdminsTableComponent } from './df-manage-admins/df-manage-admins-table.component';
import { AdfAdminsRoutingModule } from './adf-admins-routing.module';
import { DfAdminService } from './services/df-admin.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { DfAdminDetailsComponent } from './df-admin-details/df-admin-details.component';
import { DfProfileDetailsComponent } from '../shared/components/df-profile-details/df-profile-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DfManageAdminsComponent } from './df-manage-admins/df-manage-admins.component';
import { DfManageTableModule } from '../shared/components/df-manage-table/df-manage-table.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  declarations: [
    DfManageAdminsComponent,
    DfAdminDetailsComponent,
    DfManageAdminsTableComponent,
  ],
  imports: [
    AdfAdminsRoutingModule,
    MatCheckboxModule,
    CommonModule,
    DfProfileDetailsComponent,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    DfManageTableModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  providers: [DfAdminService],
})
export class AdfAdminsModule {}
