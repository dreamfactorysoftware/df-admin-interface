import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfManageLimitsComponent } from './df-manage-limits/df-manage-limits.component';
import { DfManageLimitsTableComponent } from './df-manage-limits/df-manage-limits-table.component';
import { AdfLimitsRoutingModule } from './adf-limits-routing.module';
import { DfLimitsService } from './services/df-limits.service';
import { DfManageTableModule } from '../shared/components/df-manage-table/df-manage-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  declarations: [DfManageLimitsComponent, DfManageLimitsTableComponent],
  imports: [
    CommonModule,
    AdfLimitsRoutingModule,
    DfManageTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  providers: [DfLimitsService],
})
export class AdfLimitsModule {}
