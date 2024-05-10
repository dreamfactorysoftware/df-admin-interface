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
  notIncludedServices: Array<ServiceType>;
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
    private systemConfigDataService: DfSystemConfigDataService,
    private http: HttpClient,
    public dialog: MatDialog,
    private themeService: DfThemeService
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
        const { data, serviceTypes, groups } = route;
        const licenseType = env.platform?.license;
        this.serviceTypes = serviceTypes;
        this.notIncludedServices = [];
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
          this.router.navigate([`/api-connections/api-docs/${data.name}`]);
        });
    }
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

  openDialog() {
    const dialogRef = this.dialog.open(DfPaywallModal);
    dialogRef.afterClosed().subscribe();
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
