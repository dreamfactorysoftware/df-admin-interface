import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import {
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
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
import { catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { PLATFORM_SERVICES_FILTER } from 'src/app/shared/constants/services';
import {
  DfServiceHealthService,
  ServiceHealthContext,
} from './df-service-health.service';
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
  override emptyStateMessage = 'emptyState.services.message';
  override emptyStateActionLabel = 'emptyState.services.action';
  serviceTypes: Array<ServiceType> = [];
  system = false;
  private scopedByGroups = false;
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    @Inject(SERVICES_SERVICE_TOKEN)
    private serviceService: DfBaseCrudService,
    @Inject(SERVICE_TYPE_SERVICE_TOKEN)
    private serviceTypeService: DfBaseCrudService,
    private healthService: DfServiceHealthService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  private healthContext?: ServiceHealthContext;

  override ngOnInit(): void {
    // Call parent's ngOnInit first to set up the data source
    super.ngOnInit();

    // Score the catalog client-side. The context loads once; mapDataToTable
    // (every fetch path funnels through it) derives per-row health when it is
    // ready, and this re-derives whatever rows already rendered first.
    this.healthService.getContext().subscribe(context => {
      this.healthContext = context;
      if (this.dataSource.data.length) {
        this.dataSource.data = this.dataSource.data.map(row => ({
          ...row,
          health: this.healthService.derive(row, context),
        }));
      }
    });

    // Then subscribe to route data for additional setup
    this._activatedRoute.data.subscribe(routeData => {
      const { data } = routeData;
      this.system =
        routeData['system'] ||
        this._activatedRoute.snapshot.parent?.data?.['system'] ||
        false;
      this.serviceTypes = data?.serviceTypes ?? [];
      this.allowCreate = !this.system;
      if (!data?.resource) {
        this.loadTableData(routeData);
      }
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

  private loadTableData(routeData: any): void {
    const groups: string[] =
      routeData['groups'] ||
      this._activatedRoute.snapshot.parent?.data?.['groups'] ||
      [];
    this.scopedByGroups = groups.length > 0;

    const serviceTypes$ = groups.length
      ? forkJoin(
          groups.map(group =>
            this.serviceTypeService.getAll<GenericListResponse<ServiceType>>({
              fields: 'name',
              additionalParams: [{ key: 'group', value: group }],
            })
          )
        ).pipe(map(groups => groups.map(group => group.resource).flat()))
      : of([] as ServiceType[]);

    serviceTypes$
      .pipe(
        switchMap(serviceTypes => {
          this.serviceTypes = serviceTypes;
          const filter =
            serviceTypes.length > 0
              ? `${
                  this.system ? `${PLATFORM_SERVICES_FILTER} and ` : ''
                }(type in ("${serviceTypes.map(src => src.name).join('","')}"))`
              : this.scopedByGroups
                ? '(id = -1)'
                : this.system
                  ? PLATFORM_SERVICES_FILTER
                  : undefined;

          return this.serviceService
            .getAll<GenericListResponse<Service>>({
              sort: 'name',
              filter,
            })
            .pipe(map(services => ({ ...services, serviceTypes })));
        })
      )
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource ?? []);
        this.dataSource.paginator = this.paginator;
        this.tableLength = data.meta?.count ?? this.dataSource.data.length;
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
      // The list column scores governance only - it never opens a connection,
      // so it is named for what it measures. A live connection check needs one
      // request per service; that runs on the service's own page instead
      // (df-service-health-panel), not once per row here.
      columnDef: 'access',
      // Rendered by the shared table's dedicated 'access' branch (df-badge +
      // "why" mat-menu); cell() is unused for this column.
      cell: (row: ServiceRow) => row.health?.level,
      header: 'services.access.chip.header',
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

  private eventScripts: Service[] = [];

  override mapDataToTable(data: any[]): ServiceRow[] {
    return data.map(service => {
      const row: ServiceRow = {
        id: service.id,
        name: service.name,
        label: service.label,
        description: service.description,
        scripting: this.scriptingFor(service.name),
        active: service.isActive,
        deletable: service.deletable,
        type: service.type,
        // Opt-in signal; absent on stock DF services so the deprecated rule
        // never fires unless a service explicitly carries the flag.
        deprecated: service.deprecated === true,
      };
      if (this.healthContext) {
        row.health = this.healthService.derive(row, this.healthContext);
      }
      return row;
    });
  }

  private scriptingFor(serviceName: string): string {
    const match = this.eventScripts.find(script =>
      script.name.includes(serviceName)
    );
    return match ? match.name : 'not';
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
    } else if (this.scopedByGroups) {
      filter = `${filter ? `(${filter}) and ` : ''}(id = -1)`;
    }

    this.fetchTable(this.serviceService, { limit, offset, filter, refresh });
    this.loadEventScripts();
  }

  /**
   * Scripting-column enrichment. Runs alongside the main fetch: whichever
   * lands last wins (mapDataToTable reads the cache; this patches rows in
   * place). Deliberate degradation: on failure the table still renders with
   * scripting 'not'; the default-on interceptor surfaces the failure toast.
   */
  private loadEventScripts(): void {
    const isApiTypesOnly =
      this.serviceTypes.length === 1 &&
      this.serviceTypes[0].name === 'api_type';
    if (isApiTypesOnly) {
      return;
    }
    this.serviceService
      .getEventScripts<GenericListResponse<Service>>()
      .pipe(catchError(() => of({ resource: [] as Service[] })))
      .subscribe(scriptsData => {
        this.eventScripts = scriptsData.resource;
        this.dataSource.data.forEach(row => {
          row.scripting = this.scriptingFor(row.name);
        });
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
