import { Component, ViewChild } from '@angular/core';
import { DfManageLimitsTableComponent } from './df-manage-limits-table.component';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'df-manage-limits',
  templateUrl: './df-manage-limits.component.html',
  styleUrls: ['./df-manage-limits.component.scss'],
  standalone: true,
  imports: [
    DfManageLimitsTableComponent,
    AsyncPipe,
    TranslocoPipe,
    FontAwesomeModule,
    NgIf,
    MatButtonModule,
    MatMenuModule,
  ],
})
export class DfManageLimitsComponent {
  faArrowsRotate = faArrowsRotate;
  @ViewChild(DfManageLimitsTableComponent)
  manageLimitsTableComponent!: DfManageLimitsTableComponent;

  refreshTable() {
    this.manageLimitsTableComponent.refreshTable();
  }
}
