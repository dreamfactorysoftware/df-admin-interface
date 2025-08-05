import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { AppType, AppRow } from '../../shared/types/apps';
import { APP_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import { generateApiKey } from 'src/app/shared/utilities/hash';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { AdditonalAction } from 'src/app/shared/types/table';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfDuplicateDialogComponent } from 'src/app/shared/components/df-duplicate-dialog/df-duplicate-dialog.component';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { catchError, throwError } from 'rxjs';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-apps-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
    './df-manage-apps-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageAppsTableComponent extends DfManageTableComponent<AppRow> {
  constructor(
    @Inject(APP_SERVICE_TOKEN)
    private appsService: DfBaseCrudService,
    override systemConfigDataService: DfSystemConfigDataService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog,
    private snackbarService: DfSnackbarService
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
    this.snackbarService.setSnackbarLastEle('', false);
    const extraActions: Array<AdditonalAction<AppRow>> = [
      {
        label: 'apps.launchApp',
        function: (row: AppRow) => {
          window.open(row.launchUrl, '_blank');
        },
        ariaLabel: {
          key: 'apps.launchApp',
        },
        disabled: (row: AppRow) => !row.launchUrl,
      },
      {
        label: 'apps.createApp.apiKey.copy',
        function: (row: AppRow) => {
          navigator.clipboard.writeText(row.apiKey);
        },
        ariaLabel: {
          key: 'apps.createApp.apiKey.copy',
        },
      },
      {
        label: 'apps.createApp.apiKey.refresh',
        function: async (row: AppRow) => {
          const newKey = await generateApiKey(
            this.systemConfigDataService.environment.server.host,
            row.name
          );
          this.appsService
            .update(row.id, { apiKey: newKey })
            .subscribe(() => this.refreshTable());
        },
        ariaLabel: {
          key: 'apps.createApp.apiKey.refresh',
        },
        disabled: row => row.createdById === null,
      },
    ];
    
    // Add duplicate action before delete action
    const duplicateAction = {
      label: 'duplicate',
      function: (row: AppRow) => this.duplicateApp(row),
      ariaLabel: {
        key: 'duplicateApp',
        param: 'name',
      },
      icon: faCopy,
    };
    
    if (this.actions.additional) {
      // Find the delete action index
      const deleteIndex = this.actions.additional.findIndex(
        action => action.label === 'delete'
      );
      if (deleteIndex !== -1) {
        // Insert duplicate before delete
        this.actions.additional.splice(deleteIndex, 0, duplicateAction);
      } else {
        // Add at the beginning if no delete found
        this.actions.additional.unshift(duplicateAction);
      }
      // Add the extra actions at the end
      this.actions.additional.push(...extraActions);
    } else {
      this.actions.additional = [duplicateAction, ...extraActions];
    }
  }
  override columns = [
    {
      columnDef: 'active',
      cell: (row: AppRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: AppRow) => row.name,
      header: 'name',
    },
    {
      columnDef: 'role',
      cell: (row: AppRow) => row.role,
      header: 'role',
    },
    {
      columnDef: 'apiKey',
      cell: (row: AppRow) => row.apiKey,
      header: 'apiKey',
    },
    {
      columnDef: 'description',
      cell: (row: AppRow) => row.description,
      header: 'description',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: AppType[]): AppRow[] {
    return data.map((app: AppType) => {
      return {
        id: app.id,
        name: app.name,
        role: app.roleByRoleId?.description || '',
        apiKey: app.apiKey,
        description: app.description,
        active: app.isActive,
        launchUrl: app.launchUrl,
        createdById: app.createdById,
      };
    });
  }

  filterQuery = getFilterQuery('apps');

  override deleteRow(row: AppRow): void {
    this.appsService.delete(row.id).subscribe(() => {
      this.refreshTable();
    });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.appsService
      .getAll<GenericListResponse<AppType>>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  duplicateApp(row: AppRow): void {
    // First, get the full app details
    this.appsService.get<AppType>(row.id)
      .pipe(
        catchError(error => {
          console.error('Failed to fetch app details:', error);
          return throwError(() => error);
        })
      )
      .subscribe(app => {
      // Get all existing app names for validation
      this.appsService
        .getAll<GenericListResponse<AppType>>({ limit: 1000 })
        .subscribe(allApps => {
          const existingNames = allApps.resource.map(a => a.name);
          
          const dialogRef = this.dialog.open(DfDuplicateDialogComponent, {
            width: '400px',
            data: {
              title: 'apps.duplicate.title',
              message: 'apps.duplicate.message',
              label: 'apps.duplicate.nameLabel',
              originalName: app.name,
              existingNames: existingNames,
            },
          });

          dialogRef.afterClosed().subscribe(async (newName) => {
            if (newName) {
              // Generate a new API key for the duplicated app
              const newApiKey = await generateApiKey(
                this.systemConfigDataService.environment.server.host,
                newName
              );
              
              // Create a copy of the app with the new name and API key
              // Using snake_case as expected by the API
              const duplicatedApp = {
                name: newName,
                api_key: newApiKey,
                description: `${app.description || ''} (copy)`,
                is_active: app.isActive,
                type: app.type,
                role_id: app.roleId || null,
                // Copy app location specific fields
                url: app.url || null,
                storage_service_id: app.storageServiceId || null,
                storage_container: app.storageContainer || null,
                path: app.path || null,
                // Copy additional settings
                requires_fullscreen: app.requiresFullscreen,
                allow_fullscreen_toggle: app.allowFullscreenToggle,
                toggle_location: app.toggleLocation,
              };
              
              // Wrap in resource array as expected by the API
              const payload = {
                resource: [duplicatedApp]
              };
              
              // Create the new app
              this.appsService
                .create(payload, { 
                  snackbarSuccess: 'apps.alerts.duplicateSuccess',
                  fields: '*',
                  related: 'role_by_role_id' 
                })
                .pipe(
                  catchError(error => {
                    console.error('Failed to duplicate app:', error);
                    return throwError(() => error);
                  })
                )
                .subscribe(() => {
                  this.refreshTable();
                });
            }
          });
        });
    });
  }
}
