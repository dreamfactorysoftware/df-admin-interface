import { Component } from '@angular/core';
import { DfGuardianLogsTableComponent } from './df-guardian-logs-table.component';

@Component({
  selector: 'df-guardian-logs',
  template: '<df-guardian-logs-table></df-guardian-logs-table>',
  standalone: true,
  imports: [DfGuardianLogsTableComponent],
})
export class DfGuardianLogsComponent {}
