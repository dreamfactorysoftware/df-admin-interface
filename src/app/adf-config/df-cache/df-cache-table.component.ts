import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { CacheRow, CacheType } from '../../shared/types/df-cache';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { CACHE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { Actions } from 'src/app/shared/types/table';
import { MatButtonModule } from '@angular/material/button';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';

@Component({
  selector: 'df-cache-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
  providers: [DfBaseCrudService],
})
export class DfCacheTableComponent extends DfManageTableComponent<CacheRow> {
  constructor(
    @Inject(CACHE_SERVICE_TOKEN)
    cacheService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  override allowCreate = false;
  override allowFilter = false;

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

  override actions: Actions<CacheRow> = {
    default: null,
    additional: [
      {
        label: 'cache.clear',
        icon: faRefresh,
        function: (row: CacheRow) => this.clearCache(row),
        ariaLabel: {
          key: 'cache.flushService',
          param: 'label',
        },
      },
    ],
  };

  mapDataToTable(data: CacheType[]): CacheRow[] {
    return data.map((app: CacheType) => {
      return {
        label: app.label,
        name: app.name,
      };
    });
  }

  clearCache = (row: CacheRow) => {
    this.openDialog(row);
    // this.cacheService
    //   .delete(row.name, { snackbarSuccess: 'cache.serviceCacheFlushed' })
    //   .subscribe({
    //     next: () => console.log('Cache flushed'),
    //     error: (err: any) => console.error('Error flushing cache', err),
    //   });
  };

  openDialog(row: CacheRow) {
    const dialogRef = this.dialog.open(DfCacheModal, {
      data: { row },
    });
    dialogRef.afterClosed().subscribe();
  }

  filterQuery = getFilterQuery();

  refreshTable = () => null;
}

@Component({
  selector: 'df-cache-modal',
  templateUrl: 'df-cache-modal.html',
  styleUrls: ['./df-cache.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    DfPaywallComponent,
    TranslocoPipe,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class DfCacheModal {
  @ViewChild('calendlyWidget') calendlyWidget: ElementRef;
  row: CacheRow;
  cacheService: DfBaseCrudService;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(CACHE_SERVICE_TOKEN)
    cacheService: DfBaseCrudService
  ) {
    this.row = data.row;
    this.cacheService = cacheService;
  }

  clearCache() {
    this.cacheService
      .delete(this.row.name, { snackbarSuccess: 'cache.serviceCacheFlushed' })
      .subscribe({
        error: (err: any) => console.error('Error flushing cache', err),
      });
  }
}
