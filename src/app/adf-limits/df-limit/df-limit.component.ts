import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateLimitPayload,
  DfLimitsService,
  LimitType,
  UpdateLimitPayload,
} from '../services/df-limits.service';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { DfRoleService } from 'src/app/adf-roles/services/df-role.service';
import {
  DfUserDataService,
  SystemUserType,
} from 'src/app/core/services/df-user-data.service';
import { RoleType } from 'src/app/shared/types/role';
import {
  DfServiceDataService,
  SystemServiceData,
} from 'src/app/adf-services/services/service-data.service';
import { ROUTES } from 'src/app/core/constants/routes';

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

  formGroup = new FormGroup({
    limitName: new FormControl<string>('', Validators.required),
    description: new FormControl<string | null>(''),
    limitType: new FormControl<string>(
      this.limitTypes[0].name,
      Validators.required
    ),
    service: new FormControl<number | null>(null), // serviceId
    role: new FormControl<number | null>(null), // roleId
    user: new FormControl<number | null>(null), // userId
    endpoint: new FormControl<string | null>(null),
    limitRate: new FormControl<number | null>(null, Validators.required),
    limitPeriod: new FormControl<string>('', Validators.required),
    verb: new FormControl<string>(this.verbs[0], Validators.required),
    active: new FormControl<boolean>(true),
  });

  destroyed$ = new Subject<void>();
  isEditMode = false;

  limitTypeToEdit: LimitType | null = null;

  hiddenFields = {
    displayServiceField: false,
    displayRoleField: false,
    displayUserField: false,
    displayEndpointField: false,
  };

  roleDropdownOptions: RoleType[] = [];
  userDropdownOptions: SystemUserType[] = [];
  serviceDropdownOptions: SystemServiceData[] = [];

  constructor(
    private limitService: DfLimitsService,
    private roleService: DfRoleService,
    private userService: DfUserDataService,
    private serviceDataService: DfServiceDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;

      this.limitService
        .getLimit(id)
        .pipe(
          takeUntil(this.destroyed$),
          catchError(error => {
            console.error(error);
            this.router.navigate([ROUTES.LIMITS]);
            return throwError(() => new Error(error));
          })
        )
        .subscribe(data => {
          this.limitTypeToEdit = data;
          this.formGroup.setValue({
            limitName: data.name,
            limitType: data.type,
            service: data.serviceId,
            role: data.roleId,
            user: data.userId,
            limitRate: data.rate,
            limitPeriod: data.period,
            active: data.isActive,
            description: data.description,
            endpoint: data.endpoint,
            verb: data.verb ?? this.verbs[0],
          });
        });
    }

    this.serviceDataService
      .getSystemServiceDataList()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.serviceDropdownOptions = data.resource;
      });

    this.userService
      .getSystemUsers()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) this.userDropdownOptions = data.resource;
      });

    this.roleService
      .getRoles()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.roleDropdownOptions = data.resource;
      });

    this.formGroup
      .get('limitType')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.resetHiddenFields();
          switch (data) {
            case 'instance':
            case 'instance.each_user':
              this.hiddenFields = {
                displayServiceField: false,
                displayRoleField: false,
                displayUserField: false,
                displayEndpointField: false,
              };
              break;

            case 'instance.each_user.service':
              this.hiddenFields = {
                displayServiceField: true,
                displayRoleField: false,
                displayUserField: false,
                displayEndpointField: false,
              };
              break;

            case 'instance.user.service':
              this.hiddenFields = {
                displayServiceField: true,
                displayRoleField: false,
                displayUserField: true,
                displayEndpointField: false,
              };
              break;

            case 'instance.service':
              this.hiddenFields = {
                displayServiceField: true,
                displayRoleField: false,
                displayUserField: false,
                displayEndpointField: false,
              };
              break;

            case 'instance.role':
              this.hiddenFields = {
                displayServiceField: false,
                displayRoleField: true,
                displayUserField: false,
                displayEndpointField: false,
              };
              break;

            case 'instance.user':
              this.hiddenFields = {
                displayServiceField: false,
                displayRoleField: false,
                displayUserField: true,
                displayEndpointField: false,
              };
              break;

            case 'instance.user.service.endpoint':
              this.hiddenFields = {
                displayRoleField: false,
                displayServiceField: true,
                displayUserField: true,
                displayEndpointField: true,
              };
              break;

            case 'instance.service.endpoint':
            case 'instance.each_user.service.endpoint':
              this.hiddenFields = {
                displayServiceField: true,
                displayRoleField: false,
                displayUserField: false,
                displayEndpointField: true,
              };
              break;

            default:
              this.hiddenFields = {
                displayServiceField: false,
                displayRoleField: false,
                displayUserField: false,
                displayEndpointField: false,
              };
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onSubmit() {
    if (this.formGroup.valid) {
      if (!this.isEditMode) {
        const payload = this.assembleLimitPayload() as CreateLimitPayload;

        this.limitService
          .createLimit(payload)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(data => {
            // TODO: add success and error notifications
            console.log('CREATE limit response', data);
          });
      } else {
        // edit mode
        const payload = this.assembleLimitPayload() as UpdateLimitPayload;

        this.limitService
          .updateLimit(payload)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(data => {
            // TODO: add snackbar notification
            console.log('UPDATE limit response', data);
          });
      }
    } else {
      // TODO: add error alert notifying user of invalid input
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
      role_id: this.formGroup.value.role ?? null,
      service_id: this.formGroup.value.service ?? null,
      user_id: this.formGroup.value.user ?? null,
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

  private resetHiddenFields(): void {
    this.formGroup.patchValue({
      service: null,
      user: null,
      role: null,
      endpoint: null,
    });
  }
}
