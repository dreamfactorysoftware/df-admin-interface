import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgIf } from '@angular/common';
import { DfFieldsTableComponent } from './df-fields-table.component';
import { DfRelationshipsTableComponent } from './df-relationships-table.component';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

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

  tableDetailsForm: FormGroup;
  destroyed$ = new Subject<void>();
  type: string;
  dbName: string;

  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    public breakpointService: DfBreakpointService,
    private router: Router
  ) {
    this.tableDetailsForm = this.fb.group({
      name: ['', Validators.required],
      alias: [null],
      label: [null],
      plural: [null],
      description: [null],
      field: this.fb.array([], [uniqueNameValidator]),
      related: this.fb.array([], [uniqueNameValidator]),
    });
  }

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        console.log('route data', data);
        this.type = data['type'];
      });

    this.dbName = this.activatedRoute.snapshot.params['name'];
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  goBack() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute,
    });
  }

  save() {
    const data = this.tableDetailsForm.value;

    // TODO: DELETE - needed while field component is in progress
    data.field.push({
      allow_null: false,
      auto_increment: true,
      db_function: null,
      db_type: null,
      default: null,
      fixed_length: false,
      is_aggregate: false,
      is_foreign_key: false,
      is_primary_key: false,
      is_unique: false,
      is_virtual: false,
      label: 'id',
      length: null,
      name: 'id',
      picklist: null,
      precision: null,
      ref_field: '',
      ref_table: '',
      required: false,
      scale: 0,
      supports_multibyte: false,
      type: 'id',
      validation: null,
      value: [],
      alias: 'id',
    });

    const payload = {
      resource: [data],
    };
    if (this.type === 'create') {
      this.crudService
        .create(
          payload,
          {
            snackbarSuccess: 'Table Successfully Created',
            fields: '*',
          },
          `${this.dbName}/_schema`
        )
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.goBack();
        });
    }
  }
}
