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
import { ROUTES } from 'src/app/shared/constants/routes';
import { UntilDestroy } from '@ngneat/until-destroy';
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
  ],
})
export class DfRoleDetailsComponent implements OnInit {
  roleForm: FormGroup;
  type = '';

  constructor(
    @Inject(ROLE_SERVICE_TOKEN)
    private roleService: DfBaseCrudService,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
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

  ngOnInit(): void {
    this.activatedRoute.data.subscribe((data: any) => {
      this.type = data.type;
      if (data.data) {
        this.roleForm.patchValue({
          id: data.data.id,
          name: data.data.name,
          description: data.data.description,
          active: data.data.isActive,
        });

        if (data.data.roleServiceAccessByRoleId.length > 0) {
          data.data.roleServiceAccessByRoleId.forEach(
            (item: RoleServiceAccessType) => {
              (this.roleForm.controls['serviceAccess'] as FormArray).push(
                new FormGroup({
                  service: new FormControl(item.serviceId, [
                    Validators.required,
                  ]),
                  component: new FormControl(item.component),
                  access: new FormControl(
                    this.handleAccessValue(item.verbMask)
                  ),
                  requester: new FormControl(
                    this.handleRequesterValue(item.requestorMask)
                  ),
                  advancedFilters: new FormControl(item.filters),
                  id: new FormControl(item.id),
                })
              );
            }
          );
        }

        if (data.data.lookupByRoleId.length > 0) {
          data.data.lookupByRoleId.forEach((item: any) => {
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

  onSubmit() {
    if (this.roleForm.invalid) return;

    const formValue = this.roleForm.value;

    const payload: RolePayload = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      isActive: formValue.active,
      roleServiceAccessByRoleId: formValue.serviceAccess.map(
        (val: AccessForm) => ({
          id: val.id,
          serviceId: val.service,
          component: val.component,
          verbMask: val.access.reduce((acc, cur) => acc + cur, 0), // add up all the values in the array
          requestorMask: val.requester.reduce((acc, cur) => acc + cur, 0), // 1 = API, 2 = SCRIPT, 3 = API & SCRIPT
          filters: val.advancedFilters,
          filterOp: 'AND',
        })
      ),
      lookupByRoleId: formValue.lookupKeys,
    };

    const createPayload = {
      resource: [payload],
    };

    if (this.type === 'edit' && payload.id) {
      this.roleService
        .update(payload.id, payload)

        .subscribe(() => {
          this.goBack();
        });
    } else {
      this.roleService
        .create(createPayload)

        .subscribe(() => {
          this.goBack();
        });
    }
  }

  goBack() {
    this.router.navigate([
      `${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
    ]);
  }
}
