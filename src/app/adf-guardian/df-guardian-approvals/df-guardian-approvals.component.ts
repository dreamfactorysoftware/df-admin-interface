import { Component } from '@angular/core';
import { DfGuardianApprovalsTableComponent } from './df-guardian-approvals-table.component';

@Component({
  selector: 'df-guardian-approvals',
  template: '<df-guardian-approvals-table></df-guardian-approvals-table>',
  standalone: true,
  imports: [DfGuardianApprovalsTableComponent],
})
export class DfGuardianApprovalsComponent {}
