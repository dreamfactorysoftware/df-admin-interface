import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfLookupKeysComponent } from 'src/app/shared/components/df-lookup-keys/df-lookup-keys.component';
import { JsonValidator } from 'src/app/shared/validators/json.validator';
import { Subject, takeUntil } from 'rxjs';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfFunctionUseComponent } from './df-function-use/df-function-use.component';
import { DatabaseSchemaFieldType } from './df-field-details.types';

@Component({
  selector: 'df-field-details',
  templateUrl: './df-field-details.component.html',
  styleUrls: ['./df-field-details.component.scss'],
  standalone: true,
  imports: [
    DfFunctionUseComponent,
    ReactiveFormsModule,
    MatSlideToggleModule,
    NgIf,
    MatRadioModule,
    MatButtonModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgFor,
    DfLookupKeysComponent,
    RouterLink,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfFieldDetailsComponent implements OnInit, OnDestroy {
  fieldDetailsForm: FormGroup;
  destroyed$ = new Subject<void>();

  typeDropdownMenuOptions = [
    'I will manually enter a type',
    'id',
    'string',
    'integer',
    'text',
    'boolean',
    'binary',
    'float',
    'double',
    'decimal',
    'datetime',
    'date',
    'time',
    'reference',
    'user_id',
    'user_id_on_create',
    'user_id_on_update',
    'timestamp',
    'timestamp_on_create',
    'timestamp_on_update',
  ];

  referenceTableDropdownMenuOptions: { name: string }[] = [];
  referenceFieldDropdownMenuOptions: DatabaseSchemaFieldType[] = [];

  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private service: DfBaseCrudService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
    this.fieldDetailsForm = this.formBuilder.group({
      name: ['', Validators.required],
      alias: [''],
      label: [''],
      isVirtual: [false],
      isAggregate: [{ value: false, disabled: true }],
      type: ['', Validators.required],
      databaseType: [{ value: '', disabled: true }],
      length: [],
      precision: [{ value: '', disabled: true }],
      scale: [{ value: 0, disabled: true }],
      fixedLength: [{ value: false, disabled: true }],
      supportsMultibyte: [{ value: false, disabled: true }],
      allowNull: [false],
      autoIncrement: [false],
      defaultValue: [],
      indexed: [false],
      unique: [false],
      primaryKey: [{ value: false, disabled: true }],
      foreignKey: [false],
      referenceTable: [{ value: '', disabled: true }],
      referenceField: [{ value: '', disabled: true }],
      validation: ['', JsonValidator],
      dbFunctionUse: this.formBuilder.array([]),
      picklist: [''], // TODO: maybe add validation for comma separated values here
    });
  }

  ngOnInit(): void {
    this.fieldDetailsForm
      .get('referenceTable')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.service
            .get(`mysql-test/_schema/${data}`) // TODO: modify to insert database name here before /_schema
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data: any) => {
              this.referenceFieldDropdownMenuOptions = data['field'];
              this.enableFormField('referenceField');
            });
        }
      });

    this.fieldDetailsForm
      .get('foreignKey')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.service
            .get('mysql-test/_schema') // TODO: modify to insert database name here before /_schema
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data: any) => {
              this.enableFormField('referenceTable');
              this.referenceTableDropdownMenuOptions = data['resource'];
            });
        } else {
          this.disableFormField('referenceTable');
          this.disableFormField('referenceField');
        }
      });

    this.fieldDetailsForm
      .get('isVirtual')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.disableFormField('databaseType');
          this.enableFormField('isAggregate');
        } else {
          if (
            this.fieldDetailsForm.get('type')?.value ===
            this.typeDropdownMenuOptions[0]
          )
            this.enableFormField('databaseType');
          this.disableFormField('isAggregate');
        }
      });

    this.fieldDetailsForm
      .get('type')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        switch (data) {
          case this.typeDropdownMenuOptions[0]:
            if (this.fieldDetailsForm.get('isVirtual')?.value === false) {
              this.enableFormField('databaseType');
              this.disableFormField('length');
              this.disableFormField('precision');
              this.disableFormField('scale');
            } else this.disableFormField('databaseType');
            this.removeFormField('picklist');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          case 'string':
            this.addFormField('picklist');
            this.disableFormField('databaseType');
            this.enableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
            this.enableFormField('fixedLength');
            this.enableFormField('supportsMultibyte');
            break;

          case 'integer':
            this.addFormField('picklist');
            this.disableFormField('databaseType');
            this.enableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          case 'text':
          case 'binary':
            this.disableFormField('databaseType');
            this.enableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
            this.removeFormField('picklist');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          case 'float':
          case 'double':
          case 'decimal':
            this.disableFormField('databaseType');
            this.disableFormField('length');
            this.enableFormField('precision');
            this.enableFormField('scale', 0);
            this.removeFormField('picklist');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          default:
            this.disableFormField('databaseType');
            this.disableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
            this.removeFormField('picklist');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private addFormField(fieldName: string, required = false): void {
    this.fieldDetailsForm.addControl(fieldName, this.formBuilder.control(''));
  }

  private removeFormField(fieldName: string): void {
    this.fieldDetailsForm.removeControl(fieldName);
  }

  private disableFormField(fieldName: string): void {
    this.fieldDetailsForm.controls[fieldName].setValue(null);
    this.fieldDetailsForm.controls[fieldName].disable();
  }

  private enableFormField(fieldName: string, value?: any): void {
    if (this.fieldDetailsForm.controls[fieldName].disabled)
      this.fieldDetailsForm.controls[fieldName].enable();

    if (value) this.fieldDetailsForm.controls[fieldName].setValue(value);
  }

  onSubmit() {
    if (this.fieldDetailsForm.valid) {
      this.service
        .create(
          { resource: [this.fieldDetailsForm.value] },
          {
            snackbarSuccess: 'Database Field successfully created', // TODO: update with translation
            snackbarError: 'server',
          },
          'mysql-test/_schema/test-table/_field' // TODO: modify this url to take database name and table name
        )
        .pipe(takeUntil(this.destroyed$))
        .subscribe();
    }
  }

  onCancel() {
    console.log('cancel button clicked');
  }
}
