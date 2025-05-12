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
import {
  map,
  switchMap,
  catchError,
  mergeMap,
  of,
  throwError,
  tap,
} from 'rxjs';
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
import {
  MatButtonToggleModule,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { readAsText } from '../../shared/utilities/file';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DfCurrentServiceService } from 'src/app/shared/services/df-current-service.service';
import {
  MatStep,
  MatStepper,
  MatStepperModule,
} from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { TitleCasePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { DfSystemService } from 'src/app/shared/services/df-system.service';

// Add this interface before the @Component decorator
interface ComponentOption {
  label: string;
  value: string;
  selected: boolean;
}

// Add these interfaces at the bottom of the file with the other interfaces
interface RoleResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

interface AppResponse {
  resource: Array<{
    id: number;
    name: string;
    api_key: string;
    [key: string]: any;
  }>;
}

interface CategorizedField {
  basic: ConfigSchema[];
  advanced: ConfigSchema[];
}

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
    MatRadioModule,
    MatCardModule,
    TitleCasePipe,
    MatDividerModule,
  ],
})
export class DfServiceDetailsComponent implements OnInit {
  edit = false;
  isDatabase = false;
  isNetworkService = false;
  isScriptService = false;
  isFile = false;
  isAuth = false;
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
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('accessLevelGroup') accessLevelGroup!: MatButtonToggleGroup;
  showSecurityConfig = false;
  selectedAccessType: string = '';
  selectedComponent: string = '';
  selectedAccessLevel: string = '';
  showComponentSelection = false;
  componentList: ComponentOption[] = [];
  componentSearch = '';
  selectedComponents: ComponentOption[] = [];
  currentServiceId: number | null = null;
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
    private snackbarService: DfSnackbarService,
    private currentServiceService: DfCurrentServiceService,
    private snackBar: MatSnackBar,
    private systemService: DfSystemService
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
        if (route['groups'] && route['groups'][0] === 'LDAP') {
          this.isAuth = true;
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
          this.getServiceDocByServiceIdControl('content').setValue(
            data?.serviceDocByServiceId.content
          );
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
            this.getConfigControl('serviceDefinition').setValue(
              data.config.content
            );
          }
          if (!this.isAuth) {
            this.getConfigControl('serviceDefinition').setValue(
              data.config.content
            );
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
      this.serviceForm.addControl('config', config);
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
    if (type === 'python') {
      return AceEditorMode.PYTHON;
    }
    if (type === 'python3') {
      return AceEditorMode.PYTHON3;
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

    return result || [];
  }

  get hasStandardFields(): boolean {
    if (!this.isDatabase || !this.viewSchema) {
      return false;
    }

    const standardFieldNames = [
      'host',
      'port',
      'database',
      'username',
      'password',
    ];
    const fieldNames = this.viewSchema.map(field => field.name.toLowerCase());

    // Check if at least 3 of the standard fields exist
    const matchingFields = standardFieldNames.filter(name =>
      fieldNames.includes(name)
    );
    return matchingFields.length >= 3;
  }

  get basicFields() {
    if (!this.isDatabase || !this.viewSchema) {
      return [];
    }

    if (!this.hasStandardFields) {
      // If not standard fields, return all fields as basic
      return this.viewSchema;
    }

    const basicFieldNames = [
      'host',
      'port',
      'database',
      'username',
      'password',
    ];
    return this.viewSchema.filter(field =>
      basicFieldNames.includes(field.name.toLowerCase())
    );
  }

  get advancedFields() {
    if (!this.isDatabase || !this.viewSchema) {
      return [];
    }

    if (!this.hasStandardFields) {
      return [];
    }

    const basicFieldNames = [
      'host',
      'port',
      'database',
      'username',
      'password',
    ];
    return this.viewSchema.filter(
      field => !basicFieldNames.includes(field.name.toLowerCase())
    );
  }

  get showAdvancedOptions(): boolean {
    return (
      this.isDatabase &&
      this.hasStandardFields &&
      this.advancedFields.length > 0
    );
  }

  getConfigControl(name: string) {
    return this.serviceForm.get(`config.${name}`) as FormControl;
  }

  getServiceDocByServiceIdControl(name: string) {
    return this.serviceForm.get(
      `service_doc_by_service_id.${name}`
    ) as FormControl;
  }

  getServiceDefinitionControl() {
    return this.serviceForm.get('serviceDefinition') as FormControl;
  }

  getControl(name: string) {
    return this.serviceForm.controls[name] as FormControl;
  }
  warnings: string[] = [];

  save(Cache: boolean, Continue: boolean) {
    const data = this.serviceForm.getRawValue();
    if (data.type === '' || data.name === '') {
      return;
    }
    if (!this.validateServiceName(data.name)) {
      console.warn(this.warnings);
    }

    const formattedName = this.formatServiceName(data.name);
    this.serviceForm.patchValue({ name: formattedName });
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
        data.config.content = data.config.serviceDefinition;
        if (data.service_doc_by_service_id.content === '') {
          data.service_doc_by_service_id = null;
        } else {
          data.service_doc_by_service_id.format = this.serviceDefinitionType
            ? Number(this.serviceDefinitionType)
            : 0;
        }
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
      // data.service_doc_by_service_id = null;
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
      // data.service_doc_by_service_id = null;
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
          if (data.type.toLowerCase().includes('saml')) {
            this.router.navigate(['../'], { relativeTo: this.activatedRoute });
          } else {
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
                  error: (err: any) =>
                    console.error('Error flushing cache', err),
                });
            }
          }
        });
    } else {
      this.servicesService
        .create<ServiceResponse>(
          {
            resource: [payload],
          },
          params
        )
        .pipe(
          // After creating the service, test the connection for database services
          switchMap((response: ServiceResponse) => {
            if (this.isDatabase) {
              // Test database connection by requesting schema
              return this.http.get(`${BASE_URL}/${formattedName}/_table`).pipe(
                map(() => response), // If successful, pass through the original response
                catchError(error => {
                  // If connection fails, delete the service and show error
                  return this.servicesService
                    .delete(response.resource[0].id)
                    .pipe(
                      mergeMap(() => {
                        return throwError(
                          () =>
                            new Error(
                              'Database connection failed. Please check your connection details.'
                            )
                        );
                      })
                    );
                })
              );
            }
            return of(response);
          })
        )
        .subscribe({
          next: () => {
            if (data.type.toLowerCase().includes('saml')) {
              this.router.navigate(['../'], {
                relativeTo: this.activatedRoute,
              });
            } else {
              this.router.navigate([
                `/api-connections/api-docs/${formattedName}`,
              ]);
            }
          },
          error: error => {
            // Use openSnackBar instead of error
            this.snackbarService.openSnackBar(
              error.message || 'Failed to create service',
              'error'
            );
          },
        });
    }
  }

  validateServiceName(name: string): boolean {
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(name)) {
      this.warnings.push(
        'Service name can only contain letters, numbers, underscores, and hyphens.'
      );
      return false;
    }
    return true;
  }

  formatServiceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_-]/g, '');
  }

  gotoSchema() {
    const data = this.serviceForm.getRawValue();
    this.router.navigate([`/admin-settings/schema/${data.name}`]);
  }

  gotoAPIDocs() {
    const data = this.serviceForm.getRawValue();
    this.currentServiceService.setCurrentServiceId(this.serviceData.id);
    const formattedName = this.formatServiceName(data.name);
    this.router.navigate([`/api-connections/api-docs/${formattedName}`]);
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

  onAccessTypeChange(event: any) {
    this.selectedComponent = '';
    this.showComponentSelection = this.selectedAccessType !== 'all';
    // Here you would typically load the appropriate components
    // This is just example data
    this.componentList = [
      { label: 'Component 1', value: 'comp1', selected: false },
      { label: 'Component 2', value: 'comp2', selected: false },
      { label: 'Component 3', value: 'comp3', selected: false },
    ];
  }

  onComponentSelect(component: any) {
    // If component is a string (from dropdown/select)
    if (typeof component === 'string') {
      this.selectedComponent = component;
      this.componentList.forEach(c => (c.selected = c.value === component));
    }
    // If component is an object (from card selection)
    else {
      this.selectedComponent = component.value;
      this.componentList.forEach(
        c => (c.selected = c.value === component.value)
      );
    }
  }

  isSecurityConfigValid(): boolean {
    const state = {
      accessType: this.selectedAccessType,
      accessLevel: this.selectedAccessLevel,
      component: this.selectedComponent,
    };

    if (this.selectedAccessType === 'all') {
      return (
        Boolean(this.selectedAccessLevel) && this.selectedComponent === '*'
      );
    }

    return (
      Boolean(this.selectedAccessType) &&
      Boolean(this.selectedComponent) &&
      Boolean(this.selectedAccessLevel) &&
      this.selectedComponent.includes('/*')
    ); // Ensure wildcard is present
  }

  selectAccessType(type: string) {
    this.selectedAccessType = type;
    this.selectedComponent = '';
    this.showComponentSelection = type !== 'all';

    if (type === 'all') {
      this.componentList = [];
      this.selectedComponent = '*'; // Set a default component for 'all' access
      this.selectedAccessLevel = 'full'; // Automatically set full access for 'all' type
      return;
    }

    const serviceName = this.serviceForm.get('name')?.value;
    switch (type) {
      case 'tables':
        this.selectedComponent = '_table/*';
        this.componentList = ['_table'].map(suffix => ({
          label: `${serviceName}${suffix}`,
          value: `${suffix}/*`,
          selected: true,
        }));
        break;
      case 'procedures':
        this.selectedComponent = '_proc/*';
        this.componentList = ['_proc'].map(suffix => ({
          label: `${serviceName}${suffix}`,
          value: `${suffix}/*`,
          selected: true,
        }));
        break;
      case 'functions':
        this.selectedComponent = '_func/*';
        this.componentList = ['_func'].map(suffix => ({
          label: `${serviceName}${suffix}`,
          value: `${suffix}/*`,
          selected: true,
        }));
        break;
      default:
        this.componentList = [];
    }
  }

  onAccessLevelChange(level: string) {
    this.selectedAccessLevel = level;
  }

  get filteredComponents() {
    return this.componentList.filter(comp =>
      comp.label.toLowerCase().includes(this.componentSearch.toLowerCase())
    );
  }

  isComponentSelected(component: any) {
    return component.selected;
  }

  onComponentSelectionChange(component: any) {
    if (component.selected) {
      this.selectedComponents.push(component);
    } else {
      this.selectedComponents = this.selectedComponents.filter(
        c => c.value !== component.value
      );
    }
  }

  navigateToRoles(event: Event) {
    event.preventDefault();
    // Navigate to roles tab
    this.router.navigate(['/roles'], {
      queryParams: {
        tab: 'access', // This assumes you have a tab parameter in your roles component
      },
    });
  }

  async goToSecurityConfig() {
    try {
      // Create the service first
      const data = this.serviceForm.getRawValue();
      const formattedName = this.formatServiceName(data.name);
      this.serviceForm.patchValue({ name: formattedName });

      // Create a clean payload without service_doc_by_service_id
      const payload = {
        ...data,
        config: {
          ...(data.config || {}),
        },
      };

      // Only add service_doc_by_service_id if it's a network or script service and has content
      if (this.isNetworkService && data.config?.content) {
        payload.service_doc_by_service_id = {
          content: data.config.content,
          format: this.serviceDefinitionType
            ? Number(this.serviceDefinitionType)
            : 0,
        };
      } else if (this.isScriptService && data.config?.serviceDefinition) {
        payload.service_doc_by_service_id = {
          content: data.config.serviceDefinition,
          format: this.serviceDefinitionType
            ? Number(this.serviceDefinitionType)
            : 0,
        };
      } else {
        payload.service_doc_by_service_id = null;
      }

      const serviceResponse = await this.servicesService
        .create<ServiceResponse>(
          {
            resource: [payload],
          },
          {
            snackbarError: 'server',
            snackbarSuccess: 'services.createSuccessMsg',
          }
        )
        .toPromise();

      if (!serviceResponse) {
        throw new Error('No response received from service creation');
      }

      // The response comes back with resource array containing the created service
      const createdService = (serviceResponse as ServiceResponse).resource[0];

      // Store the newly created service ID for role creation
      this.currentServiceId = createdService.id;

      // Show success message using DfSnackbarService
      this.snackbarService.openSnackBar(
        'Service successfully created',
        'success'
      );

      // Show security config section
      this.showSecurityConfig = true;

      // Move to security config step
      setTimeout(() => {
        this.stepper.selectedIndex = this.stepper.steps.length - 1;
      });
    } catch (error) {
      // Show error message using DfSnackbarService
      this.snackbarService.openSnackBar('Error creating service', 'error');
    }
  }

  saveSecurityConfig() {
    if (!this.isSecurityConfigValid()) {
      return;
    }

    if (!this.currentServiceId) {
      this.snackBar.open('No service ID found. Please try again.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const serviceName = this.serviceForm.get('name')?.value;
    const formattedName = this.formatServiceName(serviceName);
    const roleName = `${serviceName}_auto_role`;

    const rolePayload = {
      resource: [
        {
          name: roleName,
          description: `Auto-generated role for service ${serviceName}`,
          is_active: true,
          role_service_access_by_role_id: [
            {
              service_id: this.currentServiceId,
              component: this.selectedComponent,
              verb_mask: this.getAccessLevel(this.selectedAccessLevel),
              requestor_mask: 3,
              filters: [],
              filter_op: 'AND',
            },
          ],
          user_to_app_to_role_by_role_id: [],
        },
      ],
    };

    // Create role and chain with app creation using proper RxJS operators
    this.systemService
      .post('role', rolePayload)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        }),
        switchMap((roleResponse: any) => {
          if (!roleResponse?.resource?.[0]?.id) {
            return throwError(() => new Error('Invalid role response'));
          }
          const createdRoleId = roleResponse.resource[0].id;

          const appPayload = {
            resource: [
              {
                name: `${serviceName}_app`,
                description: `Auto-generated app for service ${serviceName}`,
                type: '0',
                role_id: createdRoleId,
                is_active: true,
                url: null,
                storage_service_id: null,
                storage_container: null,
                path: null,
              },
            ],
          };

          return this.systemService
            .post('app?fields=*&related=role_by_role_id', appPayload)
            .pipe(
              catchError(error => {
                this.snackBar.open(
                  `Error creating app: ${
                    error.error?.message || error.message || 'Unknown error'
                  }`,
                  'Close',
                  { duration: 5000 }
                );
                return throwError(() => error);
              }),
              map((appResponse: any) => {
                if (!appResponse?.resource?.[0]) {
                  throw new Error('App response missing resource array');
                }

                const app = appResponse.resource[0];

                if (!app.apiKey) {
                  throw new Error('App response missing apiKey');
                }

                return {
                  apiKey: app.apiKey,
                  formattedName: formattedName,
                };
              }),
              catchError(error => {
                return throwError(() => error);
              })
            );
        }),
        map((appResponse: any) => {
          if (!appResponse?.apiKey) {
            throw new Error('Invalid app response');
          }
          return {
            apiKey: appResponse.apiKey,
            formattedName: formattedName,
          };
        })
      )
      .subscribe({
        next: result => {
          // Attempt to copy API key to clipboard
          if (navigator.clipboard) {
            navigator.clipboard
              .writeText(result.apiKey)
              .then(() => {
                this.snackbarService.openSnackBar(
                  'API Created and API Key copied to clipboard',
                  'success'
                );
              })
              .catch(() => {
                this.snackbarService.openSnackBar(
                  'API Created, but failed to copy API Key',
                  'success'
                );
              });
          } else {
            this.snackbarService.openSnackBar(
              'API Created, but failed to copy API Key',
              'success'
            );
          }

          // Navigate to API docs
          this.router
            .navigateByUrl(
              `/api-connections/api-docs/${result.formattedName}`,
              {
                replaceUrl: true,
              }
            )
            .then(success => {
              if (!success) {
                this.router.navigate(
                  ['api-connections', 'api-docs', result.formattedName],
                  {
                    replaceUrl: true,
                  }
                );
              }
            });
        },
        error: error => {
          // Show error message using DfSnackbarService
          this.snackbarService.openSnackBar(
            'Error saving security configuration',
            'error'
          );
        },
      });
  }

  private getAccessLevel(level: string): number {
    switch (level) {
      case 'read':
        return 1; // GET
      case 'write':
        return 7; // GET (1) + POST (2) + PUT/PATCH (4) = 7
      case 'full':
        return 15; // All permissions (GET + POST + PUT + DELETE)
      default:
        return 0;
    }
  }

  onAccessLevelSelect(level: string) {
    this.selectedAccessLevel = level;
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

interface ServiceResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}
