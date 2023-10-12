import { Component, ViewChild } from '@angular/core';
import { DfManageAdminsTableComponent } from './df-manage-admins-table.component';
import { EXPORT_TYPES } from 'src/app/shared/constants/supported-extensions';

import { NgFor, UpperCasePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-manage-admins',
  templateUrl: './df-manage-admins.component.html',
  standalone: true,
  imports: [
    DfManageAdminsTableComponent,
    MatButtonModule,
    FontAwesomeModule,
    MatMenuModule,
    NgFor,
    UpperCasePipe,
    TranslocoPipe,
  ],
})
export class DfManageAdminsComponent {
  faUpload = faUpload;
  faDownload = faDownload;
  exportTypes = EXPORT_TYPES;
  @ViewChild(DfManageAdminsTableComponent)
  manageAdminTableComponent: DfManageAdminsTableComponent;

  uploadAdminList(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.manageAdminTableComponent.uploadAdminList(input.files);
    }
  }

  downLoadAdminList(type: string) {
    this.manageAdminTableComponent.downloadAdminList(type);
  }
}
