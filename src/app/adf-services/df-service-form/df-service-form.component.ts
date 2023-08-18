import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ServiceDataService,
  ServiceType,
  SystemServiceData,
} from '../services/service-data.service';
import { Subject, catchError, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { ROUTES } from 'src/app/core/constants/routes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { camelCase } from 'lodash';

export type FormData = {
  serviceTypes: ServiceType[];
  selectedServiceToEdit?: SystemServiceData;
};

@Component({
  selector: 'df-service-form',
  templateUrl: './df-service-form.component.html',
  styleUrls: ['./df-service-form.component.scss'],
})
export class DfServiceFormComponent implements OnDestroy, OnInit {
  isCreateServiceEnabled = true;
  selectedService: ServiceType; // aka selectedSchema
  selectServiceDropdownOptions: string[];
  selectServiceNameDropdownValue: string | null;
  selectServiceTypeDropdownValue: string | null;
  serviceTypeDropdownOptions: string[];
  private serviceTypeMap = new Map<string, string[]>();
  serviceConfigFormData: Partial<SystemServiceData> = {
    config: {},
  }; // dynamic formData object

  destroyer$ = new Subject<void>();

  httpVerbsDropdownOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  //Info
  firstFormGroup = this._formBuilder.group({
    selectedServiceName: new FormControl('', Validators.required),
    selectedServiceType: new FormControl('', Validators.required),
    namespace: new FormControl('', Validators.required),
    label: new FormControl('', Validators.required),
    description: new FormControl(''),
    isActive: new FormControl(true),
  });

  //Config
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });

  //Definition
  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });

  constructor(
    public dialogRef: MatDialogRef<DfServiceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormData,
    private _formBuilder: FormBuilder,
    private serviceDataService: ServiceDataService,
    private router: Router,
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {
    this.populateSelectServiceDropdownOptions();
    this.populateServiceTypeMap();
  }

  ngOnInit(): void {
    if (this.data.selectedServiceToEdit) {
      // setup edit mode

      this.setSelectedService(this.data.selectedServiceToEdit.type);

      this.firstFormGroup.value.selectedServiceType =
        this.selectedService.label;

      this.firstFormGroup.setValue(
        {
          selectedServiceName: this.selectedService.name,
          selectedServiceType: this.selectedService.label,
          namespace: this.data.selectedServiceToEdit.name,
          label: this.data.selectedServiceToEdit.label,
          description: this.data.selectedServiceToEdit.description,
          isActive: this.data.selectedServiceToEdit.isActive,
        },
        { emitEvent: true }
      );

      this.selectServiceTypeDropdownValue = this.selectedService.label;

      this.selectedService.configSchema.forEach(field => {
        console.log('field obj: ', field);

        console.log('config obj: ', this.data.selectedServiceToEdit?.config);

        if (field.type === 'array') {
          if (Array.isArray(field.items)) {
            field.items.forEach((fieldArrayItem: any) => {
              this.serviceConfigFormData.config[field.name] =
                fieldArrayItem.name;
            });
          } else
            this.serviceConfigFormData.config[field.name] =
              this.data.selectedServiceToEdit?.config[field.items] ??
              this.data.selectedServiceToEdit?.config[camelCase(field.items)];
        } else {
          const fieldName = camelCase(field.name);

          this.serviceConfigFormData.config[field.name] =
            this.data.selectedServiceToEdit?.config[field.name] ??
            this.data.selectedServiceToEdit?.config[fieldName];
        }
      });

      console.log('configSchema form version: ', this.serviceConfigFormData);

      this.isCreateServiceEnabled = false;
    } else {
      // setup create mode
      this.selectServiceNameDropdownValue = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();
  }

  onChangeSelectServiceName(event: string): void {
    this.selectServiceNameDropdownValue = event;
    this.firstFormGroup.value.selectedServiceName = event;

    this.serviceTypeDropdownOptions = this.serviceTypeMap.get(
      this.selectServiceNameDropdownValue
    ) as string[];
  }

  onChangeSelectServiceType(event: string): void {
    this.selectServiceTypeDropdownValue = event;
    this.selectedService = this.data.serviceTypes.find(val => {
      return val.label === this.selectServiceTypeDropdownValue;
    }) as ServiceType;
  }

  private setSelectedService(type: string) {
    this.selectedService = this.data.serviceTypes.find(val => {
      return val.name === type;
    }) as ServiceType;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    return this.isCreateServiceEnabled
      ? this.createService()
      : this.updateService();
  }

  openSuccessSnackBarNotification() {
    const translateString = this.isCreateServiceEnabled
      ? 'services.createSuccess'
      : 'services.updateSuccess';

    const message = this.translateService.instant(translateString);

    this.snackBar.open(message, 'dismiss', {
      duration: 3000,
    });
  }

  openErrorSnackBarNotification() {
    const translateString = this.isCreateServiceEnabled
      ? 'services.createError'
      : 'services.updateError';

    const message = this.translateService.instant(translateString);

    this.snackBar.open(message, 'dismiss', {
      duration: 3000,
    });
  }

  openInvalidSnackBarNotification() {
    console.error('invalid message: ', this.firstFormGroup.errors);
    console.error('form valid status', this.firstFormGroup.valid);

    const message = this.translateService.instant(
      'services.invalidFormMessage'
    );

    this.snackBar.open(message, 'dismiss', {
      duration: 3000,
    });
  }

  private createService() {
    if (this.firstFormGroup.valid) {
      const payload: Partial<SystemServiceData> = {
        name: this.firstFormGroup.value.namespace as string,
        label: this.firstFormGroup.value.label as string,
        description: this.firstFormGroup.value.description ?? '',
        isActive: this.firstFormGroup.value.isActive ?? false,
        type: this.selectedService.name,
        service_doc_by_service_id: null,
        config: this.serviceConfigFormData.config,
      };

      this.serviceDataService
        .createService(payload)
        .pipe(
          takeUntil(this.destroyer$),
          catchError(err => {
            this.openErrorSnackBarNotification();
            return err;
          })
        )
        .subscribe(_response => {
          this.openSuccessSnackBarNotification();
          this.onClose();
          this.router.navigate([ROUTES.MANAGE_SERVICES]);
        });
    } else {
      this.openInvalidSnackBarNotification();
    }
  }

  private updateService(): void {
    if (this.firstFormGroup.valid && this.data.selectedServiceToEdit) {
      const payload: SystemServiceData = {
        id: this.data.selectedServiceToEdit.id,
        created_by_id: this.data.selectedServiceToEdit.created_by_id,
        created_date: this.data.selectedServiceToEdit.created_date,
        mutable: this.data.selectedServiceToEdit.mutable,
        deletable: this.data.selectedServiceToEdit.deletable,
        last_modified_date: this.data.selectedServiceToEdit.last_modified_date,
        last_modified_by_id:
          this.data.selectedServiceToEdit.last_modified_by_id,
        name:
          this.firstFormGroup.value.namespace ??
          this.data.selectedServiceToEdit.name,
        label:
          this.firstFormGroup.value.label ??
          this.data.selectedServiceToEdit.label,
        description:
          this.firstFormGroup.value.description ??
          this.data.selectedServiceToEdit.description,
        isActive:
          this.firstFormGroup.value.isActive ??
          this.data.selectedServiceToEdit.isActive,
        type: this.selectedService.name,
        service_doc_by_service_id: null,
        config: this.serviceConfigFormData.config,
      };

      console.log('payload in update: ', payload);

      this.serviceDataService
        .updateServiceData(payload)
        .pipe(
          takeUntil(this.destroyer$),
          catchError(err => {
            this.openErrorSnackBarNotification();
            return err;
          })
        )
        .subscribe(_response => {
          console.log('response: ', _response);
          this.openSuccessSnackBarNotification();
          this.onClose();
          window.location.reload();
        });
    } else {
      this.openInvalidSnackBarNotification();
    }
  }

  private populateServiceTypeMap(): void {
    this.data.serviceTypes.forEach(val => {
      if (!this.serviceTypeMap.has(val.group)) {
        this.serviceTypeMap.set(val.group, [val.label]);
      } else {
        const existingVal = this.serviceTypeMap.get(val.group) as string[];
        this.serviceTypeMap.set(val.group, [...existingVal, val.label]);
      }
    });
  }

  private populateSelectServiceDropdownOptions(): void {
    this.selectServiceDropdownOptions = this.data.serviceTypes
      .map(val => val.group)
      .filter((groupName, index, self) => {
        const name = groupName.trim().toLowerCase();
        if (name === 'api doc' || name === 'system' || name === 'user')
          return false;
        return index === self.indexOf(groupName);
      });
  }
}
