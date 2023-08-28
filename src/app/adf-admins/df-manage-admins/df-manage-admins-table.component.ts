import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { UserProfile, UserRow } from 'src/app/shared/types/user';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslateService } from '@ngx-translate/core';
import { saveAsFile } from 'src/app/shared/utilities/file';
import { USER_COLUMNS } from 'src/app/core/constants/table-columns';
import { userFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { DF_ADMIN_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

@Component({
  selector: 'df-manage-admins-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageAdminsTableComponent extends DfManageTableComponent<UserRow> {
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslateService,
    @Inject(DF_ADMIN_SERVICE_TOKEN)
    private adminService: DfBaseCrudService
  ) {
    super(
      router,
      activatedRoute,
      liveAnnouncer,
      breakpointService,
      translateService
    );
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

  filterQuery = userFilterQuery;

  override deleteRow(row: UserRow): void {
    this.adminService
      .delete(row.id, { snackbarSccess: 'admins.alerts.deleteSuccess' })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.adminService
      .getAll<GenericListResponse<UserProfile>>({ limit, offset, filter })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  uploadAdminList(files: FileList) {
    this.adminService
      .uploadFile(files[0], { snackbarSccess: 'admins.alerts.importSuccess' })
      .subscribe(() => {
        this.refreshTable();
      });
  }

  downloadAdminList(type: string) {
    this.adminService
      .downloadFile(type, { snackbarSccess: 'admins.alerts.exportSuccess' })
      .subscribe(data => {
        saveAsFile(data, `admin.${type}`, type);
      });
  }
}
