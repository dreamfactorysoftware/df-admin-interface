import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DfLimitsService } from '../services/df-limits.service';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { RoleType } from 'src/app/shared/types/role';
import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';
import { ROUTES } from 'src/app/core/constants/routes';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { TranslateService } from '@ngx-translate/core';
import {
  LimitType,
  CreateLimitPayload,
  UpdateLimitPayload,
} from 'src/app/shared/types/limit';
import { UserProfile } from 'src/app/shared/types/user';

@Component({
  selector: 'df-limit',
  templateUrl: './df-limit.component.html',
  styleUrls: ['./df-limit.component.scss'],
})
export class DfLimitComponent implements OnInit, OnDestroy {
  limitTypes = [
    { value: 'instance', name: 'Instance' },
    { value: 'instance.user', name: 'User' },
    { value: 'instance.each_user', name: 'Each User' },
    { value: 'instance.service', name: 'Service' },
    { value: 'instance.role', name: 'Role' },
    { value: 'instance.user.service', name: 'Service by User' },
    { value: 'instance.each_user.service', name: 'Service by Each User' },
    { value: 'instance.service.endpoint', name: 'Endpoint' },
    { value: 'instance.user.service.endpoint', name: 'Endpoint by User' },
    {
      value: 'instance.each_user.service.endpoint',
      name: 'Endpoint by Each User',
    },
  ];

  limitPeriods = [
    { value: 'minute', name: 'Minute' },
    { value: 'hour', name: 'Hour' },
    { value: 'day', name: 'Day' },
    { value: '7-day', name: 'Week' },
    { value: '30-day', name: '30 Days' },
  ];

  verbs = ['ANY', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE'];

  formGroup: FormGroup;

  destroyed$ = new Subject<void>();
  isEditMode = false;

  limitTypeToEdit: LimitType | null = null;

  roleDropdownOptions: RoleType[] = [];
  userDropdownOptions: UserProfile[] = [];
  serviceDropdownOptions: SystemServiceData[] = [];

  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';

  constructor(
    private limitService: DfLimitsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      limitName: ['', Validators.required],
      description: [''],
      limitType: [this.limitTypes[0].value, Validators.required],
      serviceId: [],
      roleId: [],
      userId: [],
      endpoint: [],
      limitRate: [null, Validators.required],
      limitPeriod: [this.limitPeriods[0].value, Validators.required],
      verb: [this.verbs[0], Validators.required],
      active: [true],
    });
  }

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;

      this.activatedRoute.data
        .pipe(
          takeUntil(this.destroyed$),
          catchError(error => {
            this.router.navigate([ROUTES.LIMITS]);
            return throwError(() => new Error(error));
          })
        )
        .subscribe(resp => {
          this.limitTypeToEdit = resp['data'] as LimitType;

          this.formGroup.setValue({
            limitName: this.limitTypeToEdit.name,
            limitType: this.limitTypeToEdit.type,
            serviceId: this.limitTypeToEdit.serviceId,
            roleId: this.limitTypeToEdit.roleId,
            userId: this.limitTypeToEdit.userId,
            limitRate: this.limitTypeToEdit.rate,
            limitPeriod: this.limitTypeToEdit.period,
            active: this.limitTypeToEdit.isActive,
            description: this.limitTypeToEdit.description,
            endpoint: this.limitTypeToEdit.endpoint,
            verb: this.limitTypeToEdit.verb ?? this.verbs[0],
          });

          if (!this.formGroup.value.serviceId)
            this.removeFormField('serviceId');

          if (!this.formGroup.value.roleId) this.removeFormField('roleId');

          if (!this.formGroup.value.userId) this.removeFormField('userId');

          if (!this.formGroup.value.endpoint) this.removeFormField('endpoint');
        });
    } else {
      this.removeFormField();
      this.renderCorrectHiddenFields(this.limitTypes[0].value);
    }

    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.serviceDropdownOptions = data['services'].resource;
      });

    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.userDropdownOptions = data['users'].resource;
      });

    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.roleDropdownOptions = data['roles'].resource;
      });

    this.formGroup
      .get('limitType')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.removeFormField();
          this.renderCorrectHiddenFields(data);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.showAlert = false;
      if (!this.isEditMode) {
        const payload = this.assembleLimitPayload() as CreateLimitPayload;

        this.limitService
          .createLimit(payload)
          .pipe(
            takeUntil(this.destroyed$),
            catchError(err => {
              this.alertMsg = err.error.error.message;
              this.showAlert = true;
              return throwError(() => new Error(err));
            })
          )
          .subscribe(() => {
            this.router.navigate([ROUTES.LIMITS]);
          });
      } else {
        // edit mode
        const payload = this.assembleLimitPayload() as UpdateLimitPayload;

        this.limitService
          .updateLimit(payload)
          .pipe(
            takeUntil(this.destroyed$),
            catchError(err => {
              this.alertMsg = err.error.error.message;
              this.showAlert = true;
              return throwError(() => new Error(err));
            })
          )
          .subscribe(() => {
            this.router.navigate([ROUTES.LIMITS]);
          });
      }
    } else {
      this.alertMsg = this.translateService.instant('limits.invalidForm');
      this.showAlert = true;
    }
  }

  onCancel(): void {
    this.router.navigate([ROUTES.LIMITS]);
  }

  private assembleLimitPayload(): CreateLimitPayload | UpdateLimitPayload {
    let verb: string | null = this.formGroup.value.verb ?? null;

    if (verb && verb.toLowerCase() === 'any') {
      // Verb is null when the user selects any http verb
      verb = null;
    }

    const data = {
      description: this.formGroup.value.description ?? null,
      endpoint: this.formGroup.value.endpoint ?? null,
      is_active: this.formGroup.value.active as boolean,
      name: this.formGroup.value.limitName as string,
      period: this.formGroup.value.limitPeriod as string,
      role_id: this.formGroup.value.roleId ?? null,
      service_id: this.formGroup.value.serviceId ?? null,
      user_id: this.formGroup.value.userId ?? null,
      type: this.formGroup.value.limitType as string,
      verb: verb,
    };

    if (this.isEditMode) {
      return {
        id: this.limitTypeToEdit?.id,
        created_date: this.limitTypeToEdit?.created_date,
        last_modified_date: this.limitTypeToEdit?.lastModifiedDate,
        rate: this.formGroup.value.limitRate ?? null,
        ...data,
      } as UpdateLimitPayload;
    } else {
      return {
        cacheData: {},
        rate: this.formGroup.value.limitRate
          ? this.formGroup.value.limitRate.toString()
          : '1',
        ...data,
      } as CreateLimitPayload;
    }
  }

  private renderCorrectHiddenFields(data: string): void {
    switch (data) {
      case 'instance':
      case 'instance.each_user':
        break;

      case 'instance.user.service':
        this.formGroup.addControl(
          'serviceId',
          this.formBuilder.control('', [Validators.required])
        );
        this.formGroup.addControl(
          'userId',
          this.formBuilder.control('', [Validators.required])
        );
        break;

      case 'instance.each_user.service':
      case 'instance.service':
        this.formGroup.addControl(
          'serviceId',
          this.formBuilder.control('', [Validators.required])
        );
        break;

      case 'instance.role':
        this.formGroup.addControl(
          'roleId',
          this.formBuilder.control('', [Validators.required])
        );
        break;

      case 'instance.user':
        this.formGroup.addControl(
          'userId',
          this.formBuilder.control('', [Validators.required])
        );
        break;

      case 'instance.user.service.endpoint':
        this.formGroup.addControl(
          'userId',
          this.formBuilder.control('', [Validators.required])
        );
        this.formGroup.addControl(
          'serviceId',
          this.formBuilder.control('', [Validators.required])
        );
        this.formGroup.addControl(
          'endpoint',
          this.formBuilder.control('', [Validators.required])
        );
        break;

      case 'instance.service.endpoint':
      case 'instance.each_user.service.endpoint':
        this.formGroup.addControl(
          'serviceId',
          this.formBuilder.control('', [Validators.required])
        );
        this.formGroup.addControl(
          'endpoint',
          this.formBuilder.control('', [Validators.required])
        );
        break;

      default:
        this.removeFormField();
    }
  }

  private removeFormField(fieldName?: string): void {
    if (!fieldName) {
      this.formGroup.removeControl('serviceId');
      this.formGroup.removeControl('roleId');
      this.formGroup.removeControl('userId');
      this.formGroup.removeControl('endpoint');
    } else this.formGroup.removeControl(fieldName);
  }
}
