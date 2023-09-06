import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DfLookupKeysComponent } from 'src/app/shared/components/df-lookup-keys/df-lookup-keys.component';
import { uniqueNameValidator } from 'src/app/shared/validators/unique-name.validator';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { LookupKeyType } from './df-global-lookup-keys.types';
import { LOOKUP_KEYS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';

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
export class DfGlobalLookupKeysComponent implements OnInit, OnDestroy {
  lookupKeysForm: FormGroup;
  destroyed$ = new Subject<void>();

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

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        console.log('lookup keys', data.resource);
        if (data.resource.length > 0) {
          data.resource.forEach((item: LookupKeyType) => {
            (this.lookupKeysForm.controls['lookupKeys'] as FormArray).push(
              new FormGroup({
                name: new FormControl(item.name, [Validators.required]),
                value: new FormControl(item.value),
                private: new FormControl(item.private),
                id: new FormControl(item.id),
              })
            );
          });
        }
      });
  }

  save() {
    // if (this.lookupKeysForm.invalid || this.lookupKeysForm.pristine) {
    //   return;
    // }

    const createKeys: LookupKeyType[] = [];
    const updateKeys: LookupKeyType[] = [];

    console.log('test123', this.lookupKeysForm.controls['lookupKeys']);

    // this.lookupKeysForm.controls['lookupKeys'].forEach((item: any) => {
    this.lookupKeysForm.controls['lookupKeys'].value.forEach((item: any) => {
      console.log('item', item);
      if (item.id) {
        updateKeys.push(item);
      } else {
        createKeys.push({ ...item, id: null });
      }
    });

    // console.log('createKeys', createKeys);
    // console.log('updateKeys', updateKeys);

    if (createKeys.length > 0) {
      this.crudService
        .create({ resource: createKeys }, { fields: '*' })
        .subscribe();
    }

    // TODO how do I check to see if each item is dirty?
    // Loop through each object and see if it matches the original data?

    // if (updateKeys.length > 0) {
    //   updateKeys.forEach((item: LookupKeyType) => {
    //     if (item.id) {
    //       this.crudService.update(item.id, item).subscribe();
    //     }
    //   });
    // }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
