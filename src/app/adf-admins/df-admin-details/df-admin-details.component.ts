import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { AdminType, CreateAdmin } from 'src/app/shared/types/user';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { DfAdminService } from '../services/df-admin.service';
import { matchValidator } from 'src/app/shared/validators/match.validator';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { ROUTES } from 'src/app/core/constants/routes';
import { TranslateService } from '@ngx-translate/core';
import { parseError } from 'src/app/shared/utilities/parse-errors';

@Component({
  selector: 'df-admin-details',
  templateUrl: './df-admin-details.component.html',
  styleUrls: ['./df-admin-details.component.scss'],
})
export class DfAdminDetailsComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  adminForm: FormGroup;
  currentProfile: AdminType;
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
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private adminService: DfAdminService,
    private breakpointService: DfBreakpointService,
    private router: Router,
    private translateService: TranslateService
  ) {
    this.adminForm = this.fb.group({
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

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ type, data }) => {
        this.type = type;
        if (type === 'edit') {
          this.currentProfile = data;
          this.adminForm.patchValue({
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
          this.adminForm.addControl('setPassword', new FormControl(false));
          this.adminForm.controls['setPassword'].valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe(value => {
              if (value) {
                this.addPasswordControls();
              } else {
                this.removePasswordControls();
              }
            });
          if (data.isRootAdmin) {
            this.adminForm.removeControl('tabs');
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
        } else {
          this.adminForm.addControl(
            'pass-invite',
            new FormControl('', [Validators.required])
          );
          this.adminForm.controls['pass-invite'].valueChanges
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
          this.adminForm
            .get('profileDetailsGroup.username')
            ?.addValidators([Validators.required]);
        } else {
          this.adminForm
            .get('profileDetailsGroup.email')
            ?.addValidators([Validators.required]);
        }
      });
  }

  addPasswordControls() {
    this.adminForm.addControl(
      'password',
      new FormControl('', [Validators.required, Validators.minLength(6)])
    );
    this.adminForm.addControl(
      'confirmPassword',
      new FormControl('', [Validators.required, matchValidator('password')])
    );
  }

  removePasswordControls() {
    this.adminForm.removeControl('password');
    this.adminForm.removeControl('confirmPassword');
  }

  get tabs() {
    return this.adminForm.controls['tabs'] as FormArray;
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

  sendInvite() {
    this.adminService.sendInvite(this.currentProfile.id).subscribe();
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }

  submit() {
    if (this.adminForm.invalid || this.adminForm.pristine) {
      return;
    }
    const data: CreateAdmin = {
      ...this.adminForm.value.profileDetailsGroup,
      isActive: this.adminForm.value.isActive,
      accessByTabs: this.tabs.controls
        .filter(c => c.value.checked)
        .map(c => c.value.name),
      isRestrictedAdmin: this.tabs.controls.some(c => !c.value.checked),
    };
    if (this.type === 'create') {
      const sendInvite = this.adminForm.value['pass-invite'] === 'invite';
      if (!sendInvite) {
        data.password = this.adminForm.value.password;
      }
      this.adminService
        .createAdmin({ resource: [data] }, sendInvite)
        .pipe(
          takeUntil(this.destroyed$),
          catchError(err => {
            this.triggerAlert(
              'error',
              this.translateService.instant(
                parseError(err.error.error.context.resource[0].message)
              )
            );
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.router.navigate([ROUTES.ADMINS]);
        });
    } else {
      if (this.adminForm.value.setPassword) {
        data.password = this.adminForm.value.password;
      }
      this.adminService
        .updateAdmin(this.currentProfile.id, data)
        .pipe(
          takeUntil(this.destroyed$),
          catchError(err => {
            this.triggerAlert('error', err.error.error.message);
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.router.navigate([ROUTES.ADMINS]);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
