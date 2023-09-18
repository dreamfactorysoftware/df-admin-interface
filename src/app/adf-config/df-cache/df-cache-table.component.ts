import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Actions,
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { CacheRow, CacheType } from './df-cache.types';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { CACHE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';

@Component({
  selector: 'df-cache-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfCacheTableComponent extends DfManageTableComponent<CacheRow> {
  constructor(
    @Inject(CACHE_SERVICE_TOKEN)
    private cacheService: DfBaseCrudService,
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

  mapDataToTable(data: any): CacheRow[] {
    return data.map((app: CacheType) => {
      return {
        label: app.label,
        name: app.name,
      };
    });
  }

  clearCache = (row: CacheRow) => {
    this.cacheService
      .delete(row.name, { snackbarSuccess: 'cache.serviceCacheFlushed' })
      .subscribe();
  };

  filterQuery = getFilterQuery();

  refreshTable = () => null;
}
