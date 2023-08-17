import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { AdminType } from 'src/app/shared/types/user';

@Component({
  selector: 'df-admin-details',
  templateUrl: './df-admin-details.component.html',
})
export class DfAdminDetailsComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  adminForm: FormGroup;
  currentProfile: AdminType;
  loginAttribute = 'email';

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService
  ) {
    this.adminForm = this.fb.group({
      userDetailsGroup: this.fb.group({
        username: [''],
        email: ['', Validators.email],
        firstName: [''],
        lastName: [''],
        name: ['', Validators.required],
        phone: [''],
      }),
      isActive: [false],
    });
  }
  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        this.currentProfile = data;
        this.adminForm.patchValue({
          userDetailsGroup: {
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
            phone: data.phone,
          },
          isActive: data.isActive,
        });
      });
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
        if (this.loginAttribute === 'username') {
          this.adminForm
            .get('userDetailsGroup.username')
            ?.addValidators([Validators.required]);
        } else {
          this.adminForm
            .get('userDetailsGroup.email')
            ?.addValidators([Validators.required]);
        }
      });
  }
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
