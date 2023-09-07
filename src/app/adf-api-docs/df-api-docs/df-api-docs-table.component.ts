import { Component, Inject } from '@angular/core';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { ApiDocsRowData } from '../types';
import { SERVICES_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { takeUntil } from 'rxjs';
import { Service, ServiceType } from 'src/app/shared/types/service';

@Component({
  selector: 'df-api-docs-table',
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
export class DfApiDocsTableComponent extends DfManageTableComponent<ApiDocsRowData> {
  serviceTypes: ServiceType[];
  override allowCreate = false;
  override readOnly = true;

  constructor(
    @Inject(SERVICES_SERVICE_TOKEN)
    private servicesService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslocoService,
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
      .subscribe(({ serviceTypes }) => {
        this.serviceTypes = serviceTypes;
      });
  }

  override columns = [
    {
      columnDef: 'name',
      header: 'apiDocs.table.header.name',
      cell: (row: ApiDocsRowData) => row.name,
    },
    {
      columnDef: 'label',
      header: 'apiDocs.table.header.label',
      cell: (row: ApiDocsRowData) => row.label,
    },
    {
      columnDef: 'description',
      header: 'apiDocs.table.header.description',
      cell: (row: ApiDocsRowData) => row.description,
    },
    {
      columnDef: 'group',
      header: 'apiDocs.table.header.group',
      cell: (row: ApiDocsRowData) => row.group,
    },
    {
      columnDef: 'type',
      header: 'apiDocs.table.header.type',
      cell: (row: ApiDocsRowData) => row.type,
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: Service[]): ApiDocsRowData[] {
    return data.map(val => {
      const type = this.getServiceType(val.type);
      return {
        name: val.name,
        description: val.description,
        group: type?.group ?? '',
        label: val.label,
        type: type?.label ?? '',
      };
    });
  }

  getServiceType(type: string) {
    return this.serviceTypes.find(val => val.name === type);
  }

  override refreshTable(
    limit?: number,
    offset?: number,
    filter?: string
  ): void {
    this.servicesService
      .getAll<GenericListResponse<Service>>({
        limit,
        offset,
        filter: `(type not like "%swagger%")${filter ? ` and ${filter}` : ''}`,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  override filterQuery(value: string): string {
    return `((name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%"))`;
  }
}
