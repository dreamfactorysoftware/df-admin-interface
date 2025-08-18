import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { SERVICES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { Service, ServiceRow, ServiceType } from 'src/app/shared/types/service';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfDuplicateDialogComponent } from 'src/app/shared/components/df-duplicate-dialog/df-duplicate-dialog.component';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { catchError, throwError } from 'rxjs';
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
export class DfManageServicesTableComponent
  extends DfManageTableComponent<ServiceRow>
  implements OnInit
{
  serviceTypes: Array<ServiceType> = [];
  system = false;
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    @Inject(SERVICES_SERVICE_TOKEN)
    private serviceService: DfBaseCrudService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  override ngOnInit(): void {
    // Call parent's ngOnInit first to set up the data source
    super.ngOnInit();

    // Then subscribe to route data for additional setup
    this._activatedRoute.data.subscribe(routeData => {
      const { data } = routeData;
      this.system =
        routeData['system'] ||
        this._activatedRoute.snapshot.parent?.data?.['system'] ||
        false;
      this.serviceTypes = data?.serviceTypes;
      this.allowCreate = !this.system;
      if (this.system) {
        this.actions = {
          default: this.actions.default,
          additional:
            this.actions.additional?.filter(
              action => action.label !== 'delete'
            ) ?? null,
        };
      } else {
        // Add duplicate action for non-system services
        const duplicateAction = {
          label: 'duplicate',
          function: (row: ServiceRow) => this.duplicateService(row),
          ariaLabel: {
            key: 'duplicateService',
            param: 'name',
          },
          icon: faCopy,
        };

        if (this.actions.additional) {
          // Insert duplicate action before delete action
          const deleteIndex = this.actions.additional.findIndex(
            action => action.label === 'delete'
          );
          if (deleteIndex !== -1) {
            this.actions.additional.splice(deleteIndex, 0, duplicateAction);
          } else {
            this.actions.additional.push(duplicateAction);
          }
        }
      }
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
      columnDef: 'type',
      cell: (row: ServiceRow) => row.type,
      header: 'type',
    },
    {
      columnDef: 'scripting',
      cell: (row: ServiceRow) => row.scripting,
      header: 'Scripting',
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: any[]): ServiceRow[] {
    // Skip event scripts request if we're only looking at API Types
    const isApiTypesOnly =
      this.serviceTypes.length === 1 &&
      this.serviceTypes[0].name === 'api_type';

    // Map the data without checking event scripts for API Types
    return data.map(service => ({
      id: service.id,
      name: service.name,
      label: service.label,
      description: service.description,
      scripting: 'not', // Always set a default value
      active: service.isActive,
      deletable: service.deletable,
      type: service.type,
    }));
  }

  filterQuery = getFilterQuery('services');

  override deleteRow(row: ServiceRow): void {
    this.serviceService
      .delete(row.id, { snackbarSuccess: 'admins.alerts.deleteSuccess' })
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined,
    refresh?: true
  ): void {
    if (this.serviceTypes && this.serviceTypes.length !== 0) {
      filter = `${
        filter ? `(${filter}) and ` : ''
      }(type in ("${this.serviceTypes.map(src => src.name).join('","')}"))`;
    }

    this.serviceService
      .getAll<GenericListResponse<Service>>({
        limit,
        offset,
        filter,
        refresh,
      })
      .subscribe(data => {
        const mappedData = this.mapDataToTable(data.resource);

        // Only make event scripts request if not viewing API Types
        const isApiTypesOnly =
          this.serviceTypes.length === 1 &&
          this.serviceTypes[0].name === 'api_type';

        if (!isApiTypesOnly) {
          this.serviceService
            .getEventScripts<GenericListResponse<Service>>()
            .subscribe(scriptsData => {
              const scripts = scriptsData.resource;
              mappedData.forEach(service => {
                const match = scripts.find(script =>
                  script.name.includes(service.name)
                );
                service.scripting = match ? match.name : 'not';
              });
              this.dataSource.data = mappedData;
            });
        } else {
          this.dataSource.data = mappedData;
        }
        this.tableLength = data.meta.count;
      });
  }

  duplicateService(row: ServiceRow): void {
    // First, get the full service details
    this.serviceService
      .get<Service>(row.id)
      .pipe(
        catchError(error => {
          console.error('Failed to fetch service details:', error);
          return throwError(() => error);
        })
      )
      .subscribe(service => {
        // Get all existing service names for validation
        this.serviceService
          .getAll<GenericListResponse<Service>>({ limit: 1000 })
          .subscribe(allServices => {
            const existingNames = allServices.resource.map(s => s.name);

            const dialogRef = this.dialog.open(DfDuplicateDialogComponent, {
              width: '400px',
              data: {
                title: 'services.duplicate.title',
                message: 'services.duplicate.message',
                label: 'services.duplicate.nameLabel',
                originalName: service.name,
                existingNames: existingNames,
              },
            });

            dialogRef.afterClosed().subscribe(newName => {
              if (newName) {
                // Create a copy of the service with the new name, including all config
                const duplicatedService = {
                  name: newName,
                  label: service.label || newName,
                  description: `${service.description || ''} (copy)`,
                  is_active: service.isActive,
                  type: service.type,
                  // Copy the entire config object which contains all service-specific settings
                  config: service.config ? { ...service.config } : {},
                };

                // Wrap in resource array as expected by the API
                const payload = {
                  resource: [duplicatedService],
                };

                // Create the new service
                this.serviceService
                  .create(payload, {
                    snackbarSuccess: 'services.alerts.duplicateSuccess',
                  })
                  .pipe(
                    catchError(error => {
                      console.error('Failed to duplicate service:', error);
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
