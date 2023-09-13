import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfLookupKeysComponent } from 'src/app/shared/components/df-lookup-keys/df-lookup-keys.component';
import { JsonValidator } from 'src/app/shared/validators/json.validator';
import { Subject, takeUntil } from 'rxjs';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfFunctionUseComponent } from './df-function-use/df-function-use.component';
import { DatabaseSchemaFieldType } from './df-field-details.types';
import { CsvValidator } from '../validators/csv.validator';
import { ROUTES } from 'src/app/core/constants/routes';

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

  databaseFieldToEdit: DatabaseSchemaFieldType | null;

  @ViewChild(DfFunctionUseComponent)
  dbFunctions!: DfFunctionUseComponent;

  fieldName: string | null;
  dbName: string;
  tableName: string;

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
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.fieldDetailsForm = this.formBuilder.group({
      name: ['', Validators.required],
      alias: [''],
      label: [''],
      isVirtual: [false],
      isAggregate: [{ value: false, disabled: true }],
      type: ['', Validators.required],
      dbType: [{ value: '', disabled: true }],
      length: [],
      precision: [{ value: '', disabled: true }],
      scale: [{ value: 0, disabled: true }],
      fixedLength: [{ value: false, disabled: true }],
      supportsMultibyte: [{ value: false, disabled: true }],
      allowNull: [false],
      autoIncrement: [false],
      default: [],
      isIndex: [false],
      isUnique: [false],
      isPrimaryKey: [{ value: false, disabled: true }],
      isForeignKey: [false],
      refTable: [{ value: '', disabled: true }],
      refField: [{ value: '', disabled: true }],
      validation: ['', JsonValidator],
      dbFunction: this.formBuilder.array([]),
      picklist: ['', CsvValidator],
    });
  }

  ngOnInit(): void {
    this.fieldName = this.activatedRoute.snapshot.paramMap.get('fieldName');
    this.dbName = this.activatedRoute.snapshot.paramMap.get('name') as string;
    this.tableName = this.activatedRoute.snapshot.paramMap.get('id') as string;

    if (this.fieldName) {
      this.service
        .get(
          `${this.dbName}/_schema/${this.tableName}/_field/${this.fieldName}`
        )
        .pipe(takeUntil(this.destroyed$))
        .subscribe((data: any) => {
          this.databaseFieldToEdit = data;

          this.fieldDetailsForm.patchValue({
            name: data.name,
            alias: data.alias,
            label: data.label,
            isVirtual: data.isVirtual,
            isAggregate: data.isAggregate,
            type: data.type,
            dbType: data.dbType,
            length: data.length,
            precision: data.precision,
            scale: data.scale,
            fixedLength: data.fixedLength,
            supportsMultibyte: data.supportsMultibyte,
            allowNull: data.allowNull,
            autoIncrement: data.autoIncrement,
            default: data.default,
            isIndex: data.isIndex,
            isUnique: data.isUnique,
            isPrimaryKey: data.isPrimaryKey,
            isForeignKey: data.isForeignKey,
            refTable: data.refTable,
            refField: data.refField,
            validation: data.validation ?? '',
            picklist: data.picklist,
          });

          if (data.dbFunction.length > 0) {
            data.dbFunction.forEach((item: any) => {
              (this.fieldDetailsForm.controls['dbFunction'] as FormArray).push(
                new FormGroup({
                  use: new FormControl(item.use, Validators.required),
                  function: new FormControl(item.function),
                })
              );
            });

            this.dbFunctions.updateDataSource();
          }
        });
    }

    this.fieldDetailsForm
      .get('refTable')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.service
            .get(`${this.dbName}/_schema/${data}`)
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data: any) => {
              this.referenceFieldDropdownMenuOptions = data['field'];
              this.enableFormField('refField');
            });
        }
      });

    this.fieldDetailsForm
      .get('isForeignKey')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.service
            .get(`${this.dbName}/_schema`)
            .pipe(takeUntil(this.destroyed$))
            .subscribe((data: any) => {
              this.enableFormField('refTable');
              this.referenceTableDropdownMenuOptions = data['resource'];
            });
        } else {
          this.disableFormField('refTable');
          this.disableFormField('refField');
        }
      });

    this.fieldDetailsForm
      .get('isVirtual')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        if (data) {
          this.disableFormField('dbType');
          this.enableFormField('isAggregate');
        } else {
          if (
            this.fieldDetailsForm.get('type')?.value ===
            this.typeDropdownMenuOptions[0]
          )
            this.enableFormField('dbType');
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
              this.enableFormField('dbType');
              this.disableFormField('length');
              this.disableFormField('precision');
              this.disableFormField('scale');
            } else this.disableFormField('dbType');
            this.removeFormField('picklist');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          case 'string':
            this.addFormField('picklist');
            this.disableFormField('dbType');
            this.enableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
            this.enableFormField('fixedLength');
            this.enableFormField('supportsMultibyte');
            break;

          case 'integer':
            this.addFormField('picklist');
            this.disableFormField('dbType');
            this.enableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          case 'text':
          case 'binary':
            this.disableFormField('dbType');
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
            this.disableFormField('dbType');
            this.disableFormField('length');
            this.enableFormField('precision');
            this.enableFormField('scale', 0);
            this.removeFormField('picklist');
            this.disableFormField('fixedLength');
            this.disableFormField('supportsMultibyte');
            break;

          default:
            this.disableFormField('dbType');
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

  private addFormField(fieldName: string): void {
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
      if (this.databaseFieldToEdit) {
        this.service
          .update(
            `${this.dbName}/_schema/${this.tableName}/_field`,
            { resource: [this.fieldDetailsForm.value] },
            {
              snackbarSuccess: 'schema.fieldDetailsForm.updateSuccess',
              snackbarError: 'server',
            }
          )
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            this.router.navigate(['../../'], {
              relativeTo: this.activatedRoute,
            });
          });
      } else {
        this.service
          .create(
            { resource: [this.fieldDetailsForm.value] },
            {
              snackbarSuccess: 'schema.fieldDetailsForm.createSuccess',
              snackbarError: 'server',
            },
            `${this.dbName}/_schema/${this.tableName}/_field`
          )
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            this.router.navigate(['../../'], {
              relativeTo: this.activatedRoute,
            });
          });
      }
    }
  }

  onCancel() {
    this.router.navigate(['../../'], {
      relativeTo: this.activatedRoute,
    });
  }
}
