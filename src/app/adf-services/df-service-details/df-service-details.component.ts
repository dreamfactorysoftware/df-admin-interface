import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfArrayFieldComponent } from 'src/app/shared/components/df-field-array/df-array-field.component';
import { DfDynamicFieldComponent } from 'src/app/shared/components/df-dynamic-field/df-dynamic-field.component';
import { ConfigSchema, ServiceType } from 'src/app/shared/types/service';
import { snakeToCamelString } from 'src/app/shared/utilities/case';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { SERVICES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { Service } from 'src/app/shared/types/files';
import { AceEditorMode } from 'src/app/shared/types/scripts';
import { DfScriptEditorComponent } from 'src/app/shared/components/df-script-editor/df-script-editor.component';

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
    DfScriptEditorComponent,
  ],
})
export class DfServiceDetailsComponent implements OnInit {
  edit = false;
  serviceTypes: Array<ServiceType>;
  serviceForm: FormGroup;
  faCircleInfo = faCircleInfo;
  serviceData: Service;
  configSchema: Array<ConfigSchema>;

  systemEvents: Array<{ label: string; value: string }>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    @Inject(SERVICES_SERVICE_TOKEN)
    private servicesService: DfBaseCrudService,
    private router: Router
  ) {
    this.serviceForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      label: [''],
      description: [''],
      isActive: [true],
    });
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.edit = true;
    }
  }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data, serviceTypes }) => {
      this.serviceTypes = serviceTypes;
      this.serviceData = data;
      if (this.edit) {
        this.configSchema = this.getConfigSchema(data.type);
        this.initializeConfig();
        this.serviceForm.patchValue({
          ...data,
          config: data.config,
        });
        this.serviceForm.controls['type'].disable();
      } else {
        this.serviceForm.controls['type'].valueChanges.subscribe(value => {
          this.serviceForm.removeControl('config');
          this.configSchema = this.getConfigSchema(value);
          this.initializeConfig();
        });
      }
    });
  }

  initializeConfig() {
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
  }

  get scriptMode() {
    const type = this.serviceForm.getRawValue().type;
    if (type === 'nodejs') {
      return AceEditorMode.NODEJS;
    }
    if (type === 'python' || type === 'python3') {
      return AceEditorMode.PYTHON;
    }
    if (type === 'php') {
      return AceEditorMode.PHP;
    }
    return AceEditorMode.TEXT;
  }

  getConfigSchema(type: string) {
    return (
      this.serviceTypes
        .find(serviceType => serviceType.name === type)
        ?.configSchema.map(control => ({
          ...control,
          name: snakeToCamelString(control.name),
        })) ?? []
    );
  }

  get viewSchema() {
    return this.configSchema?.filter(
      control => !['storageServiceId', 'storagePath'].includes(control.name)
    );
  }

  getConfigControl(name: string) {
    return this.serviceForm.get(`config.${name}`) as FormControl;
  }

  getControl(name: string) {
    return this.serviceForm.controls[name] as FormControl;
  }

  save() {
    if (this.serviceForm.invalid) {
      return;
    }
    const data = this.serviceForm.getRawValue();
    if (this.edit) {
      this.servicesService
        .update(this.serviceData.id, data, {
          snackbarError: 'server',
          snackbarSuccess: 'services.updateSuccessMsg',
        })
        .subscribe(() => {
          this.router.navigate(['../'], { relativeTo: this.activatedRoute });
        });
    } else {
      this.servicesService
        .create(
          { resource: [data] },
          {
            snackbarError: 'server',
            snackbarSuccess: 'services.createSuccessMsg',
          }
        )
        .subscribe(() => {
          this.router.navigate(['../'], { relativeTo: this.activatedRoute });
        });
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
