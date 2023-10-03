import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { UserProfile, UserRow } from 'src/app/shared/types/user';
import { saveRawAsFile } from 'src/app/shared/utilities/file';
import { USER_COLUMNS } from 'src/app/shared/constants/table-columns';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { ADMIN_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-admins-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageAdminsTableComponent extends DfManageTableComponent<UserRow> {
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    @Inject(ADMIN_SERVICE_TOKEN)
    private adminService: DfBaseCrudService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }
  override columns = USER_COLUMNS;

  mapDataToTable(data: Array<UserProfile>): UserRow[] {
    return data.map(user => {
      return {
        id: user.id,
        email: user.email,
        displayName: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        registration: user.confirmed,
        active: user.isActive,
      };
    });
  }

  filterQuery = getFilterQuery('user');

  override deleteRow(row: UserRow): void {
    this.adminService
      .delete(row.id, { snackbarSuccess: 'admins.alerts.deleteSuccess' })
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.adminService
      .getAll<GenericListResponse<UserProfile>>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  uploadAdminList(files: FileList) {
    this.adminService
      .importList(files[0], { snackbarSuccess: 'admins.alerts.importSuccess' })
      .subscribe(() => {
        this.refreshTable();
      });
  }

  downloadAdminList(type: string) {
    this.adminService
      .exportList(type, { snackbarSuccess: 'admins.alerts.exportSuccess' })
      .subscribe(data => {
        saveRawAsFile(data, `admin.${type}`, type);
      });
  }
}
