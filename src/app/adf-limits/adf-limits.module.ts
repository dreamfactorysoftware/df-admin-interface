import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfManageLimitsComponent } from './df-manage-limits/df-manage-limits.component';
import { DfManageLimitsTableComponent } from './df-manage-limits/df-manage-limits-table.component';
import { AdfLimitsRoutingModule } from './adf-limits-routing.module';
import { DfLimitsService } from './services/df-limits.service';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfLimitComponent } from './df-limit/df-limit.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { DfRoleService } from '../adf-roles/services/df-role.service';
import { DfUserDataService } from '../core/services/df-user-data.service';
import { DfServiceDataService } from '../adf-services/services/service-data.service';
import { DfAlertComponent } from '../shared/components/df-alert/df-alert.component';

@NgModule({
  declarations: [
    DfManageLimitsComponent,
    DfManageLimitsTableComponent,
    DfLimitComponent,
  ],
  imports: [
    CommonModule,
    AdfLimitsRoutingModule,
    DfAlertComponent,
    AdfManageTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSelectModule,
    TranslateModule,
  ],
  providers: [
    DfLimitsService,
    DfRoleService,
    DfUserDataService,
    DfServiceDataService,
  ],
})
export class AdfLimitsModule {}
