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
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
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
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { forkJoin, map, switchMap } from 'rxjs';
import {
  GOLD_SERVICES,
  SILVER_SERVICES,
} from 'src/app/shared/constants/services';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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
    DfPaywallComponent,
    MatStepperModule,
    CommonModule,
    MatIconModule,
  ],
})
export class DfServiceDetailsComponent implements OnInit {
  edit = false;
  isDatabase = false;
  serviceTypes: Array<ServiceType>;
  serviceForm: FormGroup;
  faCircleInfo = faCircleInfo;
  serviceData: Service;
  configSchema: Array<ConfigSchema>;
  images: Array<ImageObject>;
  search = '';

  systemEvents: Array<{ label: string; value: string }>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    @Inject(SERVICES_SERVICE_TOKEN)
    private servicesService: DfBaseCrudService,
    private router: Router,
    private systemConfigDataService: DfSystemConfigDataService
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
    this.images = [
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc69_alloy-p-500.png',
        alt: 'AlloyDB',
        label: 'alloydb',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc60_API%2520Logo%2520Container-18-p-500.webp',
        alt: 'aws_dynamodb',
        label: 'aws_dynamodb',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbf5_Redshift-p-500.jpg',
        alt: 'aws_redshift_db',
        label: 'aws_redshift_db',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc6c_azure-p-500.png',
        alt: 'azure_documentdb',
        label: 'azure_documentdb',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc6e_API%2520Logo%2520Container-p-500.png',
        alt: 'azure_table',
        label: 'azure_table',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbf3_API%2520Logo%2520Container-p-500.webp',
        alt: 'cassandra',
        label: 'cassandra',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbf2_API%2520Logo%2520Container-8-p-500.webp',
        alt: 'couchdb',
        label: 'couchdb',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbf7_API%2520Logo%2520Container-14-p-500.webp',
        alt: 'firebird',
        label: 'firebird',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc63_API%2520Logo%2520Container-p-500.webp',
        alt: 'ibmdb2',
        label: 'ibmdb2',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc6d_ibm-p-500.png',
        alt: 'informix',
        label: 'informix',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc6a_mariaDB-p-500.png',
        alt: 'mariadb',
        label: 'mariadb',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbb5d_API%2520Logo%2520Container-2-p-500.webp',
        alt: 'memsql',
        label: 'memsql',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbf1_API%2520Logo%2520Container-21-p-500.webp',
        alt: 'mongodb',
        label: 'mongodb',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbb7e_API%2520Logo%2520Container-3-p-500.webp',
        alt: 'mysql',
        label: 'mysql',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbb01_API%2520Logo%2520Container-5-p-500.webp',
        alt: 'oracle',
        label: 'oracle',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbb1a_API%2520Logo%2520Container-7-p-500.webp',
        alt: 'pgsql',
        label: 'pgsql',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc68_Salesforce-p-500.png',
        alt: 'salesforce_db',
        label: 'salesforce_db',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc66_Sap%2520SQL-p-500.png',
        alt: 'sqlanywhere',
        label: 'sqlanywhere',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbab_API%2520Logo%2520Container-11-p-500.webp',
        alt: 'sqlite',
        label: 'sqlite',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbbd8_API%2520Logo%2520Container-27-p-500.webp',
        alt: 'sqlsrv',
        label: 'sqlsrv',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbc67_API%2520Logo%2520Container-p-500.png',
        alt: 'apache_hive',
        label: 'apache_hive',
      },
      {
        src: 'https://assets-global.website-files.com/64ed8da8a866be7a702fbafb/64ed8da8a866be7a702fbb45_API%2520Logo%2520Container-9-p-500.webp',
        alt: 'snowflake',
        label: 'snowflake',
      },
    ];
  }

  ngOnInit(): void {
    this.systemConfigDataService.environment$
      .pipe(
        switchMap(env =>
          this.activatedRoute.data.pipe(map(route => ({ env, route })))
        )
      )
      .subscribe(({ env, route }) => {
        if (route['groups'][0] === 'Database') {
          this.isDatabase = true;
        }
        const { data, serviceTypes, groups } = route;
        const licenseType = env.platform?.license;
        this.serviceTypes = serviceTypes;
        if (licenseType === 'SILVER') {
          this.serviceTypes.push(
            ...GOLD_SERVICES.filter(s => groups.includes(s.group))
          );
        }
        if (licenseType === 'OPEN SOURCE') {
          this.serviceTypes.push(
            ...SILVER_SERVICES.filter(s => groups.includes(s.group)),
            ...GOLD_SERVICES.filter(s => groups.includes(s.group))
          );
        }
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
    this.serviceForm.controls['type'].valueChanges.subscribe(value => {
      this.serviceForm.patchValue({
        label: value,
      });
    });
  }

  initializeConfig() {
    if (this.configSchema && this.configSchema.length > 0) {
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

  get subscriptionRequired() {
    return (
      this.serviceForm.controls['type'].value && this.configSchema.length === 0
    );
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
          this.router.navigate(['/api-connections/api-docs']);
        });
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  getBackgroundImage(typeLable: string) {
    const image = this.images.find(img => img.label == typeLable);
    if (!image) {
      return '';
    }
    return image ? image.src : '';
  }

  get filteredServiceTypes() {
    return this.serviceTypes.filter(type =>
      type.label
        .replace(/\s/g, '')
        .toLowerCase()
        .includes(this.search.toLowerCase())
    );
  }

  nextStep(stepper: MatStepper) {
    stepper.next();
  }
}
interface ImageObject {
  alt: string;
  src: string;
  label: string;
}
