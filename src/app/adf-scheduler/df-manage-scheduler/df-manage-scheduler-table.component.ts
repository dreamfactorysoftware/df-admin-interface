import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { takeUntil } from 'rxjs';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { SchedulerTaskData } from '../types/df-scheduler.types';
import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTableModule } from '@angular/material/table';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'df-manage-scheduler-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    NgTemplateOutlet,
    FontAwesomeModule,
    MatPaginatorModule,
    MatButtonModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatTableModule,
    TranslocoPipe,
  ],
})
export class DfManageSchedulerTableComponent extends DfManageTableComponent<SchedulerTaskData> {
  userServices: SystemServiceData[];

  constructor(
    @Inject(SCHEDULER_SERVICE_TOKEN)
    private service: DfBaseCrudService,
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

    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.userServices = data['services'].resource;
      });
  }

  override allowFilter = false;

  override columns = [
    {
      columnDef: 'active',
      cell: (row: SchedulerTaskData) => row.isActive,
      header: 'nav.system-settings.scheduler.table.header.active',
    },
    {
      columnDef: 'id',
      cell: (row: SchedulerTaskData) => row.id,
      header: 'nav.system-settings.scheduler.table.header.id',
    },
    {
      columnDef: 'name',
      cell: (row: SchedulerTaskData) => row.name,
      header: 'nav.system-settings.scheduler.table.header.name',
    },
    {
      columnDef: 'description',
      cell: (row: SchedulerTaskData) => row.description,
      header: 'nav.system-settings.scheduler.table.header.description',
    },
    {
      columnDef: 'service',
      cell: (row: SchedulerTaskData) => {
        const service = this.userServices.find(val => {
          return val.id === row.serviceId;
        });
        return service?.name ?? '';
      },
      header: 'nav.system-settings.scheduler.table.header.service',
    },
    {
      columnDef: 'component',
      cell: (row: SchedulerTaskData) => row.component,
      header: 'nav.system-settings.scheduler.table.header.component',
    },
    {
      columnDef: 'method',
      cell: (row: SchedulerTaskData) => row.verb,
      header: 'nav.system-settings.scheduler.table.header.method',
    },
    {
      columnDef: 'frequency',
      cell: (row: SchedulerTaskData) => row.frequency,
      header: 'nav.system-settings.scheduler.table.header.frequency',
    },
    {
      columnDef: 'log',
      cell: (row: SchedulerTaskData) => !!row.taskLogByTaskId,
      header: 'nav.system-settings.scheduler.table.header.log',
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
      .getAll({ limit: limit, offset: offset, filter: filter })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
