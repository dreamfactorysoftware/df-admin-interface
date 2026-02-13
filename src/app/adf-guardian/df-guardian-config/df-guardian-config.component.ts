import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { GuardianConfig } from '../types';
import { GUARDIAN_CONFIG_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';

@Component({
  selector: 'df-guardian-config',
  templateUrl: './df-guardian-config.component.html',
  styleUrls: ['./df-guardian-config.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
})
export class DfGuardianConfigComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    @Inject(GUARDIAN_CONFIG_SERVICE_TOKEN)
    private configService: DfBaseCrudService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      gatekeeper_enabled: [false],
      logwatch_enabled: [false],
      approval_enabled: [false],
      cache_enabled: [false],
      ai_service_name: [''],
      fallback_ai_service_name: [''],
      threshold: [70],
      review_threshold: [40],
      fallback_action: ['allow'],
      evaluation_timeout: [5],
      max_body_size: [4096],
      cache_ttl: [300],
      approval_timeout: [60],
      approval_timeout_action: ['block'],
      methods: ['POST,PUT,PATCH,DELETE'],
      bypass_services: [''],
      bypass_users: [''],
      bypass_ips: [''],
      logwatch_frequency: [15],
      base_url: [''],
      notification_service_name: [''],
      notification_email_recipients: [''],
      webhook_url: [''],
      webhook_format: ['generic'],
      telegram_bot_token: [''],
      telegram_chat_id: [''],
    });

    this.activatedRoute.data.subscribe(({ data }) => {
      if (data) {
        this.form.patchValue(data);
      }
    });
  }

  save(): void {
    this.saving = true;
    const values = this.form.value;
    this.configService.patch<GuardianConfig, unknown>(0, values).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Configuration saved successfully', 'OK', {
          duration: 3000,
        });
      },
      error: err => {
        this.saving = false;
        this.snackBar.open(
          'Error saving configuration: ' +
            (err.error?.error?.message || err.message),
          'OK',
          {
            duration: 5000,
          }
        );
      },
    });
  }
}
