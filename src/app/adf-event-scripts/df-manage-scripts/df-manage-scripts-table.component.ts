import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { ScriptObject } from '../../shared/types/scripts';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { Component, Inject } from '@angular/core';
import { EVENT_SCRIPT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions } from 'src/app/shared/types/table';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-services-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageScriptsTableComponent extends DfManageTableComponent<ScriptObject> {
  columns = [
    {
      columnDef: 'active',
      cell: (row: ScriptObject) => row.isActive,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: ScriptObject) => row.name,
      header: 'name',
    },
    {
      columnDef: 'type',
      cell: (row: ScriptObject) => row.type,
      header: 'type',
    },
    {
      columnDef: 'actions',
    },
  ];

  override actions: Actions<ScriptObject> = {
    ...this.actions,
    default: {
      label: 'view',
      function: (row: ScriptObject) =>
        this.router.navigate([row.name], { relativeTo: this._activatedRoute }),
      ariaLabel: {
        key: 'view',
      },
    },
  };

  constructor(
    @Inject(EVENT_SCRIPT_SERVICE_TOKEN)
    private eventScriptService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  mapDataToTable(data: ScriptObject[]): ScriptObject[] {
    return data;
  }
  filterQuery = getFilterQuery('eventScripts');

  override refreshTable(
    limit?: number,
    offset?: number,
    filter?: string
  ): void {
    this.eventScriptService
      .getAll<GenericListResponse<ScriptObject>>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  override deleteRow(row: ScriptObject): void {
    this.eventScriptService
      .delete(row.name)
      .subscribe(() => this.refreshTable());
  }
}
