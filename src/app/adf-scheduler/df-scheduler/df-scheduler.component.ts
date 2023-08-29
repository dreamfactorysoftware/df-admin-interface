import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';
import { ROUTES } from 'src/app/core/constants/routes';
import { JsonValidator } from 'src/app/shared/validators/json.validator';
import { DfAccessListService } from '../services/access-list.service';
import { DF_SCHEDULER_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { SchedulerTaskData } from '../df-manage-scheduler/df-manage-scheduler-table.component';

// TODO: potentially move this
export type UpdateSchedulePayload = {
  component: string;
  createdById: number;
  createdDate: string;
  description: string;
  frequency: number;
  hasLog: boolean;
  id: number;
  isActive: boolean;
  lastModifiedById: number | null;
  lastModifiedDate: string;
  name: string;
  payload: string;
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  serviceId: number;
  serviceName: string;
  verb: string;
  verbMask: number;
};

export type CreateSchedulePayload = {
  component: string;
  description: string;
  frequency: number;
  id: null;
  isActive: boolean;
  name: string;
  payload: string;
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  serviceId: number;
  serviceName: string;
  verb: string;
  verbMask: number;
};

@Component({
  selector: 'df-scheduler',
  templateUrl: './df-scheduler.component.html',
  styleUrls: ['./df-scheduler.component.scss'],
})
export class DfSchedulerComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  formGroup: FormGroup;
  userServicesDropdownOptions: SystemServiceData[];
  selectedService: SystemServiceData | undefined;

  componentDropdownOptions: string[] = [];

  verbDropdownOptions = [
    {
      value: 'GET',
      name: 'GET (read)',
    },
    {
      value: 'POST',
      name: 'POST (create)',
    },
    {
      value: 'PUT',
      name: 'PUT (replace)',
    },
    {
      value: 'PATCH',
      name: 'PATCH (update)',
    },
    {
      value: 'DELETE',
      name: 'DELETE (remove)',
    },
  ];

  constructor(
    @Inject(DF_SCHEDULER_SERVICE_TOKEN)
    private service: DfBaseCrudService<
      SchedulerTaskData,
      CreateSchedulePayload
    >,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private accessListService: DfAccessListService
  ) {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      active: [true, Validators.required],
      serviceId: ['', Validators.required],
      component: ['', Validators.required],
      method: [this.verbDropdownOptions[0].value, Validators.required],
      frequency: [],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.userServicesDropdownOptions = data.data.resource;
      });

    this.formGroup
      .get('method')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data === 'GET') this.removePayloadField();
        else if (!this.formGroup.contains('payload')) this.addPayloadField();
      });

    this.formGroup
      .get('serviceId')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        const service = this.userServicesDropdownOptions.find(val => {
          return val.id === data;
        });
        this.selectedService = service;

        if (service) {
          this.accessListService
            .getServiceAccessList(service.name)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(data => {
              this.componentDropdownOptions = data.resource;
            });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onCancel() {
    this.router.navigate([ROUTES.SCHEDULER]);
  }

  onSubmit() {
    const createPayload = this.assembleCreatePayload();
    if (this.formGroup.valid && createPayload) {
      this.service
        .create({ resource: [createPayload] })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(data => {
          // TODO: remove the line below
          console.log('create schedule response: ', data);
        });
    } else {
      // TODO: add error message about invalid form
    }
  }

  addPayloadField(payloadInput?: string) {
    this.formGroup.addControl(
      'payload',
      this.formBuilder.control(payloadInput ?? '', [JsonValidator]) // TODO: fix json validator function, it is not working at all
    );
  }

  removePayloadField() {
    this.formGroup.removeControl('payload');
  }

  private getVerbMask(verb: string): number {
    switch (verb) {
      case 'GET':
        return 1;

      case 'POST':
        return 2;

      case 'PUT':
        return 4;

      case 'PATCH':
        return 8;

      case 'DELETE':
        return 16;
      default:
        return 1;
    }
  }

  private assembleCreatePayload(): CreateSchedulePayload | null {
    if (this.selectedService) {
      return {
        component: this.formGroup.value.component,
        description: this.formGroup.value.description,
        frequency: this.formGroup.value.frequency,
        id: null,
        isActive: this.formGroup.value.active,
        name: this.formGroup.value.name,
        payload: this.formGroup.value.payload ?? null,
        serviceId: this.formGroup.value.serviceId,
        serviceName: this.selectedService.name,
        verb: this.formGroup.value.method,
        service: {
          id: this.formGroup.value.serviceId,
          name: this.selectedService.name,
          label: this.selectedService.label,
          description: this.selectedService.description,
          type: this.selectedService.type,
          components: this.componentDropdownOptions,
        },
        verbMask: this.getVerbMask(this.formGroup.value.method),
      };
    }

    return null;
  }
}
