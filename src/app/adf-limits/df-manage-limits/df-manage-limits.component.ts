import { Component, ViewChild } from '@angular/core';
import { DfManageAdminsTableComponent } from 'src/app/adf-admins/df-manage-admins/df-manage-admins-table.component';
import { DfManageLimitsTableComponent } from './df-manage-limits-table.component';

@Component({
  selector: 'df-manage-limits',
  templateUrl: './df-manage-limits.component.html',
  styleUrls: ['./df-manage-limits.component.scss'],
})
export class DfManageLimitsComponent {
  @ViewChild(DfManageLimitsTableComponent)
  manageAdminTableComponent!: DfManageAdminsTableComponent;
}
