import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { UserRow } from 'src/app/shared/types/user';

@Component({
  selector: 'df-manage-admins',
  templateUrl: './df-manage-admins.component.html',
})
export class DfManageAdminsComponent extends DFManageTableComponent<UserRow> {
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
}
