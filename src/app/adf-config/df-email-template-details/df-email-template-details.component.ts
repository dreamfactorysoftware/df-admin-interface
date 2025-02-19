import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import {
  EmailTemplate,
  EmailTemplatePayload,
} from '../../shared/types/email-templates';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  AlertType,
  DfAlertComponent,
} from 'src/app/shared/components/df-alert/df-alert.component';
import { catchError, throwError } from 'rxjs';
import { DfThemeService } from '../../shared/services/df-theme.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-email-template-details',
  templateUrl: './df-email-template-details.component.html',
  styleUrls: ['./df-email-template-details.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatSelectModule,
    MatOptionModule,
    TranslocoPipe,
    AsyncPipe,
    DfAlertComponent,
  ],
})
export class DfEmailTemplateDetailsComponent implements OnInit {
  emailTemplateForm: FormGroup;
  editApp: EmailTemplate;
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';

  constructor(
    @Inject(EMAIL_TEMPLATES_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private fb: FormBuilder,
    private router: Router,
    public breakpointService: DfBreakpointService,
    private activatedRoute: ActivatedRoute,
    private themeService: DfThemeService,
    private snackbarService: DfSnackbarService
  ) {
    this.emailTemplateForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      to: [''],
      cc: [''],
      bcc: [''],
      subject: [''],
      attachment: [''],
      body: [''],
      senderName: [''],
      senderEmail: [''],
      replyToName: [''],
      replyToEmail: [''],
      id: [null],
    });
  }
  isDarkMode = this.themeService.darkMode$;
  ngOnInit() {
    this.activatedRoute.data.subscribe(({ data }) => {
      this.editApp = data;
    });
    this.snackbarService.setSnackbarLastEle(this.editApp.name, true);
    if (this.editApp) {
      this.emailTemplateForm.patchValue({
        name: this.editApp.name,
        description: this.editApp.description,
        to: this.editApp.to,
        cc: this.editApp.cc,
        bcc: this.editApp.bcc,
        subject: this.editApp.subject,
        attachment: this.editApp.attachment,
        body: this.editApp.bodyHtml,
        senderName: this.editApp.fromName,
        senderEmail: this.editApp.fromEmail,
        replyToName: this.editApp.replyToName,
        replyToEmail: this.editApp.replyToEmail,
        id: this.editApp.id,
      });
    }
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  onSubmit() {
    if (this.emailTemplateForm.invalid) {
      return;
    }

    const payload: EmailTemplatePayload = {
      name: this.emailTemplateForm.value.name,
      description: this.emailTemplateForm.value.description,
      to: this.emailTemplateForm.value.to,
      cc: this.emailTemplateForm.value.cc,
      bcc: this.emailTemplateForm.value.bcc,
      subject: this.emailTemplateForm.value.subject,
      attachment: this.emailTemplateForm.value.attachment,
      bodyHtml: this.emailTemplateForm.value.body,
      fromName: this.emailTemplateForm.value.senderName,
      fromEmail: this.emailTemplateForm.value.senderEmail,
      replyToName: this.emailTemplateForm.value.replyToName,
      replyToEmail: this.emailTemplateForm.value.replyToEmail,
    };

    if (this.emailTemplateForm.value.id) {
      this.crudService
        .update(this.emailTemplateForm.value.id, payload, {
          snackbarSuccess: 'emailTemplates.alerts.updateSuccess',
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
      this.crudService
        .create(
          { resource: [payload] },
          {
            snackbarSuccess: 'emailTemplates.alerts.createSuccess',
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
}
