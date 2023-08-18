import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
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
    private router: Router
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
          selectedServiceName: null,
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
        if (field.type.trim() === 'array') {
          if (Array.isArray(field.items)) {
            field.items.forEach((fieldArrayItem: any) => {
              this.serviceConfigFormData.config[field.name] =
                fieldArrayItem.name;
            });
          } else
            this.serviceConfigFormData.config[field.name] =
              this.data.selectedServiceToEdit?.config[field.items];
        } else {
          this.serviceConfigFormData.config[field.name] =
            this.data.selectedServiceToEdit?.config[field.name];
        }
      });

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
        .pipe(takeUntil(this.destroyer$))
        .subscribe(_response => {
          this.onClose();
          this.router.navigate([ROUTES.MANAGE_SERVICES]);
        });
    }
  }

  private updateService(): void {
    console.log('service updated!');
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
