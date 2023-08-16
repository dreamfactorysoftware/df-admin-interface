import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { UserRow } from 'src/app/shared/types/user';
import { DfAdminService } from '../services/df-admin.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'df-manage-admins',
  templateUrl: './df-manage-admins.component.html',
})
export class DfManageAdminsComponent extends DFManageTableComponent<UserRow> {
  constructor(
    private router: Router,
    private adminService: DfAdminService,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer
  ) {
    super(activatedRoute, liveAnnouncer);
  }
  override columns = [
    {
      columnDef: 'select',
    },
    {
      columnDef: 'active',
      cell: (row: UserRow) => `${row.active}`,
      header: 'Active',
      sortActionDescription: 'active',
    },
    {
      columnDef: 'id',
      cell: (row: UserRow) => `${row.id}`,
      header: 'ID',
      sortActionDescription: 'id',
    },
    {
      columnDef: 'email',
      cell: (row: UserRow) => `${row.email}`,
      header: 'Email',
      sortActionDescription: 'email',
    },
    {
      columnDef: 'displayName',
      cell: (row: UserRow) => `${row.displayName}`,
      header: 'Display Name',
      sortActionDescription: 'displayName',
    },
    {
      columnDef: 'firstName',
      cell: (row: UserRow) => `${row.firstName}`,
      header: 'First Name',
      sortActionDescription: 'firstName',
    },
    {
      columnDef: 'lastName',
      cell: (row: UserRow) => `${row.lastName}`,
      header: 'Last Name',
      sortActionDescription: 'lastName',
    },
    {
      columnDef: 'registration',
      cell: (row: UserRow) => `${row.registration}`,
      header: 'Registration',
      sortActionDescription: 'registration',
    },
  ];

  mapDataToTable(data: any): UserRow[] {
    return data as UserRow[];
  }

  changePage(event: PageEvent): void {
    console.log(event);
  }

  editRow(row: UserRow): void {
    this.router.navigate(['edit', row.id], {
      relativeTo: this._activatedRoute,
    });
  }

  deleteRow(row: UserRow): void {
    this.adminService
      .deleteAdmin(row.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(): void {
    this.adminService.getAdmins().subscribe(data => {
      this.dataSource.data = this.mapDataToTable(data.resource);
      this.tableLength = data.meta.count;
    });
  }
}
