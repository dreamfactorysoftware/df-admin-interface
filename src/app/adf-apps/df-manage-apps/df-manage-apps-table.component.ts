import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AdditonalAction,
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { AppType, AppRow } from '../../shared/types/apps';
import { APP_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import { generateApiKey } from 'src/app/shared/utilities/hash';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-apps-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
    './df-manage-apps-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageAppsTableComponent extends DfManageTableComponent<AppRow> {
  constructor(
    @Inject(APP_SERVICE_TOKEN)
    private appsService: DfBaseCrudService,
    private systemConfigDataService: DfSystemConfigDataService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
    const extraActions: Array<AdditonalAction<AppRow>> = [
      {
        label: 'apps.launchApp',
        function: (row: AppRow) => {
          window.open(row.launchUrl, '_blank');
        },
        ariaLabel: {
          key: 'apps.launchApp',
        },
        disabled: (row: AppRow) => !row.launchUrl,
      },
      {
        label: 'apps.createApp.apiKey.copy',
        function: (row: AppRow) => {
          navigator.clipboard.writeText(row.apiKey);
        },
        ariaLabel: {
          key: 'apps.createApp.apiKey.copy',
        },
      },
      {
        label: 'apps.createApp.apiKey.refresh',
        function: async (row: AppRow) => {
          const newKey = await generateApiKey(
            this.systemConfigDataService.environment.server.host,
            row.name
          );
          this.appsService
            .update(row.id, { apiKey: newKey })
            .subscribe(() => this.refreshTable());
        },
        ariaLabel: {
          key: 'apps.createApp.apiKey.refresh',
        },
        disabled: row => row.createdById === null,
      },
    ];
    if (this.actions.additional) {
      this.actions.additional.push(...extraActions);
    } else {
      this.actions.additional = extraActions;
    }
  }
  override columns = [
    {
      columnDef: 'active',
      cell: (row: AppRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: AppRow) => row.name,
      header: 'name',
    },
    {
      columnDef: 'role',
      cell: (row: AppRow) => row.role,
      header: 'role',
    },
    {
      columnDef: 'apiKey',
      cell: (row: AppRow) => row.apiKey,
      header: 'apiKey',
    },
    {
      columnDef: 'description',
      cell: (row: AppRow) => row.description,
      header: 'description',
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
        createdById: app.createdById,
      };
    });
  }

  filterQuery = getFilterQuery('apps');

  override deleteRow(row: AppRow): void {
    this.appsService.delete(row.id).subscribe(() => {
      this.refreshTable();
    });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.appsService
      .getAll<GenericListResponse<AppType>>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
