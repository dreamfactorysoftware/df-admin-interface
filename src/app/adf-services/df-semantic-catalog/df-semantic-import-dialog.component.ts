import { NgFor, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { readAsText } from 'src/app/shared/utilities/file';
import {
  SemanticExportDoc,
  SemanticImportReport,
  parseExportDoc,
  serverMessage,
  Translate,
} from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';

export interface SemanticImportDialogData {
  service: string;
}

/**
 * df-semantic-import-dialog: paste or choose an export document and upsert
 * it into this service's catalog (POST _import). Closes with the report so
 * the list can reload.
 */
@Component({
  selector: 'df-semantic-import-dialog',
  standalone: true,
  templateUrl: './df-semantic-import-dialog.component.html',
  styleUrls: ['./df-semantic-import-dialog.component.scss'],
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslocoPipe,
  ],
})
export class DfSemanticImportDialogComponent {
  /** Larger documents are refused before they are read. */
  static readonly MAX_BYTES = 5 * 1024 * 1024;

  json = '';
  approve = true;
  fileName = '';
  /** The parsed document, recomputed when the text changes. */
  doc: SemanticExportDoc | null = null;
  entryCount = 0;
  /** The text is not an export document (shown after Import is pressed). */
  invalid = false;

  running = false;
  /** A file that could not be read, or the server's message. */
  error = '';
  report: SemanticImportReport | null = null;

  /** Keys under services.semantic, for the helpers that build messages. */
  readonly t: Translate = (key, params) =>
    this.transloco.translate(`services.semantic.${key}`, params);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SemanticImportDialogData,
    private dialogRef: MatDialogRef<
      DfSemanticImportDialogComponent,
      SemanticImportReport | undefined
    >,
    private api: SemanticCatalogApiService,
    private transloco: TranslocoService
  ) {}

  onJson(text: string) {
    this.json = text ?? '';
    this.doc = parseExportDoc(this.json);
    this.entryCount = this.doc?.entries.length ?? 0;
    this.invalid = false;
    this.error = '';
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.fileName = file.name;
    this.error = '';
    if (file.size > DfSemanticImportDialogComponent.MAX_BYTES) {
      this.error = this.t('import.tooLarge', { max: 5 });
      return;
    }
    readAsText(file).subscribe({
      next: text => this.onJson(text),
      error: () => {
        this.error = this.t('import.readFailed', { name: file.name });
      },
    });
  }

  run() {
    if (this.running) return;
    if (!this.doc) {
      this.invalid = true;
      return;
    }
    this.running = true;
    this.error = '';
    this.api.import(this.data.service, this.doc, this.approve).subscribe({
      next: report => {
        this.running = false;
        this.report = report;
      },
      error: err => {
        this.running = false;
        this.error = serverMessage(err, this.t);
      },
    });
  }

  close() {
    this.dialogRef.close(this.report ?? undefined);
  }
}
