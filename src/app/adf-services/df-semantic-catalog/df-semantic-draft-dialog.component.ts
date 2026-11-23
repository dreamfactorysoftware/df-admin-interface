import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  DfPickerListComponent,
  PickerId,
  PickerItem,
} from 'src/app/shared/components/df-picker-list/df-picker-list.component';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import {
  AiConnectionRow,
  SemanticDraftReport,
  SemanticDraftRequest,
  serverMessage,
  Translate,
} from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';

export interface SemanticDraftDialogData {
  service: string;
  /** null when the table list could not be loaded. */
  tables: string[] | null;
}

/**
 * df-semantic-draft-dialog: ask the LLM behind a df-ai AI Connection for
 * catalog entries (POST _draft). Everything it proposes lands as a draft; the
 * dialog shows what was saved and what the schema check rejected, and closes
 * with the report so the list can reload.
 */
@Component({
  selector: 'df-semantic-draft-dialog',
  standalone: true,
  templateUrl: './df-semantic-draft-dialog.component.html',
  styleUrls: ['./df-semantic-draft-dialog.component.scss'],
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
    MatProgressBarModule,
    MatSelectModule,
    TranslocoPipe,
    DfPickerListComponent,
  ],
})
export class DfSemanticDraftDialogComponent implements OnInit {
  /** Above this many tables the backend insists on a table selection. */
  static readonly MAX_TABLES = 60;

  connections: AiConnectionRow[] | null = null;
  /** Why the AI Connection list is unavailable, when it is. */
  connectionsError: 'forbidden' | 'failed' | null = null;
  aiService = '';
  model = '';
  /** Tables picked from the list. */
  tables: string[] = [];
  /** Comma-separated names, typed when the table list is unknown. */
  tablesText = '';
  /** Set when a pick was refused because the cap is reached. */
  capHit = false;
  tableItems: PickerItem[] = [];
  maxEntries = 40;
  /** Off by default: sample rows are customer data sent to the model. */
  includeSamples = false;

  running = false;
  error = '';
  report: SemanticDraftReport | null = null;

  /** Keys under services.semantic, for the helpers that build messages. */
  readonly t: Translate = (key, params) =>
    this.transloco.translate(`services.semantic.${key}`, params);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SemanticDraftDialogData,
    private dialogRef: MatDialogRef<
      DfSemanticDraftDialogComponent,
      SemanticDraftReport | undefined
    >,
    private api: SemanticCatalogApiService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.tableItems = (this.data.tables ?? []).map(t => ({ id: t, label: t }));
    this.api.aiConnections().subscribe(({ rows, error }) => {
      this.connections = rows;
      this.connectionsError = error;
      if (rows.length === 1) this.aiService = rows[0].name;
    });
  }

  get tablesKnown() {
    return Array.isArray(this.data.tables);
  }

  /** The tables this draft would send, from the picker or the text field. */
  get picked(): string[] {
    if (this.tablesKnown) return this.tables;
    return this.tablesText
      .split(',')
      .map(t => t.trim())
      .filter((t, i, all) => !!t && all.indexOf(t) === i);
  }

  toggleTable(id: PickerId) {
    if (this.running) return;
    const t = String(id);
    this.capHit = false;
    if (this.tables.includes(t)) {
      this.tables = this.tables.filter(x => x !== t);
    } else if (this.tables.length >= this.maxTables) {
      this.capHit = true;
    } else {
      this.tables = [...this.tables, t];
    }
  }

  get maxTables() {
    return DfSemanticDraftDialogComponent.MAX_TABLES;
  }

  /**
   * Large catalogs (Oracle system schemas, for instance) must be narrowed.
   * When the list could not be loaded the size is unknown, so tables are
   * required rather than risking a request the backend refuses.
   */
  get needsTables() {
    return !this.tablesKnown || this.data.tables!.length > this.maxTables;
  }

  get tooManyTables() {
    return this.picked.length > this.maxTables;
  }

  get canRun() {
    return (
      !!this.aiService &&
      !this.running &&
      !this.tooManyTables &&
      (!this.needsTables || this.picked.length > 0)
    );
  }

  run() {
    if (!this.canRun) return;
    this.setRunning(true);
    this.error = '';
    const body: SemanticDraftRequest = {
      ai_service: this.aiService,
      max_entries: this.maxEntries,
    };
    const picked = this.picked;
    if (picked.length) body.tables = picked;
    if (this.model.trim()) body.model = this.model.trim();
    // Sent only when on, so a stock backend sees the request it always did.
    if (this.includeSamples) body.include_samples = true;
    this.api.draft(this.data.service, body).subscribe({
      next: report => {
        this.setRunning(false);
        this.report = report;
      },
      error: err => {
        this.setRunning(false);
        this.error = serverMessage(err, this.t);
      },
    });
  }

  /** Escape and the backdrop cannot drop a draft that is still running. */
  private setRunning(running: boolean) {
    this.running = running;
    this.dialogRef.disableClose = running;
  }

  close() {
    this.dialogRef.close(this.report ?? undefined);
  }
}
