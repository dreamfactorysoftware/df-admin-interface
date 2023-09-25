import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
export class DfTableDetailsComponent implements OnInit, OnDestroy {
  // TODO: JSON View with Ace Editor

  tableDetailsForm: FormGroup;
  destroyed$ = new Subject<void>();
  type: string;
  dbName: string;
  tableFields: [];
  tableRelated: [];
  jsonData: string;

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
    });
  }

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dbName = this.activatedRoute.snapshot.params['name'];
        this.type = data['type'];
        this.jsonData = JSON.stringify(data['data'], null, 2);

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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
    const data = this.tableDetailsForm.value;
    const payload = {
      resource: [data],
    };

    if (this.type === 'create') {
      this.crudService
        .create(
          payload,
          {
            snackbarSuccess: 'schema.alerts.createSuccess',
            fields: '*',
          },
          `${this.dbName}/_schema`
        )
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.goBack();
        });
    } else if (this.type === 'edit') {
      const tableName = this.tableDetailsForm.get('name')?.value;
      this.crudService
        .patch(`${this.dbName}/_schema/${tableName}`, data, {
          snackbarSuccess: 'schema.alerts.updateSuccess',
        })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.goBack();
        });
    }
  }
}
