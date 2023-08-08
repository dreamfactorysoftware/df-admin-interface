import { Component, OnInit } from '@angular/core';
import { DfSystemConfigDataService } from './core/services/df-system-config-data.service';
import { DfLoadingSpinnerService } from './core/services/df-loading-spinner.service';

@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'df-admin-interface';
  activeSpinner$ = this.loadingSpinnerService.active;
  constructor(
    private systemConfigDataService: DfSystemConfigDataService,
    private loadingSpinnerService: DfLoadingSpinnerService
  ) {}
  ngOnInit() {
    this.systemConfigDataService.fetchEnvironmentData();
  }
}
