import { Component } from '@angular/core';
import { DfManageRolesTableComponent } from './df-manage-roles-table.component';

@Component({
  selector: 'df-manage-roles',
  templateUrl: './df-manage-roles.component.html',
  styleUrls: ['./df-manage-roles.component.scss'],
  standalone: true,
  imports: [DfManageRolesTableComponent],
})
export class DfManageRolesComponent {}
