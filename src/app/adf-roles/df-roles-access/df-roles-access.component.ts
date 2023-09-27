import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { ServiceResponseObj } from '../df-roles.types';
import { TranslocoPipe } from '@ngneat/transloco';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-roles-access',
  templateUrl: './df-roles-access.component.html',
  styleUrls: ['./df-roles-access.component.scss'],
  standalone: true,
  imports: [
    TranslocoPipe,
    MatTableModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatExpansionModule,
    FontAwesomeModule,
    MatButtonModule,
    NgFor,
    NgIf,
  ],
})
export class DfRolesAccessComponent implements OnInit {
  rootForm: FormGroup;
  serviceAccess: FormArray;
  dataSource: MatTableDataSource<any>;
  displayedColumns = [
    'service',
    'component',
    'access',
    'requester',
    'advancedFilters',
    'actions',
  ];
  faTrashCan = faTrashCan;
  faPlus = faPlus;
  serviceOptions = [{ id: 0, name: '' }];

  componentOptions: ComponentOption[] = [{ serviceId: 0, components: ['*'] }];

  accessOptions = [
    { value: 1, label: 'GET (read)' },
    { value: 2, label: 'POST (create)' },
    { value: 4, label: 'PUT (replace)' },
    { value: 8, label: 'PATCH (update)' },
    { value: 16, label: 'DELETE (remove)' },
  ];

  requesterOptions = [
    { value: 1, label: 'API' },
    { value: 2, label: 'SCRIPT' },
  ];

  constructor(
    private rootFormGroup: FormGroupDirective,
    private activatedRoute: ActivatedRoute,
    @Inject(BASE_SERVICE_TOKEN)
    private baseService: DfBaseCrudService
  ) {}

  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.rootForm.markAllAsTouched();
    });
    this.serviceAccess = this.rootForm.get('serviceAccess') as FormArray;

    // get services options
    this.activatedRoute.data.subscribe((data: any) => {
      // sort service options by name
      this.serviceOptions =
        data?.services?.resource.sort(
          (a: ServiceResponseObj, b: ServiceResponseObj) => {
            if (a.name < b.name) {
              return -1;
            } else if (a.name > b.name) {
              return 1;
            } else {
              return 0;
            }
          }
        ) || [];

      // if service ID exists, GET service components
      if (
        data.type === 'edit' &&
        data.data.roleServiceAccessByRoleId.length > 0
      ) {
        data.data.roleServiceAccessByRoleId.forEach((item: any) => {
          const serviceId = item.serviceId;
          const serviceName =
            this.serviceOptions.find(service => service.id === serviceId)
              ?.name || '';

          // GET Components for service
          this.baseService
            .get(serviceName, {
              additionalParams: [{ key: 'as_access_list', value: true }],
            })

            .subscribe((response: any) => {
              const components = response.resource;
              this.componentOptions.push({ serviceId, components });
            });
        });
      }
    });

    this.updateDataSource();
  }

  async getComponents(index: number) {
    const serviceId = this.serviceAccess.at(index).get('service')?.value;
    const service =
      this.serviceOptions.find(service => service.id === serviceId)?.name || '';

    // "GET requests without a resource are not currently supported by the 'email' service."
    if (service === 'email') {
      this.componentOptions.push({ serviceId, components: ['*'] });
    }

    if (
      !this.componentOptions.some(
        (option: ComponentOption) => option.serviceId === serviceId
      )
    ) {
      this.baseService
        .get(service, {
          additionalParams: [{ key: 'as_access_list', value: true }],
        })

        .subscribe((data: any) => {
          this.componentOptions.push({
            serviceId,
            components: data.resource,
          });
        });
    }
  }

  getComponentArray(index: number) {
    const serviceId = this.serviceAccess.at(index).get('service')?.value;
    const components = this.componentOptions.find(
      option => option.serviceId === serviceId
    )?.components;
    return components || [];
  }

  // TODO finish implementing "all" option
  accessChange(index: number, value: number[]) {
    const access = this.serviceAccess.at(index).get('access');

    // if value.length === 1 and value[0] === 0 then add all
    // if value.length < 6 and value.includes(0) then remove 0
    // if value.length === 5 then add 0

    // if (value.length === 1 && value[0] === 0) {
    //   console.log('add All');
    //   access?.patchValue([0, 1, 2, 4, 8, 16]);
    // } else if (value.length === 5 && value.includes(0)) {
    //   console.log('remove All');
    //   access?.patchValue(value.filter((value: number) => value !== 0));
    // } else if (value.length === 5 && !value.includes(0)) {
    //   console.log('add All');
    //   access?.patchValue([0, ...value]);
    // }
  }

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.serviceAccess.controls);
  }

  get hasServiceAccess() {
    return this.rootForm.controls['serviceAccess'].value.length > 0;
  }

  add() {
    this.serviceAccess.push(
      new FormGroup({
        service: new FormControl(0, Validators.required),
        component: new FormControl('', Validators.required),
        access: new FormControl('', Validators.required),
        requester: new FormControl([1], Validators.required),
        advancedFilters: new FormControl([], Validators.required),
        id: new FormControl([null]),
      })
    );
    this.updateDataSource();
  }

  remove(index: number) {
    this.serviceAccess.removeAt(index);
    this.updateDataSource();
  }
}

interface ComponentOption {
  serviceId: number;
  components: string[];
}
