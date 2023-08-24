import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AlertType } from '../df-alert/df-alert.component';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { ActivatedRoute } from '@angular/router';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { matchValidator } from '../../validators/match.validator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UserProfileType } from '../../types/user';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-user-details',
  template: '',
})
export abstract class DfUserDetailsBaseComponent<T>
  implements OnInit, OnDestroy
{
  destroyed$ = new Subject<void>();
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
    private activatedRoute: ActivatedRoute,
    private systemConfigDataService: DfSystemConfigDataService,
    private breakpointService: DfBreakpointService
  ) {
    this.userForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: [''],
        email: ['', Validators.email],
        firstName: [''],
        lastName: [''],
        name: ['', Validators.required],
        phone: [''],
      }),
      isActive: [false],
      tabs: this.buildTabs(),
    });
  }

  get cancelRoute() {
    let route = '/';
    if (this.userType === 'admins') {
      route += ROUTES.ADMINS;
    }
    if (this.userType === 'users') {
      route += ROUTES.USERS;
    }
    return route;
  }

  abstract sendInvite(): void;
  abstract submit(): void;

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ type, data }) => {
        this.type = type;
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
          this.userForm.controls['setPassword'].valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe(value => {
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
        } else {
          this.userForm.addControl(
            'pass-invite',
            new FormControl('', [Validators.required])
          );
          this.userForm.controls['pass-invite'].valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe(value => {
              if (value === 'password') {
                this.addPasswordControls();
              } else {
                this.removePasswordControls();
              }
            });
        }
      });
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
