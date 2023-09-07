import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { CacheRow, CacheType } from './df-cache.types';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { CACHE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { takeUntil } from 'rxjs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'df-cache-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    MatTableModule,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
})
export class DfCacheTableComponent extends DfManageTableComponent<CacheRow> {
  constructor(
    @Inject(CACHE_SERVICE_TOKEN)
    private cacheService: DfBaseCrudService,
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
  }

  override allowCreate = false;

  override columns = [
    {
      columnDef: 'label',
      header: 'cache.perServiceCaches',
      cell: (row: CacheRow) => row.label,
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): CacheRow[] {
    return data.map((app: CacheType) => {
      return {
        label: app.label,
        name: app.name,
      };
    });
  }

  // TODO get query from Jas
  filterQuery(value: string): string {
    return `(label like "%${value}%")`;
  }

  override deleteRow(row: CacheRow): void {
    return;
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.cacheService
      .getAll<GenericListResponse<CacheType>>({
        limit,
        offset,
        filter,
        fields: '*',
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
