import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, takeUntil, throwError } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { UserProfile, UserProfileType } from 'src/app/shared/types/user';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { ROUTES } from 'src/app/core/constants/routes';
import { TranslateService } from '@ngx-translate/core';
import { parseError } from 'src/app/shared/utilities/parse-errors';
import { DfUserDetailsBaseComponent } from 'src/app/shared/components/df-user-details/df-user-details-base.component';
import { DfUserService } from '../services/df-user.service';

@Component({
  selector: 'df-user-details',
  templateUrl:
    '../../shared/components/df-user-details/df-user-details-base.component.html',
  styleUrls: [
    '../../shared/components/df-user-details/df-user-details-base.component.scss',
  ],
})
export class DfUserDetailsComponent extends DfUserDetailsBaseComponent<any> {
  userType: UserProfileType = 'users';

  constructor(
    fb: FormBuilder,
    activatedRoute: ActivatedRoute,
    systemConfigDataService: DfSystemConfigDataService,
    breakpointService: DfBreakpointService,
    private translateService: TranslateService,
    private userService: DfUserService,
    private router: Router
  ) {
    super(fb, activatedRoute, systemConfigDataService, breakpointService);
  }

  sendInvite() {
    this.userService.sendInvite(this.currentProfile.id).subscribe();
  }

  submit() {
    if (this.userForm.invalid || this.userForm.pristine) {
      return;
    }
    const data: UserProfile = {
      ...this.userForm.value.profileDetailsGroup,
      isActive: this.userForm.value.isActive,
    };
    if (this.type === 'create') {
      const sendInvite = this.userForm.value['pass-invite'] === 'invite';
      if (!sendInvite) {
        data.password = this.userForm.value.password;
      }
      this.userService
        .create({ resource: [data] }, sendInvite)
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
          this.router.navigate([ROUTES.USERS]);
        });
    } else {
      if (this.userForm.value.setPassword) {
        data.password = this.userForm.value.password;
      }
      this.userService
        .update(this.currentProfile.id, data)
        .pipe(
          takeUntil(this.destroyed$),
          catchError(err => {
            this.triggerAlert('error', err.error.error.message);
            return throwError(() => new Error(err));
          })
        )
        .subscribe(() => {
          this.router.navigate([ROUTES.USERS]);
        });
    }
  }
}