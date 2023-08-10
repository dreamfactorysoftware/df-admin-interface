import { Component } from '@angular/core';
import { DfLoadingSpinnerService } from './core/services/df-loading-spinner.service';

@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'df-admin-interface';
  activeSpinner$ = this.loadingSpinnerService.active;
  constructor(private loadingSpinnerService: DfLoadingSpinnerService) {}
}
