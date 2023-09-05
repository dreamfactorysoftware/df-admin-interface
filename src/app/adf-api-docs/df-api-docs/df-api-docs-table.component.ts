import { Component, Inject } from '@angular/core';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { ApiDocsRowData } from '../types';
import { API_DOCS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
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
import {
  ServiceType,
  SystemServiceData,
} from 'src/app/adf-services/services/service-data.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { takeUntil } from 'rxjs';

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

  constructor(
    @Inject(API_DOCS_SERVICE_TOKEN)
    private apiDocsService: DfBaseCrudService,
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
      .subscribe(data => {
        this.serviceTypes = data['serviceTypes'].resource;
      });
  }

  override columns = [
    {
      columnDef: 'name',
      header: 'nav.api-connections.api-docs.table.header.name',
      cell: (row: ApiDocsRowData) => row.name,
    },
    {
      columnDef: 'label',
      header: 'nav.api-connections.api-docs.table.header.label',
      cell: (row: ApiDocsRowData) => row.label,
    },
    {
      columnDef: 'description',
      header: 'nav.api-connections.api-docs.table.header.description',
      cell: (row: ApiDocsRowData) => row.description,
    },
    {
      columnDef: 'group',
      header: 'nav.api-connections.api-docs.table.header.group',
      cell: (row: ApiDocsRowData) => row.group,
    },
    {
      columnDef: 'type',
      header: 'nav.api-connections.api-docs.table.header.type',
      cell: (row: ApiDocsRowData) => row.type,
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: SystemServiceData[]): ApiDocsRowData[] {
    return data.map(val => {
      return {
        name: val.name,
        description: val.description,
        group: this.getRelatedServiceTypeGroup(val.type),
        label: val.label,
        type: val.type,
      };
    });
  }

  private getRelatedServiceTypeGroup(serviceType: string) {
    const service = this.serviceTypes.find(type => {
      return type.name === serviceType;
    }) as ServiceType;

    return service.group;
  }

  override refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined
  ): void {
    this.apiDocsService
      .getAll<GenericListResponse<SystemServiceData>>({
        limit,
        offset,
        filter,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.resource.length;
      });
  }

  override filterQuery(value: string): string {
    return '';
  }
}
