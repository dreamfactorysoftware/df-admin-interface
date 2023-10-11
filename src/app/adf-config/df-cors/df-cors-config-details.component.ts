import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
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
import { CONFIG_CORS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { CorsConfigData } from '../../shared/types/config';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DfVerbPickerComponent } from 'src/app/shared/components/df-verb-picker/df-verb-picker.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  GenericCreateResponse,
  GenericUpdateResponse,
} from 'src/app/shared/types/generic-http';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-cors-config-details',
  templateUrl: './df-cors-config-details.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    NgFor,
    MatOptionModule,
    NgIf,
    MatSlideToggleModule,
    MatButtonModule,
    TranslocoDirective,
    TranslocoPipe,
    DfVerbPickerComponent,
  ],
})
export class DfCorsConfigDetailsComponent implements OnInit {
  corsForm: FormGroup;
  corsConfigToEdit: CorsConfigData | undefined;
  allMethodsSelected = false;
  type = 'create';

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
    this.activatedRoute.data.subscribe(data => {
      this.type = data['type'];
      if (this.type === 'edit') {
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

        if (this.corsConfigToEdit.method.length === 5)
          this.allMethodsSelected = true;
      }
    });
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
          .create<GenericCreateResponse>(
            { resource: [payload] },
            {
              fields: '*',
            }
          )
          .subscribe(res => {
            this.router.navigate(['../', res.resource[0].id], {
              relativeTo: this.activatedRoute,
            });
          });
      } else {
        // edit mode
        const payload = this.assemblePayload();
        this.corsConfigService
          .update<GenericUpdateResponse, Partial<CorsConfigData>>(
            this.corsConfigToEdit.id,
            payload
          )
          .subscribe(res => {
            this.router.navigate(['../', res.id], {
              relativeTo: this.activatedRoute,
            });
          });
      }
    }
  }

  onCancel() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
