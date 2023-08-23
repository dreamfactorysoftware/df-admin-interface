import { Component, ViewChild } from '@angular/core';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { EXPORT_TYPES } from 'src/app/core/constants/supported-extensions';
import { DfManageUsersTableComponent } from './df-manage-users-table.component';

@Component({
  selector: 'df-manage-users',
  templateUrl: './df-manage-users.component.html',
})
export class DfManageUsersComponent {
  faUpload = faUpload;
  faDownload = faDownload;
  exportTypes = EXPORT_TYPES;
  @ViewChild(DfManageUsersTableComponent)
  manageUserTableComponent!: DfManageUsersTableComponent;

  uploadUserList(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.manageUserTableComponent.uploadUserList(input.files);
    }
  }

  downLoadUserList(type: string) {
    this.manageUserTableComponent.downloadUserList(type);
  }
}
