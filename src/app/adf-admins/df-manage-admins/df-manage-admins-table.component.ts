import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { AdminType, UserRow } from 'src/app/shared/types/user';
import { DfAdminService } from '../services/df-admin.service';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslateService } from '@ngx-translate/core';
import { saveAsFile } from 'src/app/shared/utilities/file';

@Component({
  selector: 'df-manage-admins-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageAdminsTableComponent extends DFManageTableComponent<UserRow> {
  constructor(
    private adminService: DfAdminService,
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
  override columns = [
    {
      columnDef: 'active',
      cell: (row: UserRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'id',
      cell: (row: UserRow) => row.id,
      header: 'id',
    },
    {
      columnDef: 'email',
      cell: (row: UserRow) => row.email,
      header: 'email',
    },
    {
      columnDef: 'displayName',
      cell: (row: UserRow) => row.displayName,
      header: 'name',
    },
    {
      columnDef: 'firstName',
      cell: (row: UserRow) => row.firstName,
      header: 'firstName',
    },
    {
      columnDef: 'lastName',
      cell: (row: UserRow) => row.lastName,
      header: 'lastName',
    },
    {
      columnDef: 'registration',
      cell: (row: UserRow) => row.registration,
      header: 'registration',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): UserRow[] {
    return data.map((user: AdminType) => {
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

  filterQuery(value: string): string {
    return `(first_name like "%${value}%") or (last_name like "%${value}%") or (name like "%${value}%") or (email like "%${value}%")`;
  }

  override deleteRow(row: UserRow): void {
    this.adminService
      .deleteAdmin(row.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.adminService
      .getAdmins(limit, offset, filter)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  uploadAdminList(files: FileList) {
    this.adminService.uploadAdminList(files[0]).subscribe(() => {
      this.refreshTable();
    });
  }

  downloadAdminList(type: string) {
    this.adminService.downloadAdminlist(type).subscribe(data => {
      saveAsFile(data, `admin.${type}`, type);
    });
  }
}
