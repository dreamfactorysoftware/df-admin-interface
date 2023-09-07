import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfLookupKeysComponent } from 'src/app/shared/components/df-lookup-keys/df-lookup-keys.component';
import { JsonValidator } from 'src/app/shared/validators/json.validator';

@Component({
  selector: 'df-field-details',
  templateUrl: './df-field-details.component.html',
  styleUrls: ['./df-field-details.component.scss'],
  standalone: true,
  imports: [
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
export class DfFieldDetailsComponent {
  fieldDetailsForm: FormGroup;

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

  constructor(private formBuilder: FormBuilder) {
    this.fieldDetailsForm = this.formBuilder.group({
      name: ['', Validators.required],
      alias: [''],
      label: [''],
      isVirtual: [false],
      isAggregate: [false],
      type: [''],
      databaseType: [''],
      length: [],
      precision: [],
      scale: [],
      fixedLength: [false],
      supportsMultibyte: [false],
      allowNull: [false],
      autoIncrement: [false],
      defaultValue: [],
      indexed: [false],
      unique: [false],
      primaryKey: [false],
      foreignKey: [false],
      referenceTable: [],
      referenceField: [],
      validation: ['', JsonValidator],
      dbFunctionUse: [],
      picklist: [],
    });
  }
}
