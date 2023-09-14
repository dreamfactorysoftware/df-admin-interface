import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ROUTES } from 'src/app/core/constants/routes';
import { JsonValidator } from 'src/app/shared/validators/json.validator';
import {
  BASE_SERVICE_TOKEN,
  SCHEDULER_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import {
  CreateSchedulePayload,
  SchedulerTaskData,
  UpdateSchedulePayload,
} from '../types/df-scheduler.types';
import { TranslocoPipe } from '@ngneat/transloco';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Service } from 'src/app/shared/types/service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';

@Component({
  selector: 'df-scheduler',
  templateUrl: './df-scheduler.component.html',
  styleUrls: ['./df-scheduler.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatInputModule,
    MatTabsModule,
    MatSelectModule,
    MatSlideToggleModule,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    TranslocoPipe,
    ReactiveFormsModule,
    DfAceEditorComponent,
  ],
})
export class DfSchedulerComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  formGroup: FormGroup; // basic form
  userServicesDropdownOptions: Service[];
  selectedService: Service | undefined;

  relatedParam = 'task_log_by_task_id';

  componentDropdownOptions: string[] = [];

  scheduleToEdit: SchedulerTaskData | undefined;
  log = '';

  verbDropdownOptions = [
    {
      value: 'GET',
      name: 'verbs.get',
    },
    {
      value: 'POST',
      name: 'verbs.post',
    },
    {
      value: 'PUT',
      name: 'verbs.put',
    },
    {
      value: 'PATCH',
      name: 'verbs.patch',
    },
    {
      value: 'DELETE',
      name: 'verbs.delete',
    },
  ];

  constructor(
    @Inject(SCHEDULER_SERVICE_TOKEN)
    private service: DfBaseCrudService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(BASE_SERVICE_TOKEN)
    private accessListService: DfBaseCrudService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      active: [true, Validators.required],
      serviceId: ['', Validators.required],
      component: ['', Validators.required],
      method: [this.verbDropdownOptions[0].value, Validators.required],
      frequency: [],
    });
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

          this.log = this.scheduleToEdit?.taskLogByTaskId?.content ?? '';

          this.getServiceAccessList(this.scheduleToEdit?.serviceId as number);

          this.formGroup.setValue({
            name: this.scheduleToEdit?.name,
            description: this.scheduleToEdit?.description,
            active: this.scheduleToEdit?.isActive,
            serviceId: this.scheduleToEdit?.serviceId,
            component: this.scheduleToEdit?.component,
            method: this.scheduleToEdit?.verb,
            frequency: this.scheduleToEdit?.frequency,
          });

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
    this.router.navigate([`${ROUTES.SYSTEM_SETTINGS}/${ROUTES.SCHEDULER}`]);
  }

  onSubmit() {
    if (this.formGroup.valid && typeof this.scheduleToEdit === 'undefined') {
      const payload = this.assemblePayload() as CreateSchedulePayload;

      this.service
        .create(
          { resource: [payload] },
          {
            snackbarSuccess: 'scheduler.alerts.createdSuccess',
            snackbarError: 'server',
            fields: '*',
            related: this.relatedParam,
          }
        )
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() =>
          // TODO: this call is made successfully but throws an injection context error
          this.router.navigate([
            `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.SCHEDULER}`,
          ])
        );
    } else if (this.formGroup.valid && this.scheduleToEdit) {
      const payload = this.assemblePayload() as UpdateSchedulePayload;

      this.service
        .update(this.scheduleToEdit.id, payload, {
          snackbarSuccess: 'scheduler.alerts.updateSuccess',
          snackbarError: 'server',
          fields: '*',
          related: this.relatedParam,
        })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() =>
          // TODO: this call is made successfully but throws an injection context error
          this.router.navigate([
            `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.SCHEDULER}`,
          ])
        );
    }
  }

  addPayloadField(payloadInput?: string) {
    this.formGroup.addControl(
      'payload',
      this.formBuilder.control(payloadInput ?? '', [JsonValidator])
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
        .get<GenericListResponse<string>>(service.name, {
          additionalParams: [
            {
              key: 'as_access_list',
              value: true,
            },
          ],
        })
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
