import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faDownload,
  faFileImport,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { URLS } from 'src/app/shared/constants/urls';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { toastOff } from 'src/app/shared/utilities/http-contexts';

@Component({
  selector: 'df-config-package',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
  ],
  templateUrl: './df-config-package.component.html',
  styleUrls: ['./df-config-package.component.scss'],
})
export class DfConfigPackageComponent {
  faDownload = faDownload;
  faFileImport = faFileImport;
  faTriangleExclamation = faTriangleExclamation;

  exportedJson = '';
  importJson = '';
  overwrite = false;
  loading = false;
  message = '';
  error = '';

  constructor(private http: HttpClient) {}

  exportConfig(): void {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.http
      // The inline error panel owns display; skip the interceptor toast.
      .get<unknown>(URLS.CONFIG_PACKAGE, { context: toastOff() })
      .subscribe({
        next: manifest => {
          this.exportedJson = JSON.stringify(manifest, null, 2);
          this.message = 'Config package exported.';
          this.loading = false;
        },
        error: err => {
          this.error = this.extractError(err, 'Export failed.');
          this.loading = false;
        },
      });
  }

  importConfig(): void {
    this.message = '';
    this.error = '';

    let manifest: unknown;
    try {
      manifest = JSON.parse(this.importJson);
    } catch {
      this.error = 'Import JSON is not valid.';
      return;
    }

    this.loading = true;
    const params = new HttpParams().set('overwrite', String(this.overwrite));

    this.http
      // The inline error panel owns display; skip the interceptor toast.
      .post<unknown>(
        URLS.CONFIG_PACKAGE,
        { manifest },
        { params, context: toastOff() }
      )
      .subscribe({
        next: result => {
          this.message = JSON.stringify(result, null, 2);
          this.loading = false;
        },
        error: err => {
          this.error = this.extractError(err, 'Import failed.');
          this.loading = false;
        },
      });
  }

  useExportForImport(): void {
    this.importJson = this.exportedJson;
    this.message = 'Export copied into the import panel.';
    this.error = '';
  }

  downloadExport(): void {
    if (!this.exportedJson) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([this.exportedJson], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `dreamfactory-config-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private extractError(err: unknown, fallback: string): string {
    // This panel renders plain English strings, so keep the caller's fallback
    // when normalizeError yields an errors.* i18n key instead of a message.
    const message = normalizeError(err).message;
    return message.startsWith('errors.') ? fallback : message;
  }
}
