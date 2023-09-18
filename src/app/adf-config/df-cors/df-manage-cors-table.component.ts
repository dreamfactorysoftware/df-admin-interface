import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { CONFIG_CORS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { CorsConfigData } from '../types';
import { takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';

@Component({
  selector: 'df-manage-cors-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageCorsTableComponent extends DfManageTableComponent<CorsConfigData> {
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog,
    @Inject(CONFIG_CORS_SERVICE_TOKEN)
    private corsService: DfBaseCrudService
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);

    this.allowFilter = false;
  }

  override columns = [
    {
      columnDef: 'active',
      cell: (row: CorsConfigData) => row.enabled,
      header: 'active',
    },
    {
      columnDef: 'path',
      cell: (row: CorsConfigData) => row.path,
      header: 'path',
    },
    {
      columnDef: 'description',
      cell: (row: CorsConfigData) => row.description,
      header: 'description',
    },
    {
      columnDef: 'maxAge',
      cell: (row: CorsConfigData) => row.maxAge,
      header: 'maxAge',
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: CorsConfigData[]): CorsConfigData[] {
    return data;
  }

  override deleteRow(row: CorsConfigData): void {
    this.corsService
      .delete(row.id, { fields: '*' })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.refreshTable());
  }

  override refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined
  ): void {
    this.corsService
      .getAll({
        limit,
        offset,
        filter,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.dataSource = data.data.resource;
        this.tableLength = data.meta.count;
      });
  }

  filterQuery = getFilterQuery();
}
