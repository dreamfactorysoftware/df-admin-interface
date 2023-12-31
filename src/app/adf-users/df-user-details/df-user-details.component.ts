import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { UserProfile, UserProfileType } from 'src/app/shared/types/user';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { parseError } from 'src/app/shared/utilities/parse-errors';
import { DfUserDetailsBaseComponent } from 'src/app/shared/components/df-user-details/df-user-details-base.component';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { USER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
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
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import {
  GenericCreateResponse,
  GenericUpdateResponse,
} from 'src/app/shared/types/generic-http';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-user-details',
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
export class DfUserDetailsComponent extends DfUserDetailsBaseComponent<UserProfile> {
  userType: UserProfileType = 'users';

  constructor(
    fb: FormBuilder,
    activatedRoute: ActivatedRoute,
    systemConfigDataService: DfSystemConfigDataService,
    breakpointService: DfBreakpointService,
    private translateService: TranslocoService,
    @Inject(USER_SERVICE_TOKEN)
    private userService: DfBaseCrudService,
    private router: Router,
    paywallService: DfPaywallService
  ) {
    super(
      fb,
      activatedRoute,
      systemConfigDataService,
      breakpointService,
      paywallService
    );
  }

  sendInvite() {
    this.userService
      .patch(this.currentProfile.id, null, {
        snackbarSuccess: 'inviteSent',
      })
      .subscribe();
  }

  get userAppRoles() {
    const userAppRoles = this.userForm.value.appRoles.map((item: any) => {
      const appRole = {
        userId: this.currentProfile.id,
        appId: this.apps.find(app => app.name === item.app)?.id,
        roleId: this.roles.find(role => role.name === item.role)?.id,
      };
      if (this.type === 'create') {
        return appRole;
      }
      const modified = this.currentProfile.userToAppToRoleByUserId.find(
        userApp =>
          userApp.appId === appRole.appId && userApp.roleId === appRole.roleId
      );
      if (modified) {
        return {
          ...appRole,
          id: modified.id,
        };
      }
      return appRole;
    });

    if (this.type === 'create') {
      return userAppRoles;
    }

    this.currentProfile.userToAppToRoleByUserId
      .filter(
        userApp =>
          !userAppRoles.find(
            (appRole: any) =>
              appRole.appId === userApp.appId &&
              appRole.roleId === userApp.roleId
          )
      )
      .forEach(userApp => {
        userAppRoles.push({
          ...userApp,
          userId: null,
        });
      });
    return userAppRoles;
  }

  save() {
    if (this.userForm.invalid) {
      return;
    }
    const data: UserProfile = {
      ...this.userForm.value.profileDetailsGroup,
      isActive: this.userForm.value.isActive,
      lookupByUserId: this.userForm.getRawValue().lookupKeys,
      userToAppToRoleByUserId: this.userAppRoles,
    };
    if (this.type === 'create') {
      const sendInvite = this.userForm.value['pass-invite'] === 'invite';
      if (!sendInvite) {
        data.password = this.userForm.value.password;
      }
      this.userService
        .create<GenericCreateResponse>(
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
        .subscribe(res => {
          this.router.navigate(['../', res.resource[0].id], {
            relativeTo: this.activatedRoute,
          });
        });
    } else {
      if (this.userForm.value.setPassword) {
        data.password = this.userForm.value.password;
      }
      this.userService
        .update<GenericUpdateResponse, UserProfile>(
          this.currentProfile.id,
          data,
          {
            snackbarSuccess: 'admins.alerts.updateSuccess',
          }
        )
        .pipe(
          catchError(err => {
            this.triggerAlert('error', err.error.error.message);
            return throwError(() => new Error(err));
          })
        )
        .subscribe(res => {
          this.router.navigate(['../', res.id], {
            relativeTo: this.activatedRoute,
          });
        });
    }
  }
}
