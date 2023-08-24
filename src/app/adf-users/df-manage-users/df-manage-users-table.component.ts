import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { UserProfile, UserRow } from 'src/app/shared/types/user';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslateService } from '@ngx-translate/core';
import { saveAsFile } from 'src/app/shared/utilities/file';
import { USER_COLUMNS } from 'src/app/core/constants/table-columns';
import { userFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { DfUserService } from '../services/df-user.service';

@Component({
  selector: 'df-manage-users-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageUsersTableComponent extends DfManageTableComponent<UserRow> {
  constructor(
    private userService: DfUserService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslateService
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

  mapDataToTable(data: any): UserRow[] {
    return data.map((user: UserProfile) => {
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
    // this.userService
    //   .deleteAdmin(row.id)
    //   .pipe(takeUntil(this.destroyed$))
    //   .subscribe(() => {
    //     this.refreshTable();
    //   });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.userService
      .getAll(limit, offset, filter)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  uploadUserList(files: FileList) {
    // this.userService.uploadAdminList(files[0]).subscribe(() => {
    //   this.refreshTable();
    // });
  }

  downloadUserList(type: string) {
    // this.userService.downloadAdminlist(type).subscribe(data => {
    //   saveAsFile(data, `admin.${type}`, type);
    // });
  }
}
