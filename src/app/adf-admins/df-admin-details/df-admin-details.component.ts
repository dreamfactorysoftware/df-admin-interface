import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import {
  UserProfile,
  CreateAdmin,
  UserProfileType,
} from 'src/app/shared/types/user';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { ROUTES } from 'src/app/shared/constants/routes';

import { parseError } from 'src/app/shared/utilities/parse-errors';
import { DfUserDetailsBaseComponent } from 'src/app/shared/components/df-user-details/df-user-details-base.component';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { ADMIN_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfLookupKeysComponent } from '../../shared/components/df-lookup-keys/df-lookup-keys.component';
import { DfUserAppRolesComponent } from '../../shared/components/df-user-app-roles/df-user-app-roles.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfProfileDetailsComponent } from '../../shared/components/df-profile-details/df-profile-details.component';
import { DfAlertComponent } from '../../shared/components/df-alert/df-alert.component';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-admin-details',
  templateUrl:
    '../../shared/components/df-user-details/df-user-details-base.component.html',
  styleUrls: [
    '../../shared/components/df-user-details/df-user-details-base.component.scss',
  ],
  standalone: true,
  imports: [
    DfAlertComponent,
    ReactiveFormsModule,
    DfProfileDetailsComponent,
    MatSlideToggleModule,
    NgIf,
    MatRadioModule,
    MatButtonModule,
    FontAwesomeModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    NgFor,
    DfUserAppRolesComponent,
    DfLookupKeysComponent,
    RouterLink,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfAdminDetailsComponent extends DfUserDetailsBaseComponent<UserProfile> {
  userType: UserProfileType = 'admins';

  constructor(
    fb: FormBuilder,
    activatedRoute: ActivatedRoute,
    systemConfigDataService: DfSystemConfigDataService,
    breakpointService: DfBreakpointService,
    private translateService: TranslocoService,
    @Inject(ADMIN_SERVICE_TOKEN)
    private adminService: DfBaseCrudService,
    private router: Router
  ) {
    super(fb, activatedRoute, systemConfigDataService, breakpointService);
  }

  sendInvite() {
    this.adminService
      .patch(this.currentProfile.id, null, {
        snackbarSuccess: 'inviteSent',
      })
      .subscribe();
  }

  save() {
    if (this.userForm.invalid || this.userForm.pristine) {
      return;
    }
    const data: CreateAdmin = {
      ...this.userForm.value.profileDetailsGroup,
      isActive: this.userForm.value.isActive,
      accessByTabs: this.tabs
        ? this.tabs.controls.filter(c => c.value.checked).map(c => c.value.name)
        : [],
      isRestrictedAdmin: this.tabs
        ? this.tabs.controls.some(c => !c.value.checked)
        : false,
      lookupByUserId: this.userForm.value.lookupKeys,
    };
    if (this.type === 'create') {
      const sendInvite = this.userForm.value['pass-invite'] === 'invite';
      if (!sendInvite) {
        data.password = this.userForm.value.password;
      }
      this.adminService
        .create(
          { resource: [data] },
          {
            snackbarSuccess: 'admins.alerts.createdSuccess',
            additionalParams: [{ key: 'send_invite', value: sendInvite }],
          }
        )
        .pipe(
          catchError(err => {
            this.triggerAlert(
              'error',
              this.translateService.translate(
                parseError(err.error.error.context.resource[0].message)
              )
            );
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.router.navigate([ROUTES.ADMIN_SETTINGS, ROUTES.ADMINS]);
        });
    } else {
      if (this.userForm.value.setPassword) {
        data.password = this.userForm.value.password;
      }
      this.adminService
        .update(this.currentProfile.id, data, {
          snackbarSuccess: 'admins.alerts.updateSuccess',
        })
        .pipe(
          catchError(err => {
            this.triggerAlert('error', err.error.error.message);
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.router.navigate([ROUTES.ADMIN_SETTINGS, ROUTES.ADMINS]);
        });
    }
  }
}
