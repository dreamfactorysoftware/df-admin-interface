import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AlertType } from '../df-alert/df-alert.component';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { ActivatedRoute } from '@angular/router';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { matchValidator } from '../../validators/match.validator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UserProfileType } from '../../types/user';
import { ROUTES } from 'src/app/shared/types/routes';
import { uniqueNameValidator } from '../../validators/unique-name.validator';
import { AppType } from 'src/app/shared/types/apps';
import { RoleType } from '../../types/role';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfPaywallService } from '../../services/df-paywall.service';
import { of, switchMap } from 'rxjs';
import { DfThemeService } from '../../services/df-theme.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-user-details',
  template: '',
})
export abstract class DfUserDetailsBaseComponent<T> implements OnInit {
  abstract userType: UserProfileType;
  userForm: FormGroup;
  currentProfile: T;
  loginAttribute = 'email';
  faEnvelope = faEnvelope;
  type = 'create';
  isSmallScreen = this.breakpointService.isSmallScreen;
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  apps: Array<AppType>;
  roles: Array<RoleType>;

  accessByTabs = [
    { control: 'apps' },
    { control: 'users' },
    { control: 'services' },
    { control: 'apidocs', label: 'api-docs' },
    { control: 'schema/data', label: 'schema' },
    { control: 'files' },
    { control: 'scripts' },
    { control: 'config' },
    { control: 'packages', label: 'package-manager' },
    { control: 'limits' },
    { control: 'scheduler' },
  ];

  constructor(
    private fb: FormBuilder,
    public activatedRoute: ActivatedRoute,
    private systemConfigDataService: DfSystemConfigDataService,
    private breakpointService: DfBreakpointService,
    private paywallService: DfPaywallService
  ) {
    this.userForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: ['', Validators.minLength(6)],
        email: ['', Validators.email],
        firstName: [''],
        lastName: [''],
        name: ['', Validators.required],
        phone: [''],
      }),
      isActive: [true],
      tabs: this.buildTabs(),
      lookupKeys: this.fb.array([], [uniqueNameValidator]),
      appRoles: this.fb.array([]),
    });
  }
  themeService = inject(DfThemeService);
  snackbarService = inject(DfSnackbarService);
  isDarkMode = this.themeService.darkMode$;

  get cancelRoute() {
    let route = `/${ROUTES.ADMIN_SETTINGS}/`;
    if (this.userType === 'admins') {
      route += ROUTES.ADMINS;
    }
    if (this.userType === 'users') {
      route += ROUTES.USERS;
    }
    return route;
  }

  abstract sendInvite(): void;
  abstract save(): void;

  ngOnInit(): void {
    this.paywallService
      .activatePaywall('limit')
      .pipe(
        switchMap(activate => {
          if (activate) {
            return this.paywallService.activatePaywall('service_report');
          }
          return of(false);
        })
      )
      .subscribe(activate => {
        if (activate) {
          this.accessByTabs = [];
        }
      });
    this.activatedRoute.data.subscribe(({ type, data, apps, roles }) => {
      this.snackbarService.setSnackbarLastEle(data.name, true);
      this.type = type;
      if (this.userType === 'users') {
        this.apps = apps.resource;
        this.roles = roles.resource;
      }
      if (type === 'edit') {
        this.currentProfile = data;
        this.userForm.patchValue({
          profileDetailsGroup: {
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
            phone: data.phone,
          },
          isActive: data.isActive,
        });
        this.userForm.addControl('setPassword', new FormControl(false));
        this.userForm.controls['setPassword'].valueChanges.subscribe(value => {
          if (value) {
            this.addPasswordControls();
          } else {
            this.removePasswordControls();
          }
        });
        if (this.userType === 'admins') {
          if (data.isRootAdmin) {
            this.userForm.removeControl('tabs');
          }
          if (data.userToAppToRoleByUserId.length > 0) {
            this.changeAllTabs(false);
            data.role.accessibleTabs.forEach((tab: string) => {
              const control = this.tabs.controls.find(
                c => c.value.name === tab
              );
              if (control) {
                control.patchValue({ checked: true });
              }
            });
          }
        }
        if (this.userType === 'users') {
          if (data.userToAppToRoleByUserId.length > 0) {
            data.userToAppToRoleByUserId.forEach((item: any) => {
              (this.userForm.controls['appRoles'] as FormArray).push(
                new FormGroup({
                  app: new FormControl(
                    this.apps.find(app => app.id === item.appId)?.name,
                    [Validators.required]
                  ),
                  role: new FormControl(
                    this.roles.find(role => role.id === item.roleId)?.name,
                    [Validators.required]
                  ),
                })
              );
            });
          }
        }
        if (data.lookupByUserId.length > 0) {
          data.lookupByUserId.forEach((item: any) => {
            (this.userForm.controls['lookupKeys'] as FormArray).push(
              new FormGroup({
                name: new FormControl(item.name, [Validators.required]),
                value: new FormControl(item.value),
                private: new FormControl(item.private),
                id: new FormControl(item.id),
              })
            );
          });
        }
      } else {
        this.currentProfile = { id: 0 } as T;
        this.userForm.addControl(
          'pass-invite',
          new FormControl('', [Validators.required])
        );
        this.userForm.controls['pass-invite'].valueChanges.subscribe(value => {
          if (value === 'password') {
            this.addPasswordControls();
          } else {
            this.removePasswordControls();
          }
        });
      }
    });
    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
      if (this.loginAttribute === 'username') {
        this.userForm
          .get('profileDetailsGroup.username')
          ?.addValidators([Validators.required]);
      } else {
        this.userForm
          .get('profileDetailsGroup.email')
          ?.addValidators([Validators.required]);
      }
    });
  }

  addPasswordControls() {
    this.userForm.addControl(
      'password',
      new FormControl('', [Validators.required, Validators.minLength(6)])
    );
    this.userForm.addControl(
      'confirmPassword',
      new FormControl('', [Validators.required, matchValidator('password')])
    );
  }

  removePasswordControls() {
    this.userForm.removeControl('password');
    this.userForm.removeControl('confirmPassword');
  }

  get tabs() {
    return this.userForm.controls['tabs'] as FormArray;
  }

  selectAllTabs(event: MatCheckboxChange) {
    this.changeAllTabs(event.checked);
  }

  changeAllTabs(checked: boolean) {
    this.tabs.controls.forEach(control => {
      control.patchValue({ checked });
    });
  }

  get allTabsSelected() {
    return this.tabs.controls.every(control => control.value.checked);
  }

  buildTabs() {
    const arr = this.accessByTabs.map(tab => {
      return this.fb.group({
        name: tab.control,
        title: tab.label || tab.control,
        checked: true,
      });
    });
    return this.fb.array(arr);
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
}
