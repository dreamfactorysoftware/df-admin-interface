import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { CONFIG_CORS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { CorsConfigData } from '../types';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'df-manage-cors-table',
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
export class DfManageCorsTableComponent extends DfManageTableComponent<CorsConfigData> {
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslocoService,
    @Inject(CONFIG_CORS_SERVICE_TOKEN)
    private corsService: DfBaseCrudService
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
      cell: (row: CorsConfigData) => row.enabled,
      header: 'active',
    },
    {
      columnDef: 'id',
      cell: (row: CorsConfigData) => row.id,
      header: 'ID',
    },
    {
      columnDef: 'path',
      cell: (row: CorsConfigData) => row.path,
      header: 'Path',
    },
    {
      columnDef: 'description',
      cell: (row: CorsConfigData) => row.description,
      header: 'Description',
    },
    {
      columnDef: 'maxAge',
      cell: (row: CorsConfigData) => row.maxAge,
      header: 'Max Age',
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: any[]): CorsConfigData[] {
    return data;
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
      });
  }

  override filterQuery(value: string): string {
    return '';
  }
}
