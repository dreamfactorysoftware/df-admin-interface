import { NgFor, NgIf } from '@angular/common';
import { Component, Input, OnInit, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { ConfigSchema } from '../../types/service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleInfo,
  faPlus,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { DfDynamicFieldComponent } from '../df-dynamic-field/df-dynamic-field.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfVerbPickerComponent } from '../df-verb-picker/df-verb-picker.component';
import { MatSelectModule } from '@angular/material/select';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-array-field',
  templateUrl: './df-array-field.component.html',
  styleUrls: ['./df-array-field.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DfArrayFieldComponent),
      multi: true,
    },
  ],
  imports: [
    ReactiveFormsModule,
    NgFor,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    DfDynamicFieldComponent,
    NgIf,
    MatTableModule,
    MatCardModule,
    MatTooltipModule,
    TranslocoPipe,
    DfVerbPickerComponent,
    MatSelectModule,
  ],
})
export class DfArrayFieldComponent implements OnInit, ControlValueAccessor {
  @Input() schema: ConfigSchema;
  fieldArray: FormArray;
  faPlus = faPlus;
  faTrashCan = faTrashCan;
  faCircleInfo = faCircleInfo;

  onChange: (value: any) => void;
  onTouched: () => void;
  dataSource: MatTableDataSource<any>;

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.fieldArray.controls);
  }

  constructor(private fb: FormBuilder) {}

  get controls() {
    return this.fieldArray.controls as FormControl[];
  }

  ngOnInit(): void {
    this.initialize();
  }

  get schemas() {
    return this.schema.type === 'array'
      ? (this.schema.items as Array<ConfigSchema>)
      : ([
          {
            name: 'key',
            label: this.schema.object?.key.label,
            type: this.schema.object?.key.type,
          },
          {
            name: 'value',
            label: this.schema.object?.value.label,
            type: this.schema.object?.value.type,
          },
        ] as Array<ConfigSchema>);
  }

  get displayedColumns() {
    const columns =
      this.schema.type === 'array'
        ? this.schema.items === 'string'
          ? [this.schema.name]
          : this.schemas.map(s => s.name)
        : ['key', 'value'];
    columns.push('actions');
    return columns;
  }

  getFormGroup(index: number) {
    return this.fieldArray.at(index) as FormGroup;
  }

  createGroup(value?: any) {
    const group = this.fb.group({});
    this.schemas.forEach(schema => {
      group.addControl(
        schema.name,
        new FormControl(value ? value[schema.name] : schema.default)
      );
    });
    if (value) {
      group.patchValue(value);
    }
    return group;
  }

  initialize() {
    this.fieldArray = this.fb.array([]);
  }

  writeValue(value?: Array<any> | { [key: string]: any }): void {
    if (value && Array.isArray(value) && this.schema.type === 'array') {
      if (this.schema.items === 'string') {
        this.fieldArray = this.fb.array(value.map(v => new FormControl(v)));
      } else {
        this.fieldArray = this.fb.array(value.map(v => this.createGroup(v)));
      }
    } else if (value && this.schema.type === 'object') {
      this.fieldArray = this.fb.array(
        Object.keys(value).map(key =>
          this.createGroup({
            key,
            value: (value as { [key: string]: any })[key],
          })
        )
      );
    }
    this.fieldArray.valueChanges
      .pipe(
        map(value => {
          if (this.schema.type === 'object') {
            return value.reduce((acc: any, curr: any) => {
              acc[curr.key] = curr.value;
              return acc;
            }, {});
          }
          return value;
        })
      )
      .subscribe(() => {
        this.updateDataSource();
      });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.fieldArray.valueChanges
      .pipe(
        map(value => {
          if (this.schema.type === 'object') {
            return value.reduce((acc: any, curr: any) => {
              acc[curr.key] = curr.value;
              return acc;
            }, {});
          }
          return value;
        })
      )
      .subscribe(value => {
        this.onChange(value);
        this.updateDataSource();
      });
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.fieldArray.disable() : this.fieldArray.enable();
  }

  add() {
    if (this.schema.items === 'string') {
      this.fieldArray.push(new FormControl(''));
    } else {
      this.fieldArray.push(this.createGroup());
    }
  }

  remove(index: number) {
    this.fieldArray.removeAt(index);
  }
}
