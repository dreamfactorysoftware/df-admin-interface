import { Component } from '@angular/core';
import { DfGuardianAlertsTableComponent } from './df-guardian-alerts-table.component';

@Component({
  selector: 'df-guardian-alerts',
  template: '<df-guardian-alerts-table></df-guardian-alerts-table>',
  standalone: true,
  imports: [DfGuardianAlertsTableComponent],
})
export class DfGuardianAlertsComponent {}
