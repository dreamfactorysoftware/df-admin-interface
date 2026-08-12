import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTriangleExclamation,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  CurlParseError,
  ParsedCurl,
  parseCurl,
} from '../../utilities/curl-parser';

@Component({
  selector: 'df-curl-import-dialog',
  templateUrl: './df-curl-import-dialog.component.html',
  styleUrls: ['./df-curl-import-dialog.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    FontAwesomeModule,
    TranslocoPipe,
  ],
})
export class DfCurlImportDialogComponent {
  command = '';
  parsed: ParsedCurl | null = null;
  error = '';

  faUpload = faUpload;
  faTriangleExclamation = faTriangleExclamation;

  keyValueColumns = ['name', 'value'];

  constructor(
    public dialogRef: MatDialogRef<DfCurlImportDialogComponent, ParsedCurl>
  ) {}

  get optionEntries(): Array<{ name: string; value: string }> {
    return Object.entries(this.parsed?.options ?? {}).map(([name, value]) => ({
      name,
      value,
    }));
  }

  onCommandChange(): void {
    this.error = '';
    this.parsed = null;
    if (!this.command.trim()) {
      return;
    }
    try {
      this.parsed = parseCurl(this.command);
    } catch (e) {
      this.error =
        e instanceof CurlParseError
          ? e.message
          : 'Could not parse the cURL command.';
    }
  }

  onImport(): void {
    if (this.parsed) {
      this.dialogRef.close(this.parsed);
    }
  }
}
