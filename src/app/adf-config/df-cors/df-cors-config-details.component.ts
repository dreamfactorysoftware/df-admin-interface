import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, ActivatedRoute } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@ngneat/transloco';
import { ROUTES } from 'src/app/core/constants/routes';
import { CONFIG_CORS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { CorsConfigData } from '../types';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';

@Component({
  selector: 'df-cors-config-details',
  templateUrl: './df-cors-config-details.component.html',
  styleUrls: ['./df-cors-config-details.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgFor,
    MatOptionModule,
    NgIf,
    MatSlideToggleModule,
    MatButtonModule,
    TranslocoDirective,
    TranslocoPipe,
  ],
})
export class DfCorsConfigDetailsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  corsForm: FormGroup;
  corsConfigToEdit: CorsConfigData | undefined;

  // TODO: add functionality and option for select all/none
  verbDropdownOptions = [
    {
      value: 'GET',
      name: 'verbs.get',
    },
    {
      value: 'POST',
      name: 'verbs.post',
    },
    {
      value: 'PUT',
      name: 'verbs.put',
    },
    {
      value: 'PATCH',
      name: 'verbs.patch',
    },
    {
      value: 'DELETE',
      name: 'verbs.delete',
    },
  ];

  constructor(
    @Inject(CONFIG_CORS_SERVICE_TOKEN)
    private corsConfigService: DfBaseCrudService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslocoService,
    private formBuilder: FormBuilder
  ) {
    this.corsForm = formBuilder.group({
      path: ['', Validators.required],
      description: [''],
      origins: ['', Validators.required],
      headers: ['', Validators.required],
      exposedHeaders: ['', Validators.required],
      maxAge: [0, Validators.required],
      methods: ['', Validators.required],
      credentials: [true],
      enabled: [true],
    });
  }

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    if (id) {
      this.activatedRoute.data
        .pipe(
          takeUntil(this.destroyed$),
          catchError(error => {
            this.router.navigate([
              `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CORS}`,
            ]);
            return throwError(() => new Error(error));
          })
        )
        .subscribe(data => {
          this.corsConfigToEdit = data['data'] as CorsConfigData;
          this.corsForm.setValue({
            path: this.corsConfigToEdit.path,
            description: this.corsConfigToEdit.description,
            origins: this.corsConfigToEdit.origin,
            headers: this.corsConfigToEdit.header,
            exposedHeaders: this.corsConfigToEdit.exposedHeader,
            maxAge: this.corsConfigToEdit.maxAge,
            methods: this.corsConfigToEdit.method,
            credentials: this.corsConfigToEdit.supportsCredentials,
            enabled: this.corsConfigToEdit.enabled,
          });
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private assemblePayload(): Partial<CorsConfigData> {
    const payload = {
      path: this.corsForm.value.path,
      description: this.corsForm.value.description,
      origin: this.corsForm.value.origins,
      header: this.corsForm.value.headers,
      exposedHeader: this.corsForm.value.exposedHeaders,
      maxAge: this.corsForm.value.maxAge,
      method: this.corsForm.value.methods,
      supportsCredentials: this.corsForm.value.credentials,
      enabled: this.corsForm.value.enabled,
    };

    if (this.corsConfigToEdit) {
      return {
        ...payload,
        createdById: this.corsConfigToEdit.createdById,
        createdDate: this.corsConfigToEdit.createdDate,
        lastModifiedById: this.corsConfigToEdit.lastModifiedById,
        lastModifiedDate: this.corsConfigToEdit.lastModifiedDate,
      };
    }

    return payload;
  }

  onSubmit() {
    if (this.corsForm.valid) {
      if (!this.corsConfigToEdit) {
        const payload = this.assemblePayload();

        // create mode
        this.corsConfigService
          .create(
            { resource: [payload] },
            {
              fields: '*',
            }
          )
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            this.router.navigate([
              `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CORS}`,
            ]);
          });
      } else {
        // edit mode
        const payload = this.assemblePayload();
        this.corsConfigService
          .update(this.corsConfigToEdit.id, payload)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            this.router.navigate([
              `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CORS}`,
            ]);
          });
      }
    }
  }

  onCancel() {
    this.router.navigate([
      `${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CORS}`,
    ]);
  }
}
