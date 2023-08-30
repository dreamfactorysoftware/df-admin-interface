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
import {
  CreateSchedulePayload,
  SchedulerTaskData,
  UpdateSchedulePayload,
} from '../types/df-scheduler.types';

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

  scheduleToEdit: SchedulerTaskData | undefined;

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

    const id = this.activatedRoute.snapshot.paramMap.get('id');

    if (id) {
      this.activatedRoute.data
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data: any) => {
          this.scheduleToEdit = data.schedulerObject;

          this.formGroup.setValue({
            name: this.scheduleToEdit?.name,
            description: this.scheduleToEdit?.description,
            active: this.scheduleToEdit?.isActive,
            serviceId: this.scheduleToEdit?.serviceId,
            component: this.scheduleToEdit?.component,
            method: this.scheduleToEdit?.verb,
            frequency: this.scheduleToEdit?.frequency,
          });

          this.getServiceAccessList(this.scheduleToEdit?.serviceId as number);

          if (this.scheduleToEdit?.verb !== 'GET') {
            this.addPayloadField(this.scheduleToEdit?.payload as string);
          }
        });
    }

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
        this.getServiceAccessList(data);
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
    if (this.formGroup.valid && typeof this.scheduleToEdit === 'undefined') {
      const payload = this.assemblePayload() as CreateSchedulePayload;

      this.service
        .create({ resource: [payload] })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(data => {
          this.router.navigate([ROUTES.SCHEDULER]);
        });
    } else if (this.formGroup.valid && this.scheduleToEdit) {
      const payload = this.assemblePayload() as UpdateSchedulePayload;

      this.service
        .update(this.scheduleToEdit.id, payload)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(data => {
          this.router.navigate([ROUTES.SCHEDULER]);
        });
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

  private getServiceAccessList(serviceId: number) {
    const service = this.userServicesDropdownOptions.find(val => {
      return val.id === serviceId;
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

  private assemblePayload():
    | UpdateSchedulePayload
    | CreateSchedulePayload
    | null {
    if (this.selectedService) {
      // eslint-disable-next-line prefer-const
      let payload = {
        component: this.formGroup.value.component,
        description: this.formGroup.value.description,
        frequency: this.formGroup.value.frequency,
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

      if (this.scheduleToEdit) {
        // edit mode
        return {
          lastModifiedDate: this.scheduleToEdit?.lastModifiedDate as string,
          lastModifiedById: this.scheduleToEdit?.lastModifiedById as number,
          hasLog: !!this.scheduleToEdit.taskLogByTaskId,
          createdDate: this.scheduleToEdit?.createdDate as string,
          createdById: this.scheduleToEdit?.createdById as number,
          id: this.scheduleToEdit.id,
          ...payload,
        } as UpdateSchedulePayload;
      }

      // create mode
      return { ...payload, id: null } as CreateSchedulePayload;
    }

    return null;
  }
}
