import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  AGGREGATE_FUNCTIONS,
  MetricAggregate,
  PARAM_TYPES,
  SemanticEntry,
  SemanticKind,
  SemanticParam,
  cleanDefinition,
  paramMismatch,
  serverMessage,
  stableStringify,
  validateDefinition,
} from './semantic-catalog';
import {
  SchemaTableInfo,
  SemanticCatalogApiService,
} from './semantic-catalog-api.service';

export interface SemanticEntryDialogData {
  service: string;
  kind: SemanticKind;
  entry?: SemanticEntry;
  tables: string[];
}

type MapMode = 'none' | 'value' | 'filter';

/**
 * df-semantic-entry-dialog: create or edit one semantic catalog entry.
 *
 * One form per kind (term / metric / query), with table and column pickers
 * fed by the service's _schema. The cheap parts of the server's validation
 * run client-side; anything else (unknown column, duplicate name) comes back
 * as a 400 whose message is shown inline above the actions.
 */
@Component({
  selector: 'df-semantic-entry-dialog',
  standalone: true,
  templateUrl: './df-semantic-entry-dialog.component.html',
  styleUrls: ['./df-semantic-entry-dialog.component.scss'],
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
})
export class DfSemanticEntryDialogComponent implements OnInit {
  readonly functions = AGGREGATE_FUNCTIONS;
  readonly paramTypes = PARAM_TYPES;
  readonly separatorKeys = [ENTER, COMMA];

  kind: SemanticKind;
  isEdit = false;
  wasApproved = false;

  name = '';
  description = '';

  // term
  meaning = '';
  synonyms: string[] = [];
  mapEnabled = false;
  mapTable = '';
  mapField = '';
  mapMode: MapMode = 'none';
  mapValue = '';
  mapFilter = '';

  // metric + query
  table = '';
  filter = '';
  params: SemanticParam[] = [];

  // metric
  aggregates: MetricAggregate[] = [];
  groupBy: string[] = [];
  unit = '';

  // query
  question = '';
  fields: string[] = [];
  order = '';
  limit: number | null = null;
  related: string[] = [];

  tables: string[] = [];
  private tableInfo: Record<string, SchemaTableInfo | null | undefined> = {};

  clientErrors: string[] = [];
  serverError = '';
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SemanticEntryDialogData,
    private dialogRef: MatDialogRef<
      DfSemanticEntryDialogComponent,
      SemanticEntry
    >,
    private api: SemanticCatalogApiService
  ) {}

  ngOnInit(): void {
    this.kind = this.data.entry?.kind ?? this.data.kind;
    this.tables = [...(this.data.tables ?? [])];
    const e = this.data.entry;
    if (!e) {
      if (this.kind === 'metric') this.addAggregate();
      return;
    }
    this.isEdit = true;
    this.wasApproved = e.status !== 'draft';
    this.name = e.name;
    this.description = e.description ?? '';
    const d = e.definition ?? {};
    if (this.kind === 'term') {
      this.meaning = d.meaning ?? '';
      this.synonyms = [...(d.synonyms ?? [])];
      if (d.maps_to?.table) {
        this.mapEnabled = true;
        this.mapTable = d.maps_to.table;
        this.mapField = d.maps_to.field ?? '';
        this.mapValue = d.maps_to.value ?? '';
        this.mapFilter = d.maps_to.filter ?? '';
        this.mapMode = this.mapValue
          ? 'value'
          : this.mapFilter
            ? 'filter'
            : 'none';
        this.loadTable(this.mapTable);
      }
      return;
    }
    this.table = d.table ?? '';
    this.filter = d.filter ?? '';
    this.params = (d.params ?? []).map((p: SemanticParam) => ({
      name: p.name,
      type: p.type,
      required: p.required !== false,
      description: p.description ?? '',
    }));
    if (this.kind === 'metric') {
      this.aggregates = (d.aggregates ?? []).map((a: MetricAggregate) => ({
        ...a,
        alias: a.alias ?? '',
      }));
      this.groupBy = [...(d.group_by ?? [])];
      this.unit = d.unit ?? '';
    } else {
      this.question = d.question ?? '';
      this.fields = [...(d.fields ?? [])];
      this.order = d.order ?? '';
      this.limit = d.limit ?? null;
      this.related = (d.related ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => !!s);
    }
    this.loadTable(this.table);
  }

  // ----- schema pickers -----

  private loadTable(table: string) {
    if (!table || table in this.tableInfo) return;
    if (!this.tables.includes(table)) this.tables = [...this.tables, table];
    this.tableInfo[table] = undefined;
    this.api.table(this.data.service, table).subscribe(info => {
      this.tableInfo[table] = info;
    });
  }

  fieldsOf(table: string): string[] {
    return this.tableInfo[table]?.fields ?? [];
  }

  /** Current selections are always offered, even if the schema no longer has them. */
  fieldOptions(table: string, selected: string[] = []): string[] {
    const known = this.fieldsOf(table);
    return [...known, ...selected.filter(s => s && !known.includes(s))];
  }

  relatedOptions(): string[] {
    const known = this.tableInfo[this.table]?.related ?? [];
    return [...known, ...this.related.filter(r => !known.includes(r))];
  }

  onTableChange(table: string) {
    this.table = table;
    this.loadTable(table);
    this.aggregates = this.aggregates.map(a => ({
      ...a,
      field: a.field === '*' ? '*' : '',
    }));
    this.groupBy = [];
    this.fields = [];
    this.related = [];
  }

  onMapTableChange(table: string) {
    this.mapTable = table;
    this.mapField = '';
    this.loadTable(table);
  }

  onMapFieldChange(field: string) {
    this.mapField = field;
    if (!field && this.mapMode === 'value') this.mapMode = 'none';
  }

  // ----- term synonyms -----

  addSynonym(event: MatChipInputEvent) {
    const v = (event.value ?? '').trim();
    if (v && !this.synonyms.includes(v)) this.synonyms.push(v);
    event.chipInput?.clear();
  }

  removeSynonym(s: string) {
    this.synonyms = this.synonyms.filter(x => x !== s);
  }

  // ----- metric aggregates -----

  addAggregate() {
    this.aggregates.push({ function: 'SUM', field: '', alias: '' });
  }

  removeAggregate(i: number) {
    this.aggregates.splice(i, 1);
  }

  onFunctionChange(a: MetricAggregate, fn: string) {
    a.function = fn;
    if (fn !== 'COUNT' && a.field === '*') a.field = '';
  }

  aggregateFieldOptions(a: MetricAggregate): string[] {
    const opts = this.fieldOptions(
      this.table,
      [a.field].filter(f => f !== '*')
    );
    return a.function === 'COUNT' ? ['*', ...opts] : opts;
  }

  // ----- params -----

  addParam(name = '') {
    this.params.push({ name, type: 'string', required: true, description: '' });
  }

  removeParam(i: number) {
    this.params.splice(i, 1);
  }

  get mismatch() {
    return paramMismatch(this.filter, this.params);
  }

  get hasMismatch() {
    const m = this.mismatch;
    return m.undeclared.length > 0 || m.unused.length > 0;
  }

  declareMissing() {
    this.mismatch.undeclared.forEach(n => this.addParam(n));
  }

  // ----- save -----

  private rawDefinition(): any {
    if (this.kind === 'term') {
      return {
        meaning: this.meaning,
        synonyms: this.synonyms,
        maps_to: this.mapEnabled
          ? {
              table: this.mapTable,
              field: this.mapField,
              value: this.mapMode === 'value' ? this.mapValue : '',
              filter: this.mapMode === 'filter' ? this.mapFilter : '',
            }
          : undefined,
      };
    }
    if (this.kind === 'metric') {
      return {
        table: this.table,
        aggregates: this.aggregates,
        filter: this.filter,
        group_by: this.groupBy,
        unit: this.unit,
        params: this.params,
      };
    }
    return {
      question: this.question,
      table: this.table,
      fields: this.fields,
      filter: this.filter,
      order: this.order,
      limit: this.limit,
      related: this.related.join(','),
      params: this.params,
    };
  }

  save() {
    this.serverError = '';
    const raw = this.rawDefinition();
    this.clientErrors = validateDefinition(this.kind, raw, this.name);
    if (this.kind === 'term' && this.mapEnabled && !this.mapTable) {
      this.clientErrors.push('Pick the table this term maps to.');
    }
    if (this.kind === 'term' && this.mapMode === 'value' && !this.mapValue) {
      this.clientErrors.push('Enter the value this term maps to.');
    }
    if (this.clientErrors.length) return;

    const definition = cleanDefinition(this.kind, raw);
    const name = this.name.trim();
    const description = this.description.trim();
    const e = this.data.entry;
    let req;
    if (!e) {
      req = this.api.create(this.data.service, {
        kind: this.kind,
        name,
        ...(description ? { description } : {}),
        definition,
      });
    } else {
      const patch: Record<string, unknown> = {};
      if (name !== e.name) patch['name'] = name;
      if (description !== (e.description ?? '')) {
        patch['description'] = description;
      }
      if (stableStringify(definition) !== stableStringify(e.definition)) {
        patch['definition'] = definition;
      }
      if (!Object.keys(patch).length) {
        this.dialogRef.close(e);
        return;
      }
      req = this.api.update(this.data.service, e.id, patch);
    }
    this.saving = true;
    req.subscribe({
      next: saved => {
        this.saving = false;
        this.dialogRef.close(saved);
      },
      error: err => {
        this.saving = false;
        this.serverError = serverMessage(err);
      },
    });
  }

  trackByIndex(i: number) {
    return i;
  }
}
