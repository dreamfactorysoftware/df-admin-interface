import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslateService } from '@ngx-translate/core';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { DF_SCHEDULER_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

export type SchedulerTaskData = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  serviceId: number;
  component: string;
  verbMask: number;
  frequency: number;
  payload: string | null;
  createDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  verb: string;
  taskLogByTaskId: number | null;
};

@Component({
  selector: 'df-manage-scheduler-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageSchedulerTableComponent extends DfManageTableComponent<SchedulerTaskData> {
  constructor(
    @Inject(DF_SCHEDULER_SERVICE_TOKEN)
    private service: DfBaseCrudService<SchedulerTaskData, any>, // TODO: add create payload here
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

  override allowFilter = false;

  override columns = [
    {
      columnDef: 'active',
      cell: (row: SchedulerTaskData) => row.isActive,
      header: 'Active',
    },
    {
      columnDef: 'id',
      cell: (row: SchedulerTaskData) => row.id,
      header: 'Id',
    },
    {
      columnDef: 'name',
      cell: (row: SchedulerTaskData) => row.name,
      header: 'Name',
    },
    {
      columnDef: 'description',
      cell: (row: SchedulerTaskData) => row.description,
      header: 'Description',
    },
    {
      columnDef: 'service',
      cell: (row: SchedulerTaskData) => row.serviceId, // TODO: this needs to be changed from serviceId to serviceName
      header: 'Service',
    },
    {
      columnDef: 'component',
      cell: (row: SchedulerTaskData) => row.component,
      header: 'Component',
    },
    {
      columnDef: 'method',
      cell: (row: SchedulerTaskData) => row.verb,
      header: 'Method',
    },
    {
      columnDef: 'frequency',
      cell: (row: SchedulerTaskData) => row.frequency,
      header: 'Frequency',
    },
    {
      columnDef: 'log',
      cell: (row: SchedulerTaskData) => row.taskLogByTaskId, // TODO: change this
      header: 'Log',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): SchedulerTaskData[] {
    console.log('data: ', data);
    return data.map((val: SchedulerTaskData) => {
      return {
        id: val.id,
        name: val.name,
        description: val.description,
        active: val.isActive,
        serviceId: val.serviceId,
        component: val.component,
        verb: val.verb,
        frequency: val.frequency,
        log: '-', // TODO: update when ready
      };
    });
  }

  // There is no filter for this component
  filterQuery(_value: string): string {
    return '';
  }

  override deleteRow(row: SchedulerTaskData): void {
    this.service
      .delete(row.id.toString())
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.service
      .getAll(limit, offset, filter)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
