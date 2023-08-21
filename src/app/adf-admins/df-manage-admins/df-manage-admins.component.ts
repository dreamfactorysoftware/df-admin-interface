import { Component, ViewChild } from '@angular/core';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { DfManageAdminsTableComponent } from './df-manage-admins-table.component';
import { EXPORT_TYPES } from 'src/app/core/constants/supported-extensions';

@Component({
  selector: 'df-manage-admins',
  templateUrl: './df-manage-admins.component.html',
})
export class DfManageAdminsComponent {
  faUpload = faUpload;
  faDownload = faDownload;
  exportTypes = EXPORT_TYPES;
  @ViewChild(DfManageAdminsTableComponent)
  manageAdminTableComponent!: DfManageAdminsTableComponent;

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
