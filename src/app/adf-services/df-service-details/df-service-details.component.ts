import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';

import { ConfigSchema, ServiceType } from 'src/app/shared/types/service';
import {
  camelToSnakeString,
  snakeToCamelString,
} from 'src/app/shared/utilities/case';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  CACHE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { Service } from 'src/app/shared/types/files';
import { AceEditorMode } from 'src/app/shared/types/scripts';
import { DfScriptEditorComponent } from 'src/app/shared/components/df-script-editor/df-script-editor.component';
import { DfFileGithubComponent } from 'src/app/shared/components/df-file-github/df-file-github.component';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { map, switchMap } from 'rxjs';
import {
  GOLD_SERVICES,
  SILVER_SERVICES,
} from 'src/app/shared/constants/services';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { readAsText } from '../../shared/utilities/file';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

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
    DfAceEditorComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatButtonModule,
    DfScriptEditorComponent,
    DfFileGithubComponent,
    DfPaywallComponent,
    MatStepperModule,
    CommonModule,
    MatIconModule,
    MatButtonToggleModule,
  ],
})
export class DfServiceDetailsComponent implements OnInit {
  edit = false;
  isDatabase = false;
  isNetworkService = false;
  isScriptService = false;
  isFile = false;
  serviceTypes: Array<ServiceType>;
  notIncludedServices: Array<ServiceType>;
  serviceForm: FormGroup;
  faCircleInfo = faCircleInfo;
  serviceData: Service;
  configSchema: Array<ConfigSchema>;
  images: Array<ImageObject>;
  search = '';
  serviceDefinition: string;
  serviceDefinitionType: string;
  systemEvents: Array<{ label: string; value: string }>;
  content = '';
  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    private router: Router,
    private systemConfigDataService: DfSystemConfigDataService,
    private http: HttpClient,
    public dialog: MatDialog,
    private themeService: DfThemeService,
    private snackbarService: DfSnackbarService
  ) {
    this.serviceForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      label: [''],
      description: [''],
      isActive: [true],
      service_doc_by_service_id: this.fb.group({
        format: [],
        content: [''],
      }),
    });
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.edit = true;
    }
  }
  isDarkMode = this.themeService.darkMode$;
  ngOnInit(): void {
    this.http
      .get<Array<ImageObject>>('assets/img/databaseImages.json')
      .subscribe(images => {
        this.images = images;
      });
    this.systemConfigDataService.environment$
      .pipe(
        switchMap(env =>
          this.activatedRoute.data.pipe(map(route => ({ env, route })))
        )
      )
      .subscribe(({ env, route }) => {
        if (route['groups'] && route['groups'][0] === 'Database') {
          this.isDatabase = true;
        }
        if (route['groups'] && route['groups'][0] === 'Remote Service') {
          this.isNetworkService = true;
        }
        if (route['groups'] && route['groups'][0] === 'Script') {
          this.isScriptService = true;
        }
        if (route['groups'] && route['groups'][0] === 'File') {
          this.isFile = true;
        }
        const { data, serviceTypes, groups } = route;
        const licenseType = env.platform?.license;
        this.serviceTypes = serviceTypes.filter(
          (s: { name: string }) => s.name.toLowerCase() !== 'python'
        );
        this.notIncludedServices = [];
        if (data && (data.label || data.name)) {
          this.snackbarService.setSnackbarLastEle(
            data.label ? data.label : data.name,
            false
          );
        } else {
          this.snackbarService.setSnackbarLastEle('Unknown label', false);
        }
        if (this.isDatabase) {
          if (licenseType === 'SILVER') {
            this.notIncludedServices.push(
              ...GOLD_SERVICES.map(s => {
                s.class = 'not-included';
                return s;
              }).filter(s => groups.includes(s.group))
            );
          }
          if (licenseType === 'OPEN SOURCE') {
            this.notIncludedServices.push(
              ...SILVER_SERVICES.map(s => {
                s.class = 'not-included';
                return s;
              }).filter(s => groups.includes(s.group)),
              ...GOLD_SERVICES.map(s => {
                s.class = 'not-included';
                return s;
              }).filter(s => groups.includes(s.group))
            );
          }
        } else {
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
        }
        if (data?.serviceDocByServiceId) {
          data.config.serviceDefinition = data?.serviceDocByServiceId.content;
        }
        this.serviceData = data;
        if (data) {
          this.content = data.config.serviceDefinition;
        } else {
          this.content = '';
        }
        if (this.edit) {
          this.configSchema = this.getConfigSchema(data.type);
          this.initializeConfig('');
          this.serviceForm.patchValue({
            ...data,
            config: data.config,
          });
          if (data?.serviceDocByServiceId) {
            this.serviceDefinitionType =
              '' + data?.serviceDocByServiceId.format;
          }
          this.serviceForm.controls['type'].disable();
        } else {
          this.serviceForm.controls['type'].valueChanges.subscribe(value => {
            this.serviceForm.removeControl('config');
            this.configSchema = this.getConfigSchema(value);
            this.initializeConfig(value);
          });
        }
      });
    if (this.isDatabase) {
      this.serviceForm.controls['type'].valueChanges.subscribe(value => {
        this.serviceForm.patchValue({
          label: value,
        });
      });
    }
  }

  initializeConfig(value: string) {
    if (this.configSchema && this.configSchema.length > 0) {
      const config = this.fb.group({});
      this.configSchema.forEach(control => {
        const validator = [];
        if (control.required) {
          validator.push(Validators.required);
        }
        config?.addControl(
          control.name,
          new FormControl(control.default, validator)
        );
      });
      if (this.isFile && value === 'local_file') {
        config?.addControl('excelContent', new FormControl(''));
      }
      const contentConfigControl = this.configSchema.filter(
        control => control.name === 'content'
      )?.[0];
      if (contentConfigControl) {
        const validator = [];
        if (contentConfigControl.required) {
          validator.push(Validators.required);
        }
        config?.addControl(
          'serviceDefinition',
          new FormControl(contentConfigControl.default, validator)
        );
      }
      if (this.isNetworkService) {
        this.serviceForm.addControl('type', new FormControl(''));
        config.addControl('content', new FormControl(''));
      }
      this.serviceForm?.addControl('config', config);
    }
  }

  get subscriptionRequired() {
    return (
      this.serviceForm.controls['type'].value && this.configSchema?.length === 0
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

  excelUpload(event: Event) {
    const config = this.serviceForm.get('config');
    const input = event.target as HTMLInputElement;
    if (input.files) {
      if (config && config.get('excelContent')) {
        readAsText(input.files[0]).subscribe(value => {
          const excelContentControl = config.get('excelContent');
          if (excelContentControl) {
            excelContentControl.setValue(value);
          }
        });
      }
    }
  }

  getConfigSchema(type: string) {
    return (
      this.serviceTypes
        .find(serviceType => serviceType.name === type)
        ?.configSchema.map(control => {
          const items =
            control.type === 'array' && Array.isArray(control.items)
              ? control.items.map((each: ConfigSchema) => ({
                  ...each,
                  name: snakeToCamelString(each.name),
                }))
              : control.items;

          return {
            ...control,
            name: snakeToCamelString(control.name),
            items: items,
          };
        }) ?? []
    );
  }

  get viewSchema() {
    const result = this.configSchema?.filter(
      control => !['storageServiceId', 'storagePath'].includes(control.name)
    );
    return result;
  }

  getConfigControl(name: string) {
    return this.serviceForm.get(`config.${name}`) as FormControl;
  }

  getServiceDefinitionControl() {
    return this.serviceForm.get('serviceDefinition') as FormControl;
  }

  getControl(name: string) {
    return this.serviceForm.controls[name] as FormControl;
  }

  save(Cache: boolean, Continue: boolean) {
    const data = this.serviceForm.getRawValue();
    if (data.type === '' || data.name === '') {
      return;
    }
    type Params = {
      snackbarError?: string;
      snackbarSuccess?: string;
      fields?: string;
      related?: string;
    };

    let params: Params = {
      snackbarError: 'server',
      snackbarSuccess: 'services.createSuccessMsg',
    };
    if (this.isNetworkService) {
      params = {
        ...params,
        fields: '*',
        related: 'service_doc_by_service_id',
      };
      // if (!data.config.serviceDefinition) {
      //   data.service_doc_by_service_id = null;
      // } else {
      data.service_doc_by_service_id.content = data.config.content;
      data.service_doc_by_service_id.format = Number(
        this.serviceDefinitionType
      );
      // }
    } else if (this.isScriptService) {
      params = {
        ...params,
        fields: '*',
        related: 'service_doc_by_service_id',
      };
      // data.service_doc_by_service_id = null;
      // data.config.content = this.serviceDefinition;
      if (!data.config) {
        data.service_doc_by_service_id = null;
      } else {
        data.service_doc_by_service_id.content = data.config.serviceDefinition;
        data.service_doc_by_service_id.format = Number(
          this.serviceDefinitionType
        );
        delete data.config.serviceDefinition;
      }
    } else {
      delete data.service_doc_by_service_id;
    }

    let payload;
    if (data.type.toLowerCase().includes('saml')) {
      params = {
        ...params,
        fields: '*',
        related: 'service_doc_by_service_id',
      };
      data.service_doc_by_service_id = null;
      payload = {
        ...data,
        is_active: data.isActive,
        id: this.edit ? this.serviceData.id : null,
        config: {
          sp_nameIDFormat: data.config.spNameIDFormat,
          default_role: data.config.defaultRole,
          sp_x509cert: data.config.spX509cert,
          sp_privateKey: data.config.spPrivateKey,
          idp_entityId: data.config.idpEntityId,
          idp_singleSignOnService_url: data.config.idpSingleSignOnServiceUrl,
          idp_x509cert: data.config.idpX509cert,
          relay_state: data.config.relayState,
        },
      };
      if (data.config.appRoleMap) {
        payload.config.app_role_map = data.config.appRoleMap.map(
          (item: any) => {
            return Object.keys(item).reduce(
              (acc, cur) =>
                (acc = { ...acc, [camelToSnakeString(cur)]: item[cur] }),
              {}
            );
          }
        );
      }
      if (data.config.iconClass) {
        payload.config.icon_class = data.config.iconClass;
      }
      delete payload.isActive;
    } else {
      data.service_doc_by_service_id = null;
      payload = {
        ...data,
        id: this.edit ? this.serviceData.id : null,
      };
      payload = { ...data };
    }
    if (this.edit) {
      const payload = {
        ...this.serviceData,
        ...data,
        config: {
          ...(this.serviceData.config || {}),
          ...data.config,
        },
        service_doc_by_service_id: data.service_doc_by_service_id
          ? {
              ...(this.serviceData.serviceDocByServiceId || {}),
              ...data.service_doc_by_service_id,
            }
          : null,
      };
      delete payload.config.serviceDefinition;
      this.servicesService
        .update(this.serviceData.id, payload, {
          snackbarError: 'server',
          snackbarSuccess: 'services.updateSuccessMsg',
        })
        .subscribe(() => {
          if (Cache) {
            this.cacheService
              .delete(payload.name, {
                snackbarSuccess: 'cache.serviceCacheFlushed',
              })
              .subscribe({
                next: () => {
                  if (!Continue) {
                    this.router.navigate(['../'], {
                      relativeTo: this.activatedRoute,
                    });
                  }
                },
                error: (err: any) => console.error('Error flushing cache', err),
              });
          }
        });
    } else {
      this.servicesService
        .create(
          {
            resource: [payload],
          },
          params
        )
        .subscribe(() => {
          this.router.navigate([`/api-connections/api-docs/${data.name}`]);
          // this.router.navigate(['../'], { relativeTo: this.activatedRoute });
        });
    }
  }

  gotoSchema() {
    const data = this.serviceForm.getRawValue();
    this.router.navigate([`/admin-settings/schema/${data.name}`]);
  }

  gotoAPIDocs() {
    const data = this.serviceForm.getRawValue();
    this.router.navigate([`/api-connections/api-docs/${data.name}`]);
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  getBackgroundImage(typeLabel: string) {
    const image = this.images?.find(img => img.label == typeLabel);
    if (!image) {
      return '';
    }
    return image ? image.src : '';
  }

  get filteredServiceTypes() {
    return this.serviceTypes.filter(
      type =>
        type.label.toLowerCase().includes(this.search.toLowerCase()) ||
        type.name.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  nextStep(stepper: MatStepper) {
    stepper.next();
  }

  openDialog() {
    const dialogRef = this.dialog.open(DfPaywallModal);
    dialogRef.afterClosed().subscribe();
  }

  onServiceDefinitionTypeChange(value: string) {
    this.serviceDefinitionType = value;
  }
}
interface ImageObject {
  alt: string;
  src: string;
  label: string;
}

@Component({
  selector: 'df-paywall-modal',
  templateUrl: 'df-paywall-modal.html',
  styleUrls: ['./df-service-details.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    DfPaywallComponent,
    TranslocoPipe,
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class DfPaywallModal {
  @ViewChild('calendlyWidget') calendlyWidget: ElementRef;

  ngAfterViewInit(): void {
    (window as any)['Calendly'].initInlineWidget({
      url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
      parentElement: this.calendlyWidget.nativeElement,
      autoLoad: false,
    });
  }
}
