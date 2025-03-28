import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPayload, AppType } from '../../shared/types/apps';
import { APP_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';

import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  faCircleInfo,
  faCopy,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { generateApiKey } from 'src/app/shared/utilities/hash';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { catchError, throwError } from 'rxjs';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfAlertComponent } from 'src/app/shared/components/df-alert/df-alert.component';
import { RoleType } from 'src/app/shared/types/role';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-app-details',
  templateUrl: './df-app-details.component.html',
  styleUrls: ['./df-app-details.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatAutocompleteModule,
    NgFor,
    MatOptionModule,
    MatSlideToggleModule,
    MatCardModule,
    MatButtonModule,
    FontAwesomeModule,
    MatRadioModule,
    MatSelectModule,
    TranslocoPipe,
    MatTooltipModule,
    DfAlertComponent,
    AsyncPipe,
  ],
})
export class DfAppDetailsComponent implements OnInit {
  @ViewChild('rolesInput') rolesInput: ElementRef<HTMLInputElement>;
  appForm: FormGroup;
  roles: RoleType[] = [];
  filteredRoles: RoleType[] = [];
  editApp: AppType;
  urlOrigin: string;
  faCopy = faCopy;
  faCircleInfo = faCircleInfo;
  faRefresh = faRefresh;
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';

  constructor(
    private fb: FormBuilder,
    @Inject(APP_SERVICE_TOKEN)
    private appsService: DfBaseCrudService,
    private systemConfigDataService: DfSystemConfigDataService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private themeService: DfThemeService,
    private snackbarService: DfSnackbarService
  ) {
    this.urlOrigin = window.location.origin;

    this.appForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      defaultRole: [null],
      active: [false],
      appLocation: ['0'], // "type" property
      storageServiceId: [3], // type 2
      storageContainer: ['applications'], // type 2
      path: [''], // type 1, 2,
      url: [''], // type 2
    });
  }
  isDarkMode = this.themeService.darkMode$;
  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ roles, appData }) => {
      this.roles = roles.resource || [];
      this.filteredRoles = roles.resource || [];
      this.editApp = appData || null;
    });
    this.snackbarService.setSnackbarLastEle(this.editApp.name, true);
    if (this.editApp) {
      this.appForm.patchValue({
        name: this.editApp.name,
        description: this.editApp.description,
        defaultRole: this.editApp.roleByRoleId,
        active: this.editApp.isActive,
        appLocation: `${this.editApp.type}`,
        storageServiceId: this.editApp.storageServiceId,
        storageContainer: this.editApp.storageContainer,
        path: this.editApp.path,
        url: this.editApp.url,
      });
    }

    this.appForm.controls['appLocation'].valueChanges.subscribe(value => {
      const pathControl = this.appForm.get('path');
      const urlControl = this.appForm.get('url');

      if (value === '2') {
        pathControl?.clearValidators();
        urlControl?.setValidators([Validators.required]);
      } else if (value === '3') {
        pathControl?.setValidators([Validators.required]);
        urlControl?.clearValidators();
      }

      pathControl?.updateValueAndValidity();
      urlControl?.updateValueAndValidity();
    });

    this.appForm.controls['storageServiceId'].updateValueAndValidity();
  }

  filter(): void {
    const filterValue = this.rolesInput.nativeElement.value.toLowerCase();
    this.filteredRoles = this.roles.filter(o =>
      o.name.toLowerCase().includes(filterValue)
    );
  }

  displayFn(role: RoleType): string {
    return role && role.name ? role.name : '';
  }

  getAppLocationUrl(): string {
    return `${this.urlOrigin}/
    ${
      this.appForm.value.appLocation === '1' &&
      this.appForm.value.storageServiceId === 3
        ? 'file/'
        : ''
    }
    ${
      this.appForm.value.appLocation === '1' &&
      this.appForm.value.storageServiceId === 4
        ? 'log/'
        : ''
    }
    ${
      this.appForm.value.appLocation === '1'
        ? this.appForm.value.storageContainer + '/'
        : ''
    }
    ${this.appForm.value.path}`.replaceAll(/\s/g, '');
  }

  copyApiKey() {
    navigator.clipboard
      .writeText(this.editApp.apiKey)
      .then()
      .catch(error => console.error(error));
  }

  copyAppUrl() {
    const url = this.getAppLocationUrl();
    navigator.clipboard
      .writeText(url)
      .then()
      .catch(error => console.error(error));
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  save() {
    if (this.appForm.invalid) {
      return;
    }
    const payload: AppPayload = {
      name: this.appForm.value.name,
      description: this.appForm.value.description,
      type: this.appForm.value.appLocation,
      role_id: this.appForm.value.defaultRole
        ? this.appForm.value.defaultRole.id
        : null,
      is_active: this.appForm.value.active,
      url:
        this.appForm.value.appLocation === '2' ? this.appForm.value.url : null,
      storage_service_id:
        this.appForm.value.appLocation === '1'
          ? this.appForm.value.storageServiceId
          : null,
      storage_container:
        this.appForm.value.appLocation === '1'
          ? this.appForm.value.storageContainer
          : null,
      path:
        this.appForm.value.appLocation === '1' ||
        this.appForm.value.appLocation === '3'
          ? this.appForm.value.path
          : null,
    };
    if (this.editApp) {
      this.appsService
        .update(this.editApp.id, payload, {
          snackbarSuccess: 'apps.updateSuccess',
        })
        .pipe(
          catchError(err => {
            this.triggerAlert('error', err.error.error.message);
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.goBack();
        });
    } else {
      this.appsService
        .create(
          { resource: [payload] },
          {
            snackbarSuccess: 'apps.createSuccess',
            fields: '*',
            related: 'role_by_role_id',
          }
        )
        .pipe(
          catchError(err => {
            this.triggerAlert(
              'error',
              err.error.error.context.resource[0].message
            );
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.goBack();
        });
    }
  }

  get disableKeyRefresh(): boolean {
    return this.editApp.createdById === null;
  }

  async refreshApiKey() {
    const newKey = await generateApiKey(
      this.systemConfigDataService.environment.server.host,
      this.appForm.getRawValue().name
    );
    this.appsService
      .update(this.editApp.id, { apiKey: newKey })
      .subscribe(() => (this.editApp.apiKey = newKey));
  }
}
