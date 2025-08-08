import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { Component, Inject } from '@angular/core';
import { RoleRow, RoleType } from 'src/app/shared/types/role';
import { ROLE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { DfDuplicateDialogComponent } from 'src/app/shared/components/df-duplicate-dialog/df-duplicate-dialog.component';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { catchError, throwError } from 'rxjs';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-roles-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class DfManageRolesTableComponent extends DfManageTableComponent<RoleRow> {
  expandedElement: any | null;
  constructor(
    @Inject(ROLE_SERVICE_TOKEN)
    private roleService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);

    // Add duplicate action
    const duplicateAction = {
      label: 'duplicate',
      function: (row: RoleRow) => this.duplicateRole(row),
      ariaLabel: {
        key: 'duplicateRole',
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

  filterQuery = getFilterQuery('roles');

  override columns = [
    {
      columnDef: 'active',
      cell: (row: RoleRow) => `${row.active}`,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: RoleRow) => `${row.name}`,
      header: 'name',
    },
    {
      columnDef: 'description',
      cell: (row: RoleRow) => `${row.description}`,
      header: 'description',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: RoleType[]): RoleRow[] {
    return data.map((role: RoleType) => {
      return {
        id: role.id,
        name: role.name,
        description: role.description ? role.description : '',
        active: role.isActive,
      };
    });
  }

  override deleteRow(row: RoleRow): void {
    this.roleService.delete(row.id).subscribe(() => {
      this.refreshTable();
    });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.roleService
      .getAll<GenericListResponse<RoleType>>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  duplicateRole(row: RoleRow): void {
    // First, get the full role details with related data
    this.roleService
      .get<any>(row.id, {
        related: 'role_service_access_by_role_id,lookup_by_role_id',
      })
      .pipe(
        catchError(error => {
          console.error('Failed to fetch role details:', error);
          return throwError(() => error);
        })
      )
      .subscribe(roleData => {
        console.log('Role data from API:', roleData);
        // Get all existing role names for validation
        this.roleService
          .getAll<GenericListResponse<RoleType>>({ limit: 1000 })
          .subscribe(allRoles => {
            const existingNames = allRoles.resource.map(r => r.name);

            const dialogRef = this.dialog.open(DfDuplicateDialogComponent, {
              width: '400px',
              data: {
                title: 'roles.duplicate.title',
                message: 'roles.duplicate.message',
                label: 'roles.duplicate.nameLabel',
                originalName: roleData.name,
                existingNames: existingNames,
              },
            });

            dialogRef.afterClosed().subscribe(newName => {
              if (newName) {
                // Create a copy of the role with all its configurations
                // Using snake_case for the API payload
                const duplicatedRole = {
                  name: newName,
                  description: `${roleData.description || ''} (copy)`,
                  is_active: roleData.isActive || roleData.is_active,
                  // Copy service access permissions - check both camelCase and snake_case
                  role_service_access_by_role_id:
                    (
                      roleData.roleServiceAccessByRoleId ||
                      roleData.role_service_access_by_role_id
                    )?.map((access: any) => ({
                      service_id: access.serviceId || access.service_id,
                      component: access.component,
                      verb_mask: access.verbMask || access.verb_mask,
                      requestor_mask:
                        access.requestorMask || access.requestor_mask,
                      filters:
                        access.filters?.map((filter: any) => ({
                          name: filter.name || filter.field,
                          operator: filter.operator,
                          value: filter.value,
                        })) || [],
                      filter_op: access.filterOp || access.filter_op || 'AND',
                    })) || [],
                  // Copy lookup keys - check both camelCase and snake_case
                  lookup_by_role_id:
                    (
                      roleData.lookupByRoleId || roleData.lookup_by_role_id
                    )?.map((lookup: any) => ({
                      name: lookup.name,
                      value: lookup.value,
                      private: lookup.private,
                      description: lookup.description,
                    })) || [],
                };

                // Wrap in resource array as expected by the API
                const payload = {
                  resource: [duplicatedRole],
                };

                console.log(
                  'Sending payload:',
                  JSON.stringify(payload, null, 2)
                );

                // Create the new role
                this.roleService
                  .create(payload, {
                    snackbarSuccess: 'roles.alerts.duplicateSuccess',
                    fields: '*',
                    related: 'role_service_access_by_role_id,lookup_by_role_id',
                  })
                  .pipe(
                    catchError(error => {
                      console.error('Failed to duplicate role:', error);
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
