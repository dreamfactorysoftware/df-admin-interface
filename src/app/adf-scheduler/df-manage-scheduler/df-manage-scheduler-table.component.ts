import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { SchedulerTaskData } from '../../shared/types/scheduler';
import { MatDialog } from '@angular/material/dialog';
import { Service } from 'src/app/shared/types/service';
import { TranslocoService } from '@ngneat/transloco';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import { describeLastRun } from '../utils/run-status';
import { TranslatableText } from 'src/app/shared/utilities/access-usage';
import { Column } from 'src/app/shared/types/table';

/** Table row: the task plus its "Last run" wording, computed once per fetch. */
type SchedulerRow = SchedulerTaskData & {
  lastRunView?: TranslatableText | null;
};

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
  override emptyStateMessage = 'emptyState.scheduler.message';
  override emptyStateActionLabel = 'emptyState.scheduler.action';
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

  // "Last run" (df-scheduler#41) is an optional backend feature. The column
  // is added only when the loaded tasks carry run_status. On a df-scheduler
  // without per-run history the table renders exactly as it did before.
  private readonly lastRunColumn: Column<SchedulerTaskData> = {
    columnDef: 'lastRun',
    cell: (row: SchedulerRow) => {
      const view = row.lastRunView;
      return view
        ? this._translateService.translate(view.key, view.params)
        : '';
    },
    header: 'scheduler.table.header.lastRun',
  };

  private readonly baseColumns: Array<Column<SchedulerTaskData>> = [
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

  override columns = this.baseColumns;

  private readonly columnsWithLastRun = this.baseColumns.flatMap(column =>
    column.columnDef === 'log' ? [this.lastRunColumn, column] : [column]
  );

  mapDataToTable(data: any): SchedulerTaskData[] {
    // Swap the array reference only on a real change: the table memoizes
    // its displayed columns on it.
    const runsSupported = data.some(
      (val: SchedulerTaskData) => val.runStatus != null
    );
    const columns = runsSupported ? this.columnsWithLastRun : this.baseColumns;
    if (this.columns !== columns) {
      this.columns = columns;
    }
    const now = Date.now();
    const locale = this._translateService.getActiveLang() || 'en';
    return data.map((val: SchedulerTaskData): SchedulerRow => {
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
        runStatus: val.runStatus,
        // Relative wording is computed here, once per fetch. The cell
        // function runs for every row on every change detection.
        lastRunView: describeLastRun(val.runStatus, now, locale),
        serviceByServiceId: val.serviceByServiceId,
      } as SchedulerRow;
    });
  }

  filterQuery = getFilterQuery();

  override deleteRow(row: SchedulerTaskData): void {
    this.service.delete(row.id.toString()).subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    // related matches the scheduler resolver: the service column reads
    // serviceByServiceId and the log action reads taskLogByTaskId.
    this.fetchTable(this.service, {
      limit,
      offset,
      filter,
      related: 'task_log_by_task_id,service_by_service_id',
    });
  }
}
