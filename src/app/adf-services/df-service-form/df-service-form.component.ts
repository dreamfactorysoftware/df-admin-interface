import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ServiceDataService,
  ServiceType,
} from '../services/service-data.service';

export type FormData = {
  serviceTypes: ServiceType[];
};

@Component({
  selector: 'df-service-form',
  templateUrl: './df-service-form.component.html',
  styleUrls: ['./df-service-form.component.scss'],
})
export class DfServiceFormComponent {
  isCreateServiceEnabled = true;
  selectedService: ServiceType | undefined; // aka selectedSchema
  selectServiceDropdownOptions: string[];
  selectServiceNameDropdownValue: string | null;
  selectServiceTypeDropdownValue: string | null;
  serviceTypeDropdownOptions: string[];
  private serviceTypeMap = new Map<string, string[]>();

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
    private serviceDataService: ServiceDataService
  ) {
    this.selectServiceNameDropdownValue = null;
    this.selectServiceDropdownOptions = data.serviceTypes
      .map(val => val.group)
      .filter((groupName, index, self) => {
        const name = groupName.trim().toLowerCase();
        if (name === 'api doc' || name === 'system' || name === 'user')
          return false;
        return index === self.indexOf(groupName);
      });

    data.serviceTypes.map(val => {
      if (!this.serviceTypeMap.has(val.group)) {
        this.serviceTypeMap.set(val.group, [val.label]);
      } else {
        const existingVal = this.serviceTypeMap.get(val.group) as string[];
        this.serviceTypeMap.set(val.group, [...existingVal, val.label]);
      }
    });
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
    });
    console.log('selectedService: ', this.selectedService);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    return this.isCreateServiceEnabled
      ? this.createService()
      : this.updateService();
  }

  private createService(): void {
    console.log('service created!');
  }

  private updateService(): void {
    console.log('service updated!');
  }

  isFieldsSeparated(schemaName: string): boolean {
    return (
      schemaName === 'mysql' ||
      schemaName === 'sqlsrv' ||
      schemaName === 'oracle' ||
      schemaName === 'pgsql'
    );
  }

  isBasic(fieldName: string): boolean {
    const basicFieldsNames = new Set([
      'host',
      'port',
      'database',
      'username',
      'password',
      'schema',
    ]);

    // mysql exception for schema field
    if (
      this.selectedService &&
      this.selectedService.name === 'mysql' &&
      fieldName === 'schema'
    ) {
      return false;
    }

    return basicFieldsNames.has(fieldName);
  }

  isCaching(fieldName: string): boolean {
    return fieldName.includes('cache') || fieldName.includes('caching');
  }
}
