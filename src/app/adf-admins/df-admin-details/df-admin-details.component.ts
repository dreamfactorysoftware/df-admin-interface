import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { AdminType } from 'src/app/shared/types/user';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { DfAdminService } from '../services/df-admin.service';
import { matchValidator } from 'src/app/shared/validators/match.validator';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private adminService: DfAdminService,
    private breakpointService: DfBreakpointService
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
      setPassword: [false],
      isActive: [false],
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
    this.adminForm.controls['setPassword'].valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => {
        if (value) {
          this.adminForm.addControl(
            'password',
            this.fb.control('', Validators.required)
          );
          this.adminForm.addControl(
            'confirmPassword',
            this.fb.control('', [
              Validators.required,
              matchValidator('password'),
            ])
          );
          return;
        }
        if (!value && this.adminForm.controls['password']) {
          this.adminForm.removeControl('password');
          this.adminForm.removeControl('confirmPassword');
        }
      });
  }

  sendInvite() {
    this.adminService.sendInvite(this.currentProfile.id).subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
