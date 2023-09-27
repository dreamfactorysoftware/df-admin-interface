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
} from '../df-email-templates/df-email-templates.types';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { ROUTES } from 'src/app/shared/constants/routes';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { UntilDestroy } from '@ngneat/until-destroy';

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
  ],
})
export class DfEmailTemplateDetailsComponent implements OnInit {
  emailTemplateForm: FormGroup;
  translateService: any;
  editApp: EmailTemplate;

  constructor(
    @Inject(EMAIL_TEMPLATES_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private fb: FormBuilder,
    private router: Router,
    public breakpointService: DfBreakpointService,
    private activatedRoute: ActivatedRoute
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

  ngOnInit() {
    this.activatedRoute.data.subscribe((data: any) => {
      this.editApp = data?.data;
    });

    if (this.editApp) {
      this.emailTemplateForm.patchValue({
        name: this.editApp.name,
        description: this.editApp.description,
        to: this.editApp.to,
        cc: this.editApp.cc,
        bcc: this.editApp.bcc,
        subject: this.editApp.subject,
        attachment: this.editApp.attachment,
        body: this.editApp.body_html,
        senderName: this.editApp.from_name,
        senderEmail: this.editApp.from_email,
        replyToName: this.editApp.reply_to_name,
        replyToEmail: this.editApp.reply_to_email,
        id: this.editApp.id,
      });
    }
  }

  goBack() {
    this.router.navigate([
      `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.EMAIL_TEMPLATES}`,
    ]);
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
      body_html: this.emailTemplateForm.value.body,
      from_name: this.emailTemplateForm.value.senderName,
      from_email: this.emailTemplateForm.value.senderEmail,
      reply_to_name: this.emailTemplateForm.value.replyToName,
      reply_to_email: this.emailTemplateForm.value.replyToEmail,
    };

    if (this.emailTemplateForm.value.id) {
      this.crudService
        .update(this.emailTemplateForm.value.id, payload, {
          snackbarSuccess: 'emailTemplates.alerts.updateSuccess',
        })
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
        .subscribe(() => {
          this.goBack();
        });
    }
  }
}
