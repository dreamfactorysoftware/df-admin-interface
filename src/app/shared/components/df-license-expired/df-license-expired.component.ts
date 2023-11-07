import { Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-license-expired',
  templateUrl: './df-license-expired.component.html',
  styleUrls: ['./df-license-expired.component.scss'],
  standalone: true,
  imports: [TranslocoPipe],
})
export class DfLicenseExpiredComponent {}
