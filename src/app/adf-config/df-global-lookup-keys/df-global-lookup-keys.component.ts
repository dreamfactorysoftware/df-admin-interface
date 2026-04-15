import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DfLookupKeysComponent } from 'src/app/shared/components/df-lookup-keys/df-lookup-keys.component';
import { uniqueNameValidator } from 'src/app/shared/validators/unique-name.validator';
import { noWhitespaceValidator } from 'src/app/shared/validators/no-whitespace.validator';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { LookupKeyType } from '../../shared/types/global-lookup-keys';
import { LOOKUP_KEYS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { UntilDestroy } from '@ngneat/until-destroy';
import { forkJoin, Observable } from 'rxjs';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-global-lookup-keys',
  templateUrl: './df-global-lookup-keys.component.html',
  styleUrls: ['./df-global-lookup-keys.component.scss'],
  standalone: true,
  imports: [
    DfLookupKeysComponent,
    ReactiveFormsModule,
    TranslocoPipe,
    MatButtonModule,
  ],
})
export class DfGlobalLookupKeysComponent implements OnInit {
  lookupKeysForm: FormGroup;
  deletedKeyIds: number[] = [];
  @ViewChild(DfLookupKeysComponent) lookupKeysChild?: DfLookupKeysComponent;

  constructor(
    @Inject(LOOKUP_KEYS_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
    this.lookupKeysForm = this.fb.group({
      lookupKeys: this.fb.array([], [uniqueNameValidator]),
    });
  }

  onLookupDeleted(item: LookupKeyType) {
    if (item?.id != null) {
      this.deletedKeyIds.push(item.id);
      this.lookupKeysForm.markAsDirty();
    }
  }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data }) => {
      this.populateForm(data.resource ?? []);
    });
  }

  private populateForm(items: LookupKeyType[]): void {
    const lookupKeysArray = this.lookupKeysForm.get('lookupKeys') as FormArray;
    lookupKeysArray.clear();
    items.forEach((item: LookupKeyType) => {
      lookupKeysArray.push(
        new FormGroup({
          name: new FormControl(item.name, [
            Validators.required,
            noWhitespaceValidator,
          ]),
          value: new FormControl(item.value),
          private: new FormControl(item.private),
          id: new FormControl(item.id),
        })
      );
    });
    this.lookupKeysForm.markAsPristine();
    this.deletedKeyIds = [];
    this.lookupKeysChild?.updateDataSource();
  }

  private refresh(): void {
    this.crudService
      .getAll<GenericListResponse<LookupKeyType>>()
      .subscribe(response => {
        this.populateForm(response?.resource ?? []);
      });
  }

  save() {
    if (this.lookupKeysForm.invalid) {
      return;
    }
    if (this.lookupKeysForm.pristine && this.deletedKeyIds.length === 0) {
      return;
    }

    const createKeys: LookupKeyType[] = [];
    const updateKeys: LookupKeyType[] = [];

    const lookupKeysArray = this.lookupKeysForm.get('lookupKeys') as FormArray;

    lookupKeysArray.controls.forEach(control => {
      if (!control.pristine) {
        if (control.value.id) {
          updateKeys.push(control.value);
        } else {
          createKeys.push({ ...control.value, id: null });
        }
      }
    });

    const operations: Observable<unknown>[] = [];

    if (createKeys.length > 0) {
      operations.push(
        this.crudService.create(
          { resource: createKeys },
          { fields: '*', snackbarSuccess: 'lookupKeys.alerts.createSuccess' }
        )
      );
    }

    updateKeys.forEach((item: LookupKeyType) => {
      if (item.id) {
        operations.push(
          this.crudService.update(item.id, item, {
            snackbarSuccess: 'lookupKeys.alerts.updateSuccess',
          })
        );
      }
    });

    if (this.deletedKeyIds.length > 0) {
      operations.push(
        this.crudService.delete(this.deletedKeyIds, {
          snackbarSuccess: 'lookupKeys.alerts.deleteSuccess',
        })
      );
    }

    if (operations.length === 0) {
      return;
    }

    forkJoin(operations).subscribe(() => this.refresh());
  }
}
