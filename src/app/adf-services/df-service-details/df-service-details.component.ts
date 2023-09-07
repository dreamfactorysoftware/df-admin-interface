import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { ServiceType } from 'src/app/shared/types/service';

@Component({
  selector: 'df-service-details',
  templateUrl: './df-service-details.component.html',
  styleUrls: ['./df-service-details.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgFor,
    MatSlideToggleModule,
    MatTabsModule,
    MatExpansionModule,
    TranslocoPipe,
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    MatCheckboxModule,
    NgTemplateOutlet,
  ],
})
export class DfServiceDetailsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  edit = false;
  serviceTypes: Array<ServiceType>;
  serviceForm: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.serviceForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      label: [''],
      description: [''],
      active: [true],
    });
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.edit = true;
    }
    this.activatedRoute.data.subscribe(({ serviceTypes }) => {
      this.serviceTypes = serviceTypes;
    });
  }

  ngOnInit(): void {
    this.serviceForm.controls['type'].valueChanges.subscribe(() => {
      this.serviceForm.removeControl('config');
      if (this.configSchema) {
        const config = this.fb.group({});
        this.configSchema.forEach(control => {
          const validator = [];
          if (control.required) {
            validator.push(Validators.required);
          }
          config.addControl(
            control.name,
            new FormControl(control.default, validator)
          );
        });
        this.serviceForm.addControl('config', config);
      }
    });
  }

  get configSchema() {
    return this.serviceTypes.find(
      type => type.name === this.serviceForm.value.type
    )?.configSchema;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
