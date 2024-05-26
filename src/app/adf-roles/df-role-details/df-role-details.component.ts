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
import { catchError, throwError } from 'rxjs';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';

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

  constructor(
    @Inject(ROLE_SERVICE_TOKEN)
    private roleService: DfBaseCrudService,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: DfThemeService
  ) {
    this.roleForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: [''],
      active: [false],
      serviceAccess: this.fb.array([]),
      lookupKeys: this.fb.array([]),
    });
  }
  isDarkMode = this.themeService.darkMode$;

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data, type }) => {
      this.type = type;
      if (data) {
        this.roleForm.patchValue({
          id: data.id,
          name: data.name,
          description: data.description,
          active: data.isActive,
        });

        if (data.roleServiceAccessByRoleId.length > 0) {
          data.roleServiceAccessByRoleId.forEach(
            (item: RoleServiceAccessType) => {
              const advancedFilters = new FormArray(
                (item.filters || []).map(
                  (each: any) =>
                    new FormGroup({
                      expandField: new FormControl(each.name),
                      expandOperator: new FormControl(each.operator),
                      expandValue: new FormControl(each.value),
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
                    this.handleAccessValue(item.verbMask)
                  ),
                  requester: new FormControl(
                    this.handleRequesterValue(item.requestorMask)
                  ),
                  advancedFilters: advancedFilters,
                  id: new FormControl(item.id),
                  extendField: new FormControl(item.extendField),
                  extendOperator: new FormControl(item.extendOperator),
                  extendValue: new FormControl(item.extendValue),
                })
              );
            }
          );
        }

        if (data.lookupByRoleId.length > 0) {
          data.lookupByRoleId.forEach((item: any) => {
            (this.roleForm.controls['lookupKeys'] as FormArray).push(
              new FormGroup({
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

  // onSubmit() {
  //   if (this.roleForm.invalid) return;

  //   const formValue = this.roleForm.getRawValue();
  //   console.log(formValue);

  //   const payload: RolePayload = {
  //     id: formValue.id,
  //     name: formValue.name,
  //     description: formValue.description,
  //     isActive: formValue.active,
  //     roleServiceAccessByRoleId: formValue.serviceAccess.map(
  //       (val: AccessForm) => {
  //         const advancedFilters = {
  //           field: val.expandField,
  //           operator: val.expandOperator,
  //           value: val.expandValue,
  //         };

  //         const filtersArray = [];
  //         filtersArray.push(advancedFilters);

  //         return {
  //           id: val.id,
  //           serviceId: val.service,
  //           component: val.component,
  //           verbMask: val.access.reduce((acc, cur) => acc + cur, 0), // add up all the values in the array
  //           requestorMask: val.requester.reduce((acc, cur) => acc + cur, 0), // 1 = API, 2 = SCRIPT, 3 = API & SCRIPT
  //           filters: filtersArray,
  //           filterOp: 'AND',
  //         };
  //       }
  //     ),
  //     lookupByRoleId: formValue.lookupKeys,
  //   };

  //   const createPayload = {
  //     resource: [payload],
  //   };

  //   if (this.type === 'edit' && payload.id) {
  //     this.roleService
  //       .update(payload.id, payload)
  //       .pipe(
  //         catchError(err => {
  //           this.triggerAlert('error', err.error.error.message);
  //           return throwError(() => new Error(err));
  //         })
  //       )
  //       .subscribe(() => {
  //         this.goBack();
  //       });
  //   } else {
  //     console.log(23);
  //     this.roleService
  //       .create(createPayload, {
  //         fields: '*',
  //         related: 'role_service_access_by_role_id,lookup_by_role_id',
  //       })
  //       .pipe(
  //         catchError(err => {
  //           this.triggerAlert(
  //             'error',
  //             err.error.error.context.resource[0].message
  //           );
  //           return throwError(() => new Error(err));
  //         })
  //       )
  //       .subscribe(() => {
  //         this.goBack();
  //       });
  //   }
  get serviceAccess(): FormArray {
    return this.roleForm.get('serviceAccess') as FormArray;
  }

  onSubmit() {
    if (this.roleForm.invalid) return;

    const formValue = this.roleForm.getRawValue();
    console.log(formValue);

    const payload: RolePayload = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      isActive: formValue.active,
      roleServiceAccessByRoleId: formValue.serviceAccess.map(
        (val: AccessForm) => {
          const filtersArray = val.advancedFilters.map((filter: any) => ({
            name: filter.expandField,
            operator: filter.expandOperator,
            value: filter.expandValue,
          }));

          return {
            id: val.id,
            serviceId: val.service === 0 ? null : val.service,
            component: val.component,
            verbMask: val.access.reduce((acc, cur) => acc + cur, 0), // add up all the values in the array
            requestorMask: val.requester.reduce((acc, cur) => acc + cur, 0), // 1 = API, 2 = SCRIPT, 3 = API & SCRIPT
            filters: filtersArray,
            filterOp: 'AND',
          };
        }
      ),
      lookupByRoleId: formValue.lookupKeys,
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

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
