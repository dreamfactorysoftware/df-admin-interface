import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { DfArrayFieldComponent } from 'src/app/shared/components/df-field-array/df-array-field.component';
import { DfDynamicFieldComponent } from 'src/app/shared/components/df-dynamic-field/df-dynamic-field.component';
import { ServiceType } from 'src/app/shared/types/service';
import { mapCamelToSnake } from 'src/app/shared/utilities/case';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
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
    DfDynamicFieldComponent,
    DfArrayFieldComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatButtonModule,
  ],
})
export class DfServiceDetailsComponent implements OnInit {
  edit = false;
  serviceTypes: Array<ServiceType>;
  serviceForm: FormGroup;
  faCircleInfo = faCircleInfo;

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

    this.activatedRoute.data.subscribe(({ data, serviceTypes }) => {
      this.serviceTypes = serviceTypes;
      if (this.edit) {
        this.serviceForm.controls['type'].disable();
        this.serviceForm.patchValue({
          ...data,
          config: mapCamelToSnake(data.config),
        });
      }
    });
  }

  get configSchema() {
    return this.serviceTypes.find(
      type => type.name === this.serviceForm.getRawValue().type
    )?.configSchema;
  }
}
