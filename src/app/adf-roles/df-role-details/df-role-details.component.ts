import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AccessForm,
  RolePayload,
  RoleServiceAccessType,
} from '../../shared/types/roles';
import { AsyncPipe, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { ROLE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DfLookupKeysComponent } from 'src/app/shared/components/df-lookup-keys/df-lookup-keys.component';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { DfRolesAccessComponent } from '../df-roles-access/df-roles-access.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  AlertType,
  DfAlertComponent,
} from 'src/app/shared/components/df-alert/df-alert.component';
import { catchError, filter, throwError } from 'rxjs';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-role-details',
  templateUrl: './df-role-details.component.html',
  standalone: true,
  imports: [
    TranslocoPipe,
    AsyncPipe,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    DfLookupKeysComponent,
    MatSlideToggleModule,
    MatButtonModule,
    DfRolesAccessComponent,
    NgIf,
    DfAlertComponent,
    AsyncPipe,
  ],
})
export class DfRoleDetailsComponent implements OnInit {
  roleForm: FormGroup;
  type = '';
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  visibilityArray: boolean[] = [];
  originalLookupKeyIds: number[] = [];

  constructor(
    @Inject(ROLE_SERVICE_TOKEN)
    private roleService: DfBaseCrudService,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: DfThemeService,
    private snackbarService: DfSnackbarService
  ) {
    this.roleForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      description: [''],
      active: [false],
      serviceAccess: this.fb.array([]),
      lookupKeys: this.fb.array([]),
    });
  }
  isDarkMode = this.themeService.darkMode$;
  filterOp = '';
  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data, type }) => {
      this.type = type;
      if (data) {
        this.snackbarService.setSnackbarLastEle(
          data.label ? data.label : data.name,
          true
        );
        this.roleForm.patchValue({
          id: data.id,
          name: data.name,
          description: data.description,
          active: data.isActive,
        });

        if (data.roleServiceAccessByRoleId.length > 0) {
          this.filterOp = data.roleServiceAccessByRoleId[0].filterOp;
          data.roleServiceAccessByRoleId.forEach(
            (item: RoleServiceAccessType) => {
              this.visibilityArray.push(true);
              const advancedFilters = new FormArray(
                (item.filters || []).map(
                  (each: any) =>
                    new FormGroup({
                      expandField: new FormControl(each.name),
                      expandOperator: new FormControl(each.operator),
                      expandValue: new FormControl(each.value),
                      filterOp: new FormControl(item.filterOp),
                    })
                )
              );
              (this.roleForm.controls['serviceAccess'] as FormArray).push(
                new FormGroup({
                  service: new FormControl(
                    item.serviceId ? item.serviceId : 0,
                    [Validators.required]
                  ),
                  component: new FormControl(item.component),
                  access: new FormControl(
                    this.handleAccessValue(item.verbMask),
                    [Validators.required]
                  ),
                  requester: new FormControl(
                    this.handleRequesterValue(item.requestorMask)
                  ),
                  advancedFilters: advancedFilters,
                  id: new FormControl(item.id),
                  extendField: new FormControl(item.extendField),
                  extendOperator: new FormControl(item.extendOperator),
                  extendValue: new FormControl(item.extendValue),
                  filterOp: new FormControl(item.filterOp),
                })
              );
            }
          );
        }

        if (data.lookupByRoleId.length > 0) {
          data.lookupByRoleId.forEach((item: any) => {
            // Track original lookup key IDs for deletion detection
            if (item.id) {
              this.originalLookupKeyIds.push(item.id);
            }
            (this.roleForm.controls['lookupKeys'] as FormArray).push(
              new FormGroup({
                id: new FormControl(item.id),
                name: new FormControl(item.name, [Validators.required]),
                value: new FormControl(item.value),
                private: new FormControl(item.private),
              })
            );
          });
        }
      }
    });
  }

  handleRequesterValue(value: number): number[] {
    if (value === 3) {
      return [1, 2];
    }
    return [value];
  }

  handleAccessValue(totalValue: number): number[] {
    const originalArray = [1, 2, 4, 8, 16];
    const result: number[] = [];

    for (let i = originalArray.length - 1; i >= 0; i--) {
      const currentValue = originalArray[i];

      if (totalValue >= currentValue) {
        result.push(currentValue);
        totalValue -= currentValue;
      }
    }

    return result;
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }

  get serviceAccess(): FormArray {
    return this.roleForm.get('serviceAccess') as FormArray;
  }

  onSubmit() {
    // Clear validators for all hidden items before validation
    const serviceAccess = this.roleForm.get('serviceAccess') as FormArray;
    serviceAccess.controls.forEach((control, index) => {
      if (!this.visibilityArray[index]) {
        control.get('service')?.clearValidators();
        control.get('component')?.clearValidators();
        control.get('access')?.clearValidators();
        control.get('requester')?.clearValidators();
        control.get('service')?.updateValueAndValidity();
        control.get('component')?.updateValueAndValidity();
        control.get('access')?.updateValueAndValidity();
        control.get('requester')?.updateValueAndValidity();
      }
    });

    if (this.roleForm.invalid) {
      // Mark all controls as touched to show validation errors
      this.roleForm.markAllAsTouched();
      return;
    }
    const formValue = this.roleForm.getRawValue();
    if (formValue.name === '' || formValue.name === null) {
      return;
    }
    const payload: RolePayload = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      isActive: formValue.active,
      roleServiceAccessByRoleId: formValue.serviceAccess.map(
        (val: AccessForm, index: number) => {
          const filtersArray = val.advancedFilters.map((filter: any) => ({
            name: filter.expandField,
            operator: filter.expandOperator,
            value: filter.expandValue,
          }));
          const filterOp = val.advancedFilters.map(
            (filter: any) => filter.filterOp
          );
          const roleId = this.visibilityArray[index] ? formValue.id : null;
          return {
            id: val.id,
            roleId: roleId,
            serviceId: val.service === 0 ? null : val.service,
            component: val.component,
            verbMask: val.access.reduce((acc, cur) => acc + cur, 0), // add up all the values in the array
            requestorMask: val.requester.reduce((acc, cur) => acc + cur, 0), // 1 = API, 2 = SCRIPT, 3 = API & SCRIPT
            filters: filtersArray,
            filterOp: filterOp[0],
          };
        }
      ),
      lookupByRoleId: this.getLookupKeysWithDeletions(formValue),
    };
    const createPayload = {
      resource: [payload],
    };
    if (this.type === 'edit' && payload.id) {
      this.roleService
        .update(payload.id, payload)
        .pipe(
          catchError(err => {
            this.triggerAlert('error', err.error.error.message);
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.goBack();
        });
    } else {
      this.roleService
        .create(createPayload, {
          fields: '*',
          related: 'role_service_access_by_role_id,lookup_by_role_id',
        })
        .pipe(
          catchError(err => {
            this.triggerAlert(
              'error',
              err.error.error.context.resource[0].message
            );
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.goBack();
        });
    }
  }

  getLookupKeysWithDeletions(formValue: any) {
    const currentLookupKeys = formValue.lookupKeys;
    const result = [...currentLookupKeys];

    // Find IDs that were deleted (present in original but not in current)
    const currentIds = currentLookupKeys
      .map((lk: any) => lk.id)
      .filter((id: any) => id);

    const deletedIds = this.originalLookupKeyIds.filter(
      (id: number) => !currentIds.includes(id)
    );

    // Add deleted lookup keys with role_id set to null to trigger deletion
    deletedIds.forEach((id: number) => {
      result.push({
        id: id,
        role_id: null,
      });
    });

    return result;
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
