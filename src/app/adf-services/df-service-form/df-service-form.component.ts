// TODO: remove above line
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ServiceDataService } from 'src/app/core/services/service-data.service';

export type ServiceSchema = {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: string;
  config: object; // populated by secondFormGroup
  service_doc_by_service_id: object | null; // populated by thirdFormGroup
};

@Component({
  selector: 'df-service-form',
  templateUrl: './df-service-form.component.html',
  styleUrls: ['./df-service-form.component.scss'],
})
export class DfServiceFormComponent {
  isCreateServiceEnabled = true;
  selectedSchema: ServiceSchema;

  //Info
  firstFormGroup = this._formBuilder.group({
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _formBuilder: FormBuilder,
    private serviceDataService: ServiceDataService
  ) {}

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
    if (this.selectedSchema.name === 'mysql' && fieldName === 'schema') {
      return false;
    }

    return basicFieldsNames.has(fieldName);
  }

  isCaching(fieldName: string): boolean {
    return fieldName.includes('cache') || fieldName.includes('caching');
  }
}
