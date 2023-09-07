import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { takeUntil } from 'rxjs';
import { SERVICES_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { Service, ServiceRow, ServiceType } from 'src/app/shared/types/service';

@Component({
  selector: 'df-manage-services-table',
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
    MatDialogModule,
  ],
})
export class DfManageServicesTableComponent extends DfManageTableComponent<ServiceRow> {
  serviceTypes: Array<ServiceType> = [];
  system = false;
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslocoService,
    @Inject(SERVICES_SERVICE_TOKEN)
    private serviceService: DfBaseCrudService,
    dialog: MatDialog
  ) {
    super(
      router,
      activatedRoute,
      liveAnnouncer,
      breakpointService,
      translateService,
      dialog
    );
    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ system, data }) => {
        this.serviceTypes = data.serviceTypes;
        this.system = system;
        this.allowCreate = !system;
      });
  }
  override columns = [
    {
      columnDef: 'active',
      cell: (row: ServiceRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: ServiceRow) => row.name,
      header: 'name',
    },
    {
      columnDef: 'label',
      cell: (row: ServiceRow) => row.label,
      header: 'label',
    },
    {
      columnDef: 'description',
      cell: (row: ServiceRow) => row.description,
      header: 'description',
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: any[]): ServiceRow[] {
    return data.map(service => {
      return {
        id: service.id,
        name: service.name,
        label: service.label,
        description: service.description,
        active: service.isActive,
        deletable: service.deletable,
        type: service.type,
      };
    });
  }

  filterQuery(value: string): string {
    return `((name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%") or (type like "%${value}%"))`;
  }

  override deleteRow(row: ServiceRow): void {
    this.serviceService
      .delete(row.id, { snackbarSuccess: 'admins.alerts.deleteSuccess' })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined
  ): void {
    if (this.serviceTypes && this.serviceTypes.length !== 0) {
      filter = `${filter ? `${filter} and ` : ''}(type in ("${this.serviceTypes
        .map(src => src.name)
        .join('","')}"))`;
    }
    filter = `${filter ? `${filter} and ` : ''}(created_by_id is${
      !this.system ? ' not ' : ' '
    }null)`;

    this.serviceService
      .getAll<GenericListResponse<Service>>({
        limit,
        offset,
        filter,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
