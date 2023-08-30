import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { AppType, AppRow } from '../types/df-apps.types';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslateService } from '@ngx-translate/core';
import { DF_APPS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

@Component({
  selector: 'df-manage-apps-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
    './df-manage-apps-table.component.scss',
  ],
})
export class DfManageAppsTableComponent extends DfManageTableComponent<AppRow> {
  constructor(
    @Inject(DF_APPS_SERVICE_TOKEN)
    private appsService: DfBaseCrudService,
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
  // TODO add icon for "launch app"
  override columns = [
    {
      columnDef: 'active',
      cell: (row: AppRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'id',
      cell: (row: AppRow) => row.id,
      header: 'id',
    },
    {
      columnDef: 'name',
      cell: (row: AppRow) => row.name,
      header: 'Name',
    },
    {
      columnDef: 'role',
      cell: (row: AppRow) => row.role,
      header: 'Role',
    },
    {
      columnDef: 'apiKey',
      cell: (row: AppRow) => row.apiKey,
      header: 'API Key',
    },
    {
      columnDef: 'description',
      cell: (row: AppRow) => row.description,
      header: 'Description',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): AppRow[] {
    return data.map((app: AppType) => {
      return {
        id: app.id,
        name: app.name,
        role: app.roleByRoleId?.description || '',
        apiKey: app.apiKey,
        description: app.description,
        active: app.isActive,
        launchUrl: app.launchUrl,
      };
    });
  }

  filterQuery(value: string): string {
    return `(name like "%${value}%") or (description like "%${value}%")`;
  }

  override deleteRow(row: AppRow): void {
    this.appsService
      .delete(row.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.appsService
      .getAll<GenericListResponse<AppType>>({ limit, offset, filter })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
