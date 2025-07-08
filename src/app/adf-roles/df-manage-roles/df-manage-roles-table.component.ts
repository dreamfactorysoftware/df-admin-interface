import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { Component, Inject } from '@angular/core';
import { RoleRow, RoleType } from 'src/app/shared/types/role';
import { ROLE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-roles-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class DfManageRolesTableComponent extends DfManageTableComponent<RoleRow> {
  expandedElement: any | null;
  constructor(
    @Inject(ROLE_SERVICE_TOKEN)
    private roleService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  filterQuery = getFilterQuery('roles');

  override columns = [
    {
      columnDef: 'active',
      cell: (row: RoleRow) => `${row.active}`,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: RoleRow) => `${row.name}`,
      header: 'name',
    },
    {
      columnDef: 'description',
      cell: (row: RoleRow) => `${row.description}`,
      header: 'description',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: RoleType[]): RoleRow[] {
    return data.map((role: RoleType) => {
      return {
        id: role.id,
        name: role.name,
        description: role.description ? role.description : '',
        active: role.isActive,
      };
    });
  }

  override deleteRow(row: RoleRow): void {
    this.roleService.delete(row.id).subscribe(() => {
      this.refreshTable();
    });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.roleService
      .getAll<GenericListResponse<RoleType>>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
