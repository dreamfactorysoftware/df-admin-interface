import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ActivatedRoute, Router } from '@angular/router';
import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { takeUntil } from 'rxjs';
import {
  faCheckCircle,
  faXmarkCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Component } from '@angular/core';
import { RoleRow, RoleType } from 'src/app/shared/types/role';
import { DfRoleService } from '../services/df-role.service';

@Component({
  selector: 'df-manage-roles',
  templateUrl: './df-manage-roles.component.html',
  styleUrls: ['./df-manage-roles.component.scss'],
})
export class DfManageRolesComponent extends DFManageTableComponent<RoleRow> {
  constructor(
    private roleService: DfRoleService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer
  ) {
    super(router, activatedRoute, liveAnnouncer);
  }

  faTrashCan = faTrashCan;

  filterQuery(value: string): string {
    return `(id like "%${value}%") or (name like "%${value}%") or (description like "%${value}%")`;
  }

  override columns = [
    {
      columnDef: 'id',
      cell: (row: RoleRow) => `${row.id}`,
      header: 'id',
      sortActionDescription: 'id',
    },
    {
      columnDef: 'name',
      cell: (row: RoleRow) => `${row.name}`,
      header: 'name',
      sortActionDescription: 'name',
    },
    {
      columnDef: 'description',
      cell: (row: RoleRow) => `${row.description}`,
      header: 'description',
      sortActionDescription: 'description',
    },
    {
      columnDef: 'active',
      cell: (row: RoleRow) => `${row.active}`,
      header: 'active',
      sortActionDescription: 'active',
    },
    {
      columnDef: 'actions',
    },
  ];

  activeIcon(active: boolean): IconProp {
    return active ? faCheckCircle : faXmarkCircle;
  }

  mapDataToTable(data: any): RoleRow[] {
    return data.map((role: RoleType) => {
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        active: role.isActive,
      };
    });
  }

  deleteRow(row: RoleRow): void {
    this.roleService
      .deleteRole(row.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(limit?: number, offset?: number): void {
    this.roleService
      .getRoles(limit, offset)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
