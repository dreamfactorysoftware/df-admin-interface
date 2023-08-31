import { Component, ViewChild } from '@angular/core';
import { DfManageLimitsTableComponent } from './df-manage-limits-table.component';

@Component({
  selector: 'df-manage-limits',
  templateUrl: './df-manage-limits.component.html',
  styleUrls: ['./df-manage-limits.component.scss'],
  standalone: true,
  imports: [DfManageLimitsTableComponent],
})
export class DfManageLimitsComponent {
  @ViewChild(DfManageLimitsTableComponent)
  manageLimitsTableComponent!: DfManageLimitsTableComponent;
}
