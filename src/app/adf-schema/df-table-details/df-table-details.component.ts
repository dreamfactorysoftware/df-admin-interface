import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { DfFieldsTableComponent } from './df-fields-table.component';
import { DfRelationshipsTableComponent } from './df-relationships-table.component';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { MatTabsModule } from '@angular/material/tabs';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AceEditorMode } from 'src/app/shared/types/scripts';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TableDetailsType } from './df-table-details.types';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';

@UntilDestroy({ checkProperties: true })
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
    MatTabsModule,
    NgTemplateOutlet,
    DfAceEditorComponent,
  ],
})
export class DfTableDetailsComponent implements OnInit {
  tableDetailsForm: FormGroup;
  type: string;
  dbName: string;
  tableFields: [];
  tableRelated: [];
  jsonData = new FormControl();
  AceEditorMode = AceEditorMode;

  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    public breakpointService: DfBreakpointService,
    private router: Router,
    private themeService: DfThemeService
  ) {
    this.tableDetailsForm = this.fb.group({
      name: ['', Validators.required],
      alias: [null],
      label: [null],
      plural: [null],
      description: [null],
    });
  }
  isDarkMode = this.themeService.darkMode$;

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(data => {
      this.dbName = this.activatedRoute.snapshot.params['name'];
      this.type = data['type'];
      this.jsonData.setValue(JSON.stringify(data['data'], null, 2));

      if (this.type === 'edit') {
        this.tableDetailsForm.patchValue({
          name: data['data'].name,
          alias: data['data'].alias,
          label: data['data'].label,
          plural: data['data'].plural,
          description: data['data'].description,
        });

        this.tableDetailsForm.get('name')?.disable();
        this.tableFields = data['data'].field;
        this.tableRelated = data['data'].related;
      }
    });
  }

  goBack() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute,
    });
  }

  save(value?: string) {
    let data;
    if (value) {
      try {
        data = JSON.parse(value);
      } catch (e) {
        console.log(e);
        return;
      }
    } else {
      if (this.tableDetailsForm.invalid) return;
      data = this.tableDetailsForm.value;
      data.field = [
        {
          alias: null,
          name: 'id',
          label: 'Id',
          description: null,
          native: [],
          type: 'id',
          dbType: null,
          length: null,
          precision: null,
          scale: null,
          default: null,
          required: false,
          allowNull: false,
          fixedLength: false,
          supportsMultibyte: false,
          autoIncrement: true,
          isPrimaryKey: false,
          isUnique: false,
          isIndex: false,
          isForeignKey: false,
          refTable: null,
          refField: null,
          refOnUpdate: null,
          refOnDelete: null,
          picklist: null,
          validation: null,
          dbFunction: null,
          isVirtual: false,
          isAggregate: false,
        },
      ];
    }

    if (this.type === 'create') {
      const payload = {
        resource: [data],
      };

      this.crudService
        .create<GenericListResponse<TableDetailsType>>(
          payload,
          {
            snackbarSuccess: 'schema.alerts.createSuccess',
            fields: '*',
          },
          `${this.dbName}/_schema`
        )
        .subscribe(res => {
          this.router.navigate(['../', res.resource[0].name], {
            relativeTo: this.activatedRoute,
          });
        });
    } else if (this.type === 'edit') {
      const tableName = this.tableDetailsForm.get('name')?.value;
      this.crudService
        .patch(
          `${this.dbName}/_schema/${tableName}`,
          { resource: [this.tableDetailsForm.getRawValue()] },
          {
            snackbarSuccess: 'schema.alerts.updateSuccess',
          }
        )
        .subscribe(() => {
          this.goBack();
        });
    }
  }
}
