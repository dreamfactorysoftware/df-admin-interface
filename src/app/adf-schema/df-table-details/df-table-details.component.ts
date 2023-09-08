import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { uniqueNameValidator } from '../../shared/validators/unique-name.validator';
import { TableField, TableRelated } from './df-table-details.types';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgIf } from '@angular/common';
import { DfFieldsTableComponent } from './df-fields-table.component';
import { DfRelationshipsTableComponent } from './df-relationships-table.component';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { DfDatabaseSchemaService } from '../services/df-database-schema.service';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-table-details',
  templateUrl: './df-table-details.component.html',
  styleUrls: ['./df-table-details.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
    NgIf,
    DfFieldsTableComponent,
    DfRelationshipsTableComponent,
    AsyncPipe,
  ],
})
export class DfTableDetailsComponent implements OnInit, OnDestroy {
  // TODO: JSON View
  // TODO: Table View
  // table name
  // alias
  // label
  // plural label
  // description
  // fields table
  // relationships table

  tableDetailsForm: FormGroup;
  destroyed$ = new Subject<void>();

  MOCK_DATA: any;

  constructor(
    private service: DfDatabaseSchemaService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    public breakpointService: DfBreakpointService,
    private router: Router
  ) {
    this.tableDetailsForm = this.fb.group({
      name: ['', Validators.required],
      alias: [''],
      label: [''],
      plural: [''],
      description: [''],
      field: this.fb.array([], [uniqueNameValidator]),
      related: this.fb.array([], [uniqueNameValidator]),
    });
  }

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      // .subscribe(({ data }) => {
      .subscribe(data => {
        console.log('route data', data);

        if (data['type'] !== 'create') {
          // TODO DELETE
          this.getMockData();
        }
      });
  }

  getMockData(): void {
    this.http
      .get('api/v2/db/_schema/contact_info?refresh=true', {
        headers: {
          'X-Dreamfactory-Session-Token':
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0L2FwaS92Mi9zeXN0ZW0vYWRtaW4vc2Vzc2lvbiIsImlhdCI6MTY5MzkyNjQ0MiwiZXhwIjoxNjk0MDk5OTkyLCJuYmYiOjE2OTQwMTM1OTIsImp0aSI6Im5KckZpc3dlWXVMNUNkOW4iLCJzdWIiOiI5Mzk0MmU5NmY1YWNkODNlMmUwNDdhZDhmZTAzMTE0ZCIsInVzZXJfaWQiOjEsImZvcmV2ZXIiOmZhbHNlfQ.C-hvAN1W6qpagLIe55Sk_ms9YOqw6OivDW_3OS9mF0g',
        },
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(res => {
        console.log('res', res);
        this.MOCK_DATA = res;

        this.tableDetailsForm.patchValue({
          name: this.MOCK_DATA.name,
          alias: this.MOCK_DATA.alias,
          label: this.MOCK_DATA.label,
          plural: this.MOCK_DATA.plural,
          description: this.MOCK_DATA.description,
        });

        if (this.MOCK_DATA.field.length > 0) {
          this.MOCK_DATA.field.forEach((item: TableField) => {
            (this.tableDetailsForm.controls['field'] as FormArray).push(
              new FormGroup({
                name: new FormControl(item.name, [Validators.required]),
                alias: new FormControl(item.alias),
                type: new FormControl(item.type, [Validators.required]),
                isVirtual: new FormControl(item.isVirtual, [
                  Validators.required,
                ]),
                isAggregate: new FormControl(item.isAggregate, [
                  Validators.required,
                ]),
                required: new FormControl(item.required, [Validators.required]),
                constraints: new FormControl(
                  item.isPrimaryKey
                    ? 'Primary Key'
                    : item.isForeignKey
                    ? 'Foreign Key'
                    : ''
                ),
              })
            );
          });
        }

        if (this.MOCK_DATA.related.length > 0) {
          this.MOCK_DATA.related.forEach((item: TableRelated) => {
            (this.tableDetailsForm.controls['related'] as FormArray).push(
              new FormGroup({
                name: new FormControl(item.name, [Validators.required]),
                alias: new FormControl(item.alias),
                type: new FormControl(item.type, [Validators.required]),
                isVirtual: new FormControl(item.isVirtual, [
                  Validators.required,
                ]),
              })
            );
          });
        }

        console.log('this.tableDetailsForm', this.tableDetailsForm.value);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  goBack() {
    const dbName = this.activatedRoute.snapshot.url[1].path;
    this.router.navigate([
      `${ROUTES.ADMIN_SETTINGS}/${ROUTES.SCHEMA}/${ROUTES.VIEW}/${dbName}`,
    ]);
  }

  save() {
    console.log('save');
  }
}
