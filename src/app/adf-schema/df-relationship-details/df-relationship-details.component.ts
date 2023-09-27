import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TableField } from '../df-table-details/df-table-details.types';
import { Service } from 'src/app/shared/types/service';
import { UntilDestroy } from '@ngneat/until-destroy';

interface BasicOption {
  label: string;
  value: string | number;
  name?: string;
}
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-relationship-details',
  templateUrl: './df-relationship-details.component.html',
  styleUrls: ['./df-relationship-details.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslocoPipe,
    AsyncPipe,
    NgFor,
    NgIf,
  ],
})
export class DfRelationshipDetailsComponent implements OnInit {
  relationshipForm: FormGroup;
  type: string;
  dbName: string;
  tableName: string;

  serviceOptions: BasicOption[];

  referenceFieldOptions: BasicOption[];
  referenceTableOptions: BasicOption[];

  junctionTableOptions: BasicOption[];
  junctionFieldOptions: BasicOption[];
  junctionReferenceFieldOptions: BasicOption[];

  typeOptions: BasicOption[] = [
    { label: 'Belongs To', value: 'belongs_to' },
    { label: 'Has Many', value: 'has_many' },
    { label: 'Has One', value: 'has_one' },
    { label: 'Many To Many', value: 'many_many' },
  ];

  fieldOptions: BasicOption[];

  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public breakpointService: DfBreakpointService
  ) {
    this.relationshipForm = this.fb.group({
      name: [{ value: null, disabled: true }],
      alias: [null],
      label: [null],
      description: [null],
      alwaysFetch: [false],
      type: [null, Validators.required],
      isVirtual: [{ value: true, disabled: true }],
      field: [null, Validators.required],
      refServiceId: [null, Validators.required],
      refTable: [null, Validators.required],
      refField: [null, Validators.required],
      junctionServiceId: [
        { value: null, disabled: true },
        this.relationshipForm &&
        this.relationshipForm.value.type === 'many_many'
          ? Validators.required
          : null,
      ],
      junctionTable: [
        { value: null, disabled: true },
        this.relationshipForm &&
        this.relationshipForm.value.type === 'many_many'
          ? Validators.required
          : null,
      ],
      junctionField: [
        { value: null, disabled: true },
        this.relationshipForm &&
        this.relationshipForm.value.type === 'many_many'
          ? Validators.required
          : null,
      ],
      junctionRefField: [
        { value: null, disabled: true },
        this.relationshipForm &&
        this.relationshipForm.value.type === 'many_many'
          ? Validators.required
          : null,
      ],
    });

    this.activatedRoute.data.subscribe(data => {
      this.type = data['type'];
      this.dbName = this.activatedRoute.snapshot.params['name'];
      this.tableName = this.activatedRoute.snapshot.params['id'];

      this.fieldOptions = data['fields'].resource.map((field: TableField) => {
        return {
          label: field.label,
          value: field.name,
        };
      });

      this.serviceOptions = data['services'].resource.map((item: Service) => {
        return { label: item.label, value: item.id, name: item.name };
      });

      if (this.type === 'edit') {
        this.relationshipForm.patchValue({
          name: data['data'].name,
          alias: data['data'].alias,
          label: data['data'].label,
          description: data['data'].description,
          alwaysFetch: data['data'].alwaysFetch,
          type: data['data'].type,
          isVirtual: data['data'].isVirtual,
          field: data['data'].field,
          refServiceId: data['data'].refServiceId,
          refTable: data['data'].refTable,
          refField: data['data'].refField,
          junctionServiceId: data['data'].junctionServiceId,
          junctionTable: data['data'].junctionTable,
          junctionField: data['data'].junctionField,
          junctionRefField: data['data'].junctionRefField,
        });

        if (data['data'].refServiceId) {
          this.getTables('reference');
          this.getFields('reference');
        }

        if (data['data'].junctionServiceId) {
          this.getTables('junction');
          this.getFields('junction');
        }

        if (data['data'].type === 'many_many') {
          this.relationshipForm.get('junctionServiceId')?.enable();
          this.relationshipForm.get('junctionTable')?.enable();
          this.relationshipForm.get('junctionField')?.enable();
          this.relationshipForm.get('junctionRefField')?.enable();
        }
      }
    });
  }

  ngOnInit(): void {
    // if type is many to many, enable junction fields
    this.relationshipForm.get('type')?.valueChanges.subscribe(value => {
      if (value === 'many_many') {
        this.relationshipForm.get('junctionServiceId')?.enable();
      } else {
        this.relationshipForm.get('junctionServiceId')?.disable();
        this.relationshipForm.get('junctionTable')?.disable();
        this.relationshipForm.get('junctionField')?.disable();
        this.relationshipForm.get('junctionRefField')?.disable();
      }
    });

    this.relationshipForm.get('refServiceId')?.valueChanges.subscribe(() => {
      this.relationshipForm.get('refTable')?.reset();
      this.relationshipForm.get('refField')?.reset();
      this.getTables('reference');
    });

    this.relationshipForm.get('refTable')?.valueChanges.subscribe(() => {
      this.relationshipForm.get('refField')?.reset();
      this.getFields('reference');
    });

    this.relationshipForm
      .get('junctionServiceId')
      ?.valueChanges.subscribe(() => {
        this.relationshipForm.get('junctionTable')?.reset();
        this.relationshipForm.get('junctionTable')?.enable();
        this.getTables('junction');
      });

    this.relationshipForm.get('junctionTable')?.valueChanges.subscribe(() => {
      this.relationshipForm.get('junctionField')?.reset();
      this.relationshipForm.get('junctionField')?.enable();
      this.relationshipForm.get('junctionRefField')?.reset();
      this.relationshipForm.get('junctionRefField')?.enable();
      this.getFields('junction');
    });
  }

  getServiceName(serviceId: number) {
    const serviceName = this.serviceOptions.find(item => {
      if (item.value === serviceId) {
        return item.name;
      }
      return null;
    });

    return serviceName?.name;
  }

  getTables(source: string) {
    if (source === 'reference') {
      const serviceName = this.getServiceName(
        this.relationshipForm.get('refServiceId')?.value
      );
      this.crudService.get(`${serviceName}/_schema`).subscribe((data: any) => {
        this.referenceTableOptions = data.resource.map(
          (table: { name: string }) => {
            return {
              label: table.name,
              value: table.name,
            };
          }
        );
      });
    } else if (source === 'junction') {
      const serviceName = this.getServiceName(
        this.relationshipForm.get('junctionServiceId')?.value
      );
      this.crudService.get(`${serviceName}/_schema`).subscribe((data: any) => {
        this.junctionTableOptions = data.resource.map(
          (table: { name: string }) => {
            return {
              label: table.name,
              value: table.name,
            };
          }
        );
      });
    }
  }

  getFields(source: string) {
    if (source === 'reference') {
      const serviceName = this.getServiceName(
        this.relationshipForm.get('refServiceId')?.value
      );
      const tableName = this.relationshipForm.get('refTable')?.value;

      this.crudService
        .get(`${serviceName}/_schema/${tableName}`)
        .subscribe((data: any) => {
          this.referenceFieldOptions = data.field.map((field: any) => {
            return {
              label: field.label,
              value: field.name,
            };
          });
        });
    } else if (source === 'junction') {
      const serviceName = this.getServiceName(
        this.relationshipForm.get('junctionServiceId')?.value
      );
      const tableName = this.relationshipForm.get('junctionTable')?.value;

      this.crudService
        .get(`${serviceName}/_schema/${tableName}`)
        .subscribe((data: any) => {
          this.junctionFieldOptions = data.field.map((field: any) => {
            return {
              label: field.label,
              value: field.name,
            };
          });

          // TODO: are juctionReferenceFieldOptions ever different from junctionFieldOptions?
          // this.junctionReferenceFieldOptions = [...this.junctionFieldOptions];
        });
    }
  }

  goBack() {
    if (this.type === 'create') {
      this.router.navigate(['../'], {
        relativeTo: this.activatedRoute,
      });
    } else if (this.type === 'edit') {
      this.router.navigate(['../../'], {
        relativeTo: this.activatedRoute,
      });
    }
  }

  save() {
    const payload = {
      resource: [this.relationshipForm.value],
    };

    if (this.type === 'create') {
      this.crudService
        .create(
          payload,
          {
            snackbarSuccess: 'schema.relationships.alert.createSuccess',
          },
          `${this.dbName}/_schema/${this.tableName}/_related`
        )
        .subscribe(() => {
          this.goBack();
        });
    } else if (this.type === 'edit') {
      this.crudService
        .patch(`${this.dbName}/_schema/${this.tableName}/_related`, payload, {
          snackbarSuccess: 'schema.relationships.alert.updateSuccess',
        })
        .subscribe(() => {
          this.goBack();
        });
    }
  }
}
