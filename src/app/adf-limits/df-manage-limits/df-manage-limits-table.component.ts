import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

import { LimitType } from 'src/app/shared/types/limit';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import {
  LIMIT_CACHE_SERVICE_TOKEN,
  LIMIT_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';

export type LimitTableRowData = {
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
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    NgFor,
    MatMenuModule,
    NgTemplateOutlet,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
  ],
})
export class DfManageLimitsTableComponent extends DfManageTableComponent<LimitTableRowData> {
  constructor(
    @Inject(LIMIT_SERVICE_TOKEN)
    private limitService: DfBaseCrudService,
    @Inject(LIMIT_CACHE_SERVICE_TOKEN)
    private limitCacheService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslocoService
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
      header: 'active',
    },
    {
      columnDef: 'id',
      cell: (row: LimitTableRowData) => row.id,
      header: 'id',
    },
    {
      columnDef: 'name',
      cell: (row: LimitTableRowData) => row.name,
      header: 'name',
    },
    {
      columnDef: 'type',
      cell: (row: LimitTableRowData) => row.limitType,
      header: 'type',
    },
    {
      columnDef: 'rate',
      cell: (row: LimitTableRowData) => row.limitRate,
      header: 'rate',
    },
    {
      columnDef: 'counter',
      cell: (row: LimitTableRowData) => row.limitCounter,
      header: 'counter',
    },
    {
      columnDef: 'user',
      cell: (row: LimitTableRowData) => row.user,
      header: 'user',
    },
    {
      columnDef: 'service',
      cell: (row: LimitTableRowData) => row.service,
      header: 'service',
    },
    {
      columnDef: 'role',
      cell: (row: LimitTableRowData) => row.role,
      header: 'role',
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

  refreshRows(id?: number): void {
    const ids = id
      ? [id.toString()]
      : this.dataSource.data.map(row => {
          return row.id.toString();
        });

    this.limitCacheService
      .delete(ids)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.limitService
      .getAll<GenericListResponse<LimitType>>({
        limit,
        offset,
        filter,
        related:
          'service_by_service_id,role_by_role_id,user_by_user_id,limit_cache_by_limit_id',
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
