import { Component, ViewChild, inject } from '@angular/core';
import { EXPORT_TYPES } from 'src/app/shared/constants/supported-extensions';
import { DfManageUsersTableComponent } from './df-manage-users-table.component';

import { AsyncPipe, NgFor, UpperCasePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';

@Component({
  selector: 'df-manage-users',
  templateUrl: './df-manage-users.component.html',
  styleUrls: ['./df-manage-users.component.scss'],
  standalone: true,
  imports: [
    DfManageUsersTableComponent,
    MatButtonModule,
    FontAwesomeModule,
    MatMenuModule,
    NgFor,
    UpperCasePipe,
    TranslocoPipe,
    AsyncPipe,
  ],
})
export class DfManageUsersComponent {
  themeService = inject(DfThemeService);
  faUpload = faUpload;
  faDownload = faDownload;
  exportTypes = EXPORT_TYPES;
  @ViewChild(DfManageUsersTableComponent)
  manageUserTableComponent!: DfManageUsersTableComponent;
  isDarkMode = this.themeService.darkMode$;

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
