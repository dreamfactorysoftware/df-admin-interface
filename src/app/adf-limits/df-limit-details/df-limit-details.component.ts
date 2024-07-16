import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { RoleType } from 'src/app/shared/types/role';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';

import {
  LimitType,
  CreateLimitPayload,
  UpdateLimitPayload,
} from 'src/app/shared/types/limit';
import { UserProfile } from 'src/app/shared/types/user';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatOptionModule } from '@angular/material/core';
import { NgFor, NgIf } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DfAlertComponent } from '../../shared/components/df-alert/df-alert.component';
import { LIMIT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DfVerbPickerComponent } from 'src/app/shared/components/df-verb-picker/df-verb-picker.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  GenericCreateResponse,
  GenericUpdateResponse,
} from 'src/app/shared/types/generic-http';
import { Service } from 'src/app/shared/types/service';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { AsyncPipe } from '@angular/common';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-limit',
  templateUrl: './df-limit-details.component.html',
  styleUrls: ['./df-limit-details.component.scss'],
  standalone: true,
  imports: [
    DfAlertComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgFor,
    MatOptionModule,
    NgIf,
    MatSlideToggleModule,
    MatButtonModule,
    TranslocoPipe,
    DfVerbPickerComponent,
    AsyncPipe,
  ],
})
export class DfLimitDetailsComponent implements OnInit {
  formGroup: FormGroup;

  isEditMode = false;

  limitTypeToEdit: LimitType | null = null;

  roleDropdownOptions: RoleType[] = [];
  userDropdownOptions: UserProfile[] = [];
  serviceDropdownOptions: Service[] = [];

  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';

  type = 'create';

  constructor(
    @Inject(LIMIT_SERVICE_TOKEN)
    private limitService: DfBaseCrudService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslocoService,
    private formBuilder: FormBuilder,
    private themeService: DfThemeService,
    private snackbarService: DfSnackbarService
  ) {
    this.formGroup = this.formBuilder.group({
      limitName: ['', Validators.required],
      description: [''],
      limitType: ['instance', Validators.required],
      serviceId: [],
      roleId: [],
      userId: [],
      endpoint: [],
      limitRate: [null, Validators.required],
      limitPeriod: ['minute', Validators.required],
      verb: [],
      active: [true],
    });
  }
  isDarkMode = this.themeService.darkMode$;

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(resp => {
      this.type = resp['type'];
      if (resp['type'] === 'edit') {
        this.limitTypeToEdit = resp['data'] as LimitType;
        this.snackbarService.setSnackbarLastEle(
          this.limitTypeToEdit.name,
          true
        );
        this.formGroup.patchValue({
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
          verb: this.limitTypeToEdit.verb,
        });

        if (!this.formGroup.value.serviceId) this.removeFormField('serviceId');

        if (!this.formGroup.value.roleId) this.removeFormField('roleId');

        if (!this.formGroup.value.userId) this.removeFormField('userId');

        if (!this.formGroup.value.endpoint) this.removeFormField('endpoint');
      }
    });

    if (this.type === 'create') {
      this.removeFormField();
      this.renderCorrectHiddenFields('instance');
    }

    this.activatedRoute.data.subscribe(data => {
      this.serviceDropdownOptions = data['services'].resource;
    });

    this.activatedRoute.data.subscribe(data => {
      this.userDropdownOptions = data['users'].resource;
    });

    this.activatedRoute.data.subscribe(data => {
      this.roleDropdownOptions = data['roles'].resource;
    });

    this.formGroup.get('limitType')?.valueChanges.subscribe(data => {
      if (data) {
        this.removeFormField();
        this.renderCorrectHiddenFields(data);
      }
    });
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.showAlert = false;
      if (this.type === 'create') {
        const payload = this.assembleLimitPayload() as CreateLimitPayload;

        this.limitService
          .create<GenericCreateResponse>({ resource: [payload] })
          .pipe(
            catchError(err => {
              this.alertMsg = err.error.error.message;
              this.showAlert = true;
              return throwError(() => new Error(err));
            })
          )
          .subscribe(res => {
            this.router.navigate(['../', res.resource[0].id], {
              relativeTo: this.activatedRoute,
            });
          });
      } else if (this.type === 'edit') {
        // edit mode
        const payload = this.assembleLimitPayload() as UpdateLimitPayload;

        this.limitService
          .update<GenericUpdateResponse, UpdateLimitPayload>(
            payload.id,
            payload
          )
          .pipe(
            catchError(err => {
              this.alertMsg = err.error.error.message;
              this.showAlert = true;
              return throwError(() => new Error(err));
            })
          )
          .subscribe(res => {
            this.router.navigate(['../', res.id], {
              relativeTo: this.activatedRoute,
            });
          });
      }
    } else {
      this.alertMsg = this.translateService.translate('limits.invalidForm');
      this.showAlert = true;
    }
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  private assembleLimitPayload(): CreateLimitPayload | UpdateLimitPayload {
    const data = {
      description: this.formGroup.value.description ?? null,
      endpoint: this.formGroup.value.endpoint ?? null,
      isActive: this.formGroup.value.active as boolean,
      name: this.formGroup.value.limitName as string,
      period: this.formGroup.value.limitPeriod as string,
      roleId: this.formGroup.value.roleId ?? null,
      serviceId: this.formGroup.value.serviceId ?? null,
      userId: this.formGroup.value.userId ?? null,
      type: this.formGroup.value.limitType as string,
      verb: this.formGroup.value.verb,
    };

    if (this.type === 'edit') {
      return {
        id: this.limitTypeToEdit?.id,
        createdDate: this.limitTypeToEdit?.createdDate,
        lastModifiedDate: this.limitTypeToEdit?.lastModifiedDate,
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
