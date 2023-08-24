import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslateService } from '@ngx-translate/core';
import { DfLimitsService } from '../services/df-limits.service';
import { LimitType } from 'src/app/shared/types/limit';

type LimitTableRowData = {
  id: number;
  name: string;
  limitType: string;
  limitRate: string;
  limitCounter: string;
  user: number | null;
  service: number | null;
  role: number | null;
  active: boolean;
};

@Component({
  selector: 'df-manage-limits-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageLimitsTableComponent extends DfManageTableComponent<LimitTableRowData> {
  constructor(
    private limitService: DfLimitsService,
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
      cell: (row: LimitTableRowData) => row.active,
      header: 'Active',
    },
    {
      columnDef: 'id',
      cell: (row: LimitTableRowData) => row.id,
      header: 'id',
    },
    {
      columnDef: 'limitName',
      cell: (row: LimitTableRowData) => row.name,
      header: 'Limit Name',
    },
    {
      columnDef: 'limitType',
      cell: (row: LimitTableRowData) => row.limitType,
      header: 'Limit Type',
    },
    {
      columnDef: 'limitRate',
      cell: (row: LimitTableRowData) => row.limitRate,
      header: 'Limit Rate',
    },
    {
      columnDef: 'limitCounter',
      cell: (row: LimitTableRowData) => row.limitCounter,
      header: 'Limit Counter',
    },
    {
      columnDef: 'user',
      cell: (row: LimitTableRowData) => row.user,
      header: 'User',
    },
    {
      columnDef: 'service',
      cell: (row: LimitTableRowData) => row.service,
      header: 'Service',
    },
    {
      columnDef: 'role',
      cell: (row: LimitTableRowData) => row.role,
      header: 'Role',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): LimitTableRowData[] {
    return data.map((limit: LimitType) => {
      return {
        id: limit.id,
        name: limit.name,
        limitType: limit.type,
        limitRate: `${limit.rate} / ${limit.period}`,
        limitCounter: `${limit.limitCacheByLimitId[0].attempts} / ${limit.limitCacheByLimitId[0].max}`,
        user: limit.userId,
        service: limit.serviceId,
        role: limit.roleId,
        active: limit.isActive,
      };
    });
  }

  filterQuery(value: string): string {
    return `(name like "%${value}%")`;
  }

  override deleteRow(row: LimitTableRowData): void {
    this.limitService
      .deleteLimit(row.id.toString())
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.limitService
      .getLimits(limit, offset, filter)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
