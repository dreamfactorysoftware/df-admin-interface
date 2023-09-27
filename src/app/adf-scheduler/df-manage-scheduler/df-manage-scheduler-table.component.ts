import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { SchedulerTaskData } from '../types/df-scheduler.types';
import { MatDialog } from '@angular/material/dialog';
import { Service } from 'src/app/shared/types/service';
import { TranslocoService } from '@ngneat/transloco';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-scheduler-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageSchedulerTableComponent extends DfManageTableComponent<SchedulerTaskData> {
  userServices: Service[];

  constructor(
    @Inject(SCHEDULER_SERVICE_TOKEN)
    private service: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  override allowFilter = false;

  override columns = [
    {
      columnDef: 'active',
      cell: (row: SchedulerTaskData) => row.isActive,
      header: 'scheduler.table.header.active',
    },
    {
      columnDef: 'id',
      cell: (row: SchedulerTaskData) => row.id,
      header: 'scheduler.table.header.id',
    },
    {
      columnDef: 'name',
      cell: (row: SchedulerTaskData) => row.name,
      header: 'scheduler.table.header.name',
    },
    {
      columnDef: 'description',
      cell: (row: SchedulerTaskData) => row.description,
      header: 'scheduler.table.header.description',
    },
    {
      columnDef: 'service',
      cell: (row: SchedulerTaskData) => row.serviceByServiceId.name,
      header: 'scheduler.table.header.service',
    },
    {
      columnDef: 'component',
      cell: (row: SchedulerTaskData) => row.component,
      header: 'scheduler.table.header.component',
    },
    {
      columnDef: 'method',
      cell: (row: SchedulerTaskData) => row.verb,
      header: 'scheduler.table.header.method',
    },
    {
      columnDef: 'frequency',
      cell: (row: SchedulerTaskData) => row.frequency,
      header: 'scheduler.table.header.frequency',
    },
    {
      columnDef: 'log',
      cell: (row: SchedulerTaskData) => !!row.taskLogByTaskId,
      header: 'scheduler.table.header.log',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): SchedulerTaskData[] {
    return data.map((val: SchedulerTaskData) => {
      return {
        id: val.id,
        name: val.name,
        description: val.description,
        isActive: val.isActive,
        serviceId: val.serviceId,
        component: val.component,
        verb: val.verb,
        frequency: val.frequency,
        taskLogByTaskId: val.taskLogByTaskId,
        serviceByServiceId: val.serviceByServiceId,
      };
    });
  }

  filterQuery = getFilterQuery();

  override deleteRow(row: SchedulerTaskData): void {
    this.service.delete(row.id.toString()).subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.service
      .getAll({ limit: limit, offset: offset, filter: filter })
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
