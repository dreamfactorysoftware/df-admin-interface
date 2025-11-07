import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  Input,
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
import { DfSecurityConfigComponent } from 'src/app/shared/components/df-security-config/df-security-config.component';

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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { DfPaywallModal } from 'src/app/shared/components/df-paywall-modal/df-paywall-modal.component';
import { DfAnalyticsService } from 'src/app/shared/services/df-analytics.service';
import { DfSnowflakeOAuthComponent } from 'src/app/shared/components/df-snowflake-oauth/df-snowflake-oauth.component';

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

interface ServiceResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
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
    DfSecurityConfigComponent,
    DfSnowflakeOAuthComponent,
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
  selectedServiceTypeLable: string;
  configSchema: Array<ConfigSchema>;
  images: Array<ImageObject>;
  search = '';
  serviceDefinition: string;
  serviceDefinitionType: string;
  systemEvents: Array<{ label: string; value: string }>;
  content = '';
  @ViewChild('stepper') stepper!: MatStepper;
  showSecurityConfig = false;
  currentServiceId: number | null = null;
  isFirstTimeUser = false;
  availableFileServices: any[] = [];

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
    private systemService: DfSystemService,
    private analyticsService: DfAnalyticsService
  ) {
    this.serviceForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      label: [''],
      description: [''],
      isActive: [true],
      storageServiceId: [null], // Add storage service ID field for Excel services
      service_doc_by_service_id: this.fb.group({
        format: [0],
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
    // Check if this is the user's first API (only for new service creation, not editing)
    if (!this.edit) {
      this.analyticsService.getDashboardStats().subscribe(stats => {
        this.isFirstTimeUser = stats.services.total === 0;
      });
    }

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
          // For network services, keep the old behavior
          if (this.isNetworkService) {
            data.config.serviceDefinition = data?.serviceDocByServiceId.content;
            // Set the service doc content in the dedicated field
            this.getServiceDocByServiceIdControl('content').setValue(
              data?.serviceDocByServiceId.content
            );
          }
          // For script services, handle migration of old data structure
          else if (this.isScriptService) {
            // Ensure config object exists
            if (!data.config) {
              data.config = {};
            }

            // Helper function to detect if content is likely an OpenAPI/Swagger spec
            const isLikelyOpenApiSpec = (content: string): boolean => {
              if (!content) return false;
              const trimmed = content.trim();

              // Check for common OpenAPI/Swagger patterns
              const openApiPatterns = [
                /^\s*\{?\s*["']?openapi["']?\s*:/i, // JSON or YAML openapi field
                /^\s*\{?\s*["']?swagger["']?\s*:/i, // JSON or YAML swagger field
                /^\s*openapi\s*:/im, // YAML format
                /^\s*swagger\s*:/im, // YAML format
                /["']paths["']\s*:\s*\{/i, // JSON paths object
                /^\s*paths\s*:/im, // YAML paths
              ];

              return openApiPatterns.some(pattern => pattern.test(trimmed));
            };

            // Check if this is an old script service with content in the wrong place
            // Old structure: script content was in serviceDocByServiceId.content
            // New structure: script content should be in config.content, OpenAPI spec (if any) in serviceDocByServiceId.content
            if (!data.config.content || data.config.content.trim() === '') {
              // No script content in config, check if it's in serviceDocByServiceId
              if (data.serviceDocByServiceId?.content) {
                // Determine if this is script content or an OpenAPI spec
                if (isLikelyOpenApiSpec(data.serviceDocByServiceId.content)) {
                  // This is an OpenAPI spec - leave it in the OpenAPI field
                  this.getServiceDocByServiceIdControl('content').setValue(
                    data.serviceDocByServiceId.content
                  );
                } else {
                  // This is likely script content - migrate it
                  data.config.content = data.serviceDocByServiceId.content;
                  // Clear the OpenAPI field since this was script content
                  this.getServiceDocByServiceIdControl('content').setValue('');
                }
              }
            } else {
              // Script content exists in config.content (correct location)
              // serviceDocByServiceId.content (if present) is an actual OpenAPI spec
              this.getServiceDocByServiceIdControl('content').setValue(
                data?.serviceDocByServiceId.content || ''
              );
            }
          } else {
            // For other service types, just set the service doc content
            this.getServiceDocByServiceIdControl('content').setValue(
              data?.serviceDocByServiceId.content
            );
          }
        }
        this.serviceData = data;
        if (data) {
          // For script services, use script content, not service definition
          if (this.isScriptService) {
            this.content = data.config.content || '';
          } else {
            this.content = data.config.serviceDefinition || '';
          }
        } else {
          this.content = '';
        }
        if (this.edit) {
          this.configSchema = this.getConfigSchema(data.type);
          this.initializeConfig('');

          // For Excel services, extract storage_service_id and load file services
          if (data.type === 'excel') {
            console.log('Editing Excel service, data:', data);
            console.log('Config:', data.config);
            console.log(
              'Storage service ID from config:',
              data.config?.storageServiceId
            );

            // Extract storageServiceId from config
            const storageServiceId = data.config?.storageServiceId;

            // Load file services first, then set the form value when services are loaded
            this.loadAvailableFileServices(() => {
              console.log('File services loaded, now setting form value');
              if (storageServiceId) {
                console.log('Setting storageServiceId to:', storageServiceId);
                this.serviceForm.patchValue({
                  ...data,
                  config: data.config,
                  storageServiceId: storageServiceId,
                });
              } else {
                console.log('No storageServiceId found in config');
                this.serviceForm.patchValue({
                  ...data,
                  config: data.config,
                });
              }
            });
          } else {
            this.serviceForm.patchValue({
              ...data,
              config: data.config,
            });
          }
          if (data?.serviceDocByServiceId) {
            this.serviceDefinitionType =
              '' + data?.serviceDocByServiceId.format;

            // For network services, set the content field
            if (this.isNetworkService) {
              this.getConfigControl('content')?.setValue(
                data.serviceDocByServiceId.content
              );
              this.content = data.serviceDocByServiceId.content || '';
            }
            // For script services, keep script content separate from OpenAPI spec
            else if (this.isScriptService) {
              // Don't overwrite script content - OpenAPI spec is handled separately
              // The script content should remain in data.config.content
              // The OpenAPI spec is already set in getServiceDocByServiceIdControl above
            }
          }
          this.serviceForm.controls['type'].disable();
        } else {
          this.serviceForm.controls['type'].valueChanges.subscribe(value => {
            this.serviceForm.removeControl('config');
            this.configSchema = this.getConfigSchema(value);
            // Update service type flags based on selected type
            this.updateServiceTypeFlags(value);
            this.initializeConfig(value);

            // Load file services when Excel service type is selected
            if (value === 'excel') {
              this.loadAvailableFileServices();
            }
          });
        }

        // If editing an Excel service, load file services immediately
        if (this.edit && data?.type === 'excel') {
          this.loadAvailableFileServices();
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

  getStorageServiceDisplayName(): string {
    console.log('=== getStorageServiceDisplayName called ===');
    console.log('this.edit:', this.edit);
    console.log('this.serviceData:', this.serviceData);
    console.log('this.availableFileServices:', this.availableFileServices);

    // First try to get from the form
    let storageServiceId = this.serviceForm.get('storageServiceId')?.value;
    console.log('storageServiceId from form:', storageServiceId);

    // If not in form, try to get from service data (for editing)
    if (
      !storageServiceId &&
      this.edit &&
      this.serviceData?.config?.storageServiceId
    ) {
      storageServiceId = this.serviceData.config.storageServiceId;
      console.log(
        'storageServiceId from serviceData.config.storageServiceId:',
        storageServiceId
      );
    }

    // Debug: Let's see what's in the service data
    console.log('this.serviceData.config:', this.serviceData?.config);
    console.log(
      'this.serviceData.config?.storageServiceId:',
      this.serviceData?.config?.storageServiceId
    );

    if (!storageServiceId) {
      console.log('No storageServiceId found, returning default message');
      return 'No storage service selected';
    }

    const selectedService = this.availableFileServices.find(
      service => service.id === storageServiceId
    );
    console.log('selectedService found:', selectedService);

    if (selectedService) {
      const displayName = selectedService.label || selectedService.name;
      console.log('Returning display name:', displayName);
      return displayName;
    } else {
      console.log('Service not found in availableFileServices, returning ID');
      return `Service ID: ${storageServiceId}`;
    }
  }

  loadAvailableFileServices(callback?: () => void) {
    console.log('=== loadAvailableFileServices called ===');
    console.log(
      'Current service form type:',
      this.serviceForm.getRawValue().type
    );
    console.log(
      'Available file services before loading:',
      this.availableFileServices
    );

    // Try multiple authentication methods
    let authHeader = '';

    // Method 1: Check localStorage for API key
    const apiKey =
      localStorage.getItem('df_token') ||
      localStorage.getItem('X-DreamFactory-API-Key') ||
      sessionStorage.getItem('df_token');

    if (apiKey) {
      authHeader = `X-DreamFactory-API-Key: ${apiKey}`;
    } else {
      // Method 2: Try to get from cookies
      const cookies = document.cookie.split(';');
      let sessionToken = '';
      let apiKeyFromCookie = '';

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'df_session_token' || name === 'session_token') {
          sessionToken = value;
        }
        if (name === 'df_api_key' || name === 'api_key') {
          apiKeyFromCookie = value;
        }
      }

      if (sessionToken) {
        authHeader = `X-DreamFactory-Session-Token: ${sessionToken}`;
      } else if (apiKeyFromCookie) {
        authHeader = `X-DreamFactory-API-Key: ${apiKeyFromCookie}`;
      } else {
        // Method 3: Check if there's a global variable or service
        if ((window as any).dfAuthToken) {
          authHeader = `X-DreamFactory-API-Key: ${(window as any).dfAuthToken}`;
        } else if ((window as any).dreamFactoryToken) {
          authHeader = `X-DreamFactory-API-Key: ${
            (window as any).dreamFactoryToken
          }`;
        }
      }
    }

    if (!authHeader) {
      console.warn('No authentication method found, cannot load file services');
      this.availableFileServices = [];
      if (callback) callback();
      return;
    }

    // Get file services from the system
    const apiUrl = `${window.location.origin}/api/v2/system/service`;

    // Parse the auth header to get key and value
    const [headerName, headerValue] = authHeader.split(': ');
    const headers: any = {};
    if (headerName && headerValue) {
      headers[headerName] = headerValue;
    }

    this.http
      .get<any>(apiUrl, {
        params: {
          filter: 'type=local_file',
          fields: 'id,name,label,type',
        },
        headers: headers,
      })
      .subscribe({
        next: (response: any) => {
          if (response.resource && Array.isArray(response.resource)) {
            this.availableFileServices = response.resource;
            console.log(
              'File services loaded successfully:',
              this.availableFileServices
            );
          } else {
            console.warn(
              'No file services found in response or invalid format'
            );
            this.availableFileServices = [];
          }
          if (callback) callback();
        },
        error: error => {
          console.error('Failed to load file services:', error);

          // Fallback: try to get services without filter
          this.http
            .get<any>(apiUrl, {
              params: {
                fields: 'id,name,label,type',
              },
              headers: headers,
            })
            .subscribe({
              next: (fallbackResponse: any) => {
                if (
                  fallbackResponse.resource &&
                  Array.isArray(fallbackResponse.resource)
                ) {
                  // Filter for file-related services
                  const allServices = fallbackResponse.resource;

                  this.availableFileServices = allServices.filter(
                    (service: any) =>
                      service.type &&
                      (service.type === 'local_file' ||
                        service.type === 'file' ||
                        service.type.includes('file'))
                  );
                  console.log(
                    'File services loaded via fallback:',
                    this.availableFileServices
                  );
                } else {
                  this.availableFileServices = [];
                }
                if (callback) callback();
              },
              error: fallbackError => {
                console.error('Fallback also failed:', fallbackError);
                this.availableFileServices = [];
                if (callback) callback();
              },
            });
        },
      });
  }

  // Helper method for debugging (can be removed in production)
  logFormValues() {
    console.log('Form values:', this.serviceForm.value);
  }

  updateServiceTypeFlags(type: string) {
    // Reset all flags
    this.isNetworkService = false;
    this.isScriptService = false;
    this.isFile = false;

    // Find the service type to get its group
    const serviceType = this.serviceTypes.find(st => st.name === type);
    if (serviceType && serviceType.group) {
      const group = serviceType.group;
      if (group === 'Remote Service') {
        this.isNetworkService = true;
      } else if (group === 'Script') {
        this.isScriptService = true;
      } else if (group === 'File') {
        this.isFile = true;
      }
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
        // Initialize serviceDefinitionType for JSON/YAML toggle
        this.serviceDefinitionType = '0'; // Default to JSON
      }
      if (this.isScriptService) {
        // Ensure script services have content field for script content
        if (!config.get('content')) {
          config.addControl('content', new FormControl(''));
        }
        // Initialize serviceDefinitionType for JSON/YAML toggle
        this.serviceDefinitionType = '0'; // Default to JSON
      }
      this.serviceForm.addControl('config', config);
    }
  }

  get subscriptionRequired() {
    const serviceType = this.serviceForm.controls['type'].value;
    // Local email service is open source and should not require subscription
    if (serviceType === 'local_email') {
      return false;
    }
    return serviceType && this.configSchema?.length === 0;
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

  get serviceDefinitionMode(): AceEditorMode {
    return this.serviceDefinitionType === '0'
      ? AceEditorMode.JSON
      : AceEditorMode.YAML;
  }

  get excelMode(): AceEditorMode {
    return AceEditorMode.JSON;
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

  // Network service field categorization
  get networkRequiredFields() {
    if (!this.isNetworkService || !this.viewSchema) {
      return [];
    }

    // Base URL is the primary required field for network services
    const requiredFieldNames = ['baseUrl'];
    return this.viewSchema.filter(field =>
      requiredFieldNames.includes(field.name)
    );
  }

  get networkAdvancedFields() {
    if (!this.isNetworkService || !this.viewSchema) {
      return [];
    }

    // All other fields are considered advanced
    const requiredFieldNames = ['baseUrl'];
    return this.viewSchema.filter(
      field =>
        !requiredFieldNames.includes(field.name) && field.name !== 'content'
    );
  }

  get showNetworkAdvancedOptions(): boolean {
    return this.isNetworkService;
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

    // Initialize service_doc_by_service_id based on service type
    let serviceDoc = null;

    if (this.isNetworkService) {
      params = {
        ...params,
        fields: '*',
        related: 'service_doc_by_service_id',
      };
      // For network services (including RWS), use the content field
      if (data.config?.content) {
        serviceDoc = {
          content: data.config.content,
          format: this.serviceDefinitionType
            ? Number(this.serviceDefinitionType)
            : 0,
        };
        // Remove content from config as it's moved to service_doc_by_service_id
        delete data.config.content;
      }
    } else if (this.isScriptService) {
      params = {
        ...params,
        fields: '*',
        related: 'service_doc_by_service_id',
      };
      // For script services, check if there's an OpenAPI spec
      const openApiContent =
        this.getServiceDocByServiceIdControl('content')?.value;
      if (openApiContent && openApiContent.trim()) {
        serviceDoc = {
          content: openApiContent,
          format: this.serviceDefinitionType
            ? Number(this.serviceDefinitionType)
            : 0,
        };
      }
      // Keep script content in config.content - don't remove it
      // Script content and OpenAPI spec are separate concerns
    }

    // Apply service_doc_by_service_id to data
    data.service_doc_by_service_id = serviceDoc;
    let payload: any;
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
    } else if (data.type === 'excel') {
      // For Excel services, handle storage_service_id
      payload = {
        ...data,
        id: this.edit ? this.serviceData.id : null,
        config: {
          ...(data.config || {}),
          storage_service_id: data.storageServiceId,
        },
      };
      // Remove storageServiceId from root level as it's now in config
      delete payload.storageServiceId;
    } else {
      // For other service types, use the base data
      payload = {
        ...data,
        id: this.edit ? this.serviceData.id : null,
      };
    }
    if (this.edit) {
      let editPayload: any;

      if (data.type === 'excel') {
        // For Excel services, ensure storage_service_id is properly handled
        editPayload = {
          ...this.serviceData,
          ...data,
          config: {
            ...(this.serviceData.config || {}),
            ...data.config,
            storage_service_id: data.storageServiceId, // Ensure this is included
          },
          service_doc_by_service_id: data.service_doc_by_service_id
            ? {
                // Preserve the existing record's id for UPDATE operations
                id: this.serviceData.serviceDocByServiceId?.id,
                ...(this.serviceData.serviceDocByServiceId || {}),
                ...data.service_doc_by_service_id,
              }
            : null,
        };
        // Remove storageServiceId from root level as it's now in config
        delete editPayload.storageServiceId;
      } else {
        // For other service types, use the standard approach
        editPayload = {
          ...this.serviceData,
          ...data,
          config: {
            ...(this.serviceData.config || {}),
            ...data.config,
          },
          service_doc_by_service_id: data.service_doc_by_service_id
            ? {
                // Preserve the existing record's id for UPDATE operations
                id: this.serviceData.serviceDocByServiceId?.id,
                ...(this.serviceData.serviceDocByServiceId || {}),
                ...data.service_doc_by_service_id,
              }
            : null,
        };
      }

      // Only delete serviceDefinition for network services, not script services
      if (this.isNetworkService) {
        delete editPayload.config.serviceDefinition;
      }
      this.servicesService
        .update(this.serviceData.id, editPayload, {
          snackbarError: 'server',
          snackbarSuccess: 'services.updateSuccessMsg',
        })
        .subscribe(() => {
          if (data.type.toLowerCase().includes('saml')) {
            this.router.navigate(['../'], { relativeTo: this.activatedRoute });
          } else {
            if (Cache) {
              this.cacheService
                .delete(editPayload.name, {
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

  openDialog(serviceTypeName: string) {
    const dialogRef = this.dialog.open(DfPaywallModal, {
      data: { serviceName: serviceTypeName },
    });
    dialogRef.afterClosed().subscribe();
  }

  onServiceDefinitionTypeChange(value: string) {
    this.serviceDefinitionType = value;
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
        // Remove content from config as it's moved to service_doc_by_service_id
        delete payload.config.content;
      } else if (this.isScriptService) {
        const openApiContent =
          this.getServiceDocByServiceIdControl('content')?.value;
        if (openApiContent && openApiContent.trim()) {
          payload.service_doc_by_service_id = {
            content: openApiContent,
            format: this.serviceDefinitionType
              ? Number(this.serviceDefinitionType)
              : 0,
          };
        }
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

  getServiceTypeLabel(value: string): string {
    const selectedType = this.serviceTypes.find(type => type.name === value);
    return selectedType ? selectedType.label : value;
  }

  onServiceTypeSelect(selectedServiceTypeLable: string) {
    this.selectedServiceTypeLable =
      selectedServiceTypeLable || 'Unknown. Unable to identify Service Type';
  }
}
interface ImageObject {
  alt: string;
  src: string;
  label: string;
}
