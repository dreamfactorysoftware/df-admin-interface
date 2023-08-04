import { Component, OnInit } from '@angular/core';
import { DfSystemConfigDataService } from './core/services/df-system-config-data.service';

@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'df-admin-interface';
  constructor(private systemConfigDataService: DfSystemConfigDataService) {}
  ngOnInit() {
    this.systemConfigDataService.fetchSystemConfigData();
  }
}
