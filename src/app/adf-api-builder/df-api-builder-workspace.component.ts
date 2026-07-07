import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BASE_URL } from '../shared/constants/urls';

interface SvcRow {
  id: number;
  name: string;
  type: string;
  label?: string;
}
// NOTE: the app's case interceptor maps response keys snake_case -> camelCase
// (and request body keys camelCase -> snake_case), so this component speaks
// camelCase on both sides. Query params are NOT transformed (kept snake_case).
interface WorkspaceLink {
  id: number;
  apiId: number;
  serviceId: number;
}
interface RelRow {
  id: number;
  service: string;
  table: string;
  type: string;
  name: string;
  alias?: string;
  refService?: string;
  refTable?: string;
}

/**
 * Workspace + cross-service relationship builder for a single custom API.
 *
 * Lets an admin pick which backing services a custom API may compose, then
 * relate a table/field in one of those services to a table/field in another.
 * Talks to the API Builder backend resources:
 *   /api_builder/services       (workspace links)
 *   /api_builder/relationships  (native db_virtual_relationship + cache flush)
 *
 * This is a presentation layer over DreamFactory's native virtual relationship
 * system. Relationships are shared schema configuration, not private endpoint
 * metadata, so the UI makes their scope explicit.
 */
@Component({
  selector: 'df-api-builder-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="ws-card" *ngIf="apiId">
      <div class="ws-intro">
        <div>
          <h3>Data sources</h3>
          <p>
            Choose the services this API can use, then connect related records
            when an endpoint needs data from more than one source.
          </p>
        </div>
        <span class="ws-count">
          {{ workspace.length }} source{{ workspace.length === 1 ? '' : 's' }}
        </span>
      </div>

      <p class="ws-scope-note">
        <mat-icon>info</mat-icon>
        <span>
          Relationships use DreamFactory's shared schema configuration and can
          be reused by other APIs.
        </span>
      </p>

      <h4 class="ws-step">Available to this API</h4>
      <p class="ws-hint">Endpoints can only read from sources listed here.</p>

      <div class="ws-source-list" *ngIf="workspace.length; else noSources">
        <div class="ws-source" *ngFor="let link of workspace">
          <span>
            <mat-icon class="ws-li-icon">storage</mat-icon>
            <strong>{{ serviceLabel(link.serviceId) }}</strong>
            <small>{{ serviceType(link.serviceId) }}</small>
          </span>
          <button
            mat-icon-button
            type="button"
            aria-label="Remove data source"
            matTooltip="Remove from this API"
            (click)="removeService(link)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      <ng-template #noSources>
        <p class="ws-empty-card">
          Add the first data source before creating endpoints.
        </p>
      </ng-template>

      <div class="ws-add">
        <mat-form-field appearance="outline">
          <mat-label>Add a data source</mat-label>
          <mat-select [(ngModel)]="serviceToAdd">
            <mat-option *ngFor="let s of addableServices()" [value]="s.id">
              {{ s.label || s.name }} ({{ s.type }})
            </mat-option>
          </mat-select>
        </mat-form-field>
        <button
          mat-stroked-button
          type="button"
          [disabled]="!serviceToAdd"
          (click)="addService()">
          <mat-icon>add</mat-icon>
          Add source
        </button>
      </div>

      <div class="ws-divider"></div>

      <div class="ws-section-head">
        <div>
          <h4>Related data</h4>
          <p>
            Connect records across sources so endpoints can return them
            together.
          </p>
        </div>
        <button
          mat-stroked-button
          type="button"
          [disabled]="workspace.length < 1"
          (click)="toggleRelationshipEditor()">
          <mat-icon>{{
            relationshipEditorOpen ? 'close' : 'add_link'
          }}</mat-icon>
          {{ relationshipEditorOpen ? 'Close' : 'Add related data' }}
        </button>
      </div>

      <div class="ws-relationships" *ngIf="relationships.length">
        <div class="ws-relationship" *ngFor="let r of relationships">
          <mat-icon>account_tree</mat-icon>
          <span>
            <strong>{{ r.alias || r.name }}</strong>
            <small>{{ relationshipSummary(r) }}</small>
          </span>
          <span class="ws-shared-badge">Shared</span>
          <button
            mat-icon-button
            type="button"
            color="warn"
            aria-label="Delete shared relationship"
            matTooltip="Delete shared schema relationship"
            (click)="removeRelationship(r)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>
      <p class="ws-empty-inline" *ngIf="!relationships.length">
        No related data configured yet.
      </p>

      <section class="ws-rel-editor" *ngIf="relationshipEditorOpen">
        <div class="ws-editor-heading">
          <span class="ws-step-number">1</span>
          <span>
            <strong>Choose the starting data</strong>
            <small>The records your endpoint returns first.</small>
          </span>
        </div>

        <div class="ws-rel-grid">
          <mat-form-field appearance="outline">
            <mat-label>Data source</mat-label>
            <mat-select
              [(ngModel)]="rel.service"
              (selectionChange)="sourceChanged('local')">
              <mat-option
                *ngFor="let s of workspaceServices()"
                [value]="s.name">
                {{ s.label || s.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Table</mat-label>
            <mat-select
              [(ngModel)]="rel.table"
              [disabled]="!rel.service"
              (selectionChange)="tableChanged('local')">
              <mat-option *ngFor="let t of localTables" [value]="t">
                {{ t }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Matching field</mat-label>
            <mat-select [(ngModel)]="rel.field" [disabled]="!rel.table">
              <mat-option *ngFor="let f of localFields" [value]="f">
                {{ f }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="ws-editor-heading">
          <span class="ws-step-number">2</span>
          <span>
            <strong>Add the related data</strong>
            <small
              >Choose what should be attached to each starting record.</small
            >
          </span>
        </div>

        <div class="ws-rel-grid">
          <mat-form-field appearance="outline">
            <mat-label>Relationship</mat-label>
            <mat-select [(ngModel)]="rel.type">
              <mat-option value="belongs_to">Many to one</mat-option>
              <mat-option value="has_one">One to one</mat-option>
              <mat-option value="has_many">One to many</mat-option>
              <mat-option value="many_many">Many to many</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Related source</mat-label>
            <mat-select
              [(ngModel)]="rel.ref_service"
              (selectionChange)="sourceChanged('ref')">
              <mat-option
                *ngFor="let s of workspaceServices()"
                [value]="s.name">
                {{ s.label || s.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Related table</mat-label>
            <mat-select
              [(ngModel)]="rel.ref_table"
              [disabled]="!rel.ref_service"
              (selectionChange)="tableChanged('ref')">
              <mat-option *ngFor="let t of refTables" [value]="t">
                {{ t }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Related field</mat-label>
            <mat-select [(ngModel)]="rel.ref_field" [disabled]="!rel.ref_table">
              <mat-option *ngFor="let f of refFields" [value]="f">
                {{ f }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <p class="ws-type-hint">{{ typeHint() }}</p>

        <div class="ws-junction" *ngIf="rel.type === 'many_many'">
          <div class="ws-editor-heading compact">
            <mat-icon>device_hub</mat-icon>
            <span>
              <strong>Junction table</strong>
              <small
                >Tell DreamFactory how the two datasets are connected.</small
              >
            </span>
          </div>
          <div class="ws-rel-grid">
            <mat-form-field appearance="outline">
              <mat-label>Junction source</mat-label>
              <mat-select
                [(ngModel)]="rel.junction_service"
                (selectionChange)="sourceChanged('junction')">
                <mat-option
                  *ngFor="let s of workspaceServices()"
                  [value]="s.name">
                  {{ s.label || s.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Junction table</mat-label>
              <mat-select
                [(ngModel)]="rel.junction_table"
                [disabled]="!rel.junction_service"
                (selectionChange)="tableChanged('junction')">
                <mat-option *ngFor="let t of junctionTables" [value]="t">
                  {{ t }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Field matching start</mat-label>
              <mat-select
                [(ngModel)]="rel.junction_field"
                [disabled]="!rel.junction_table">
                <mat-option *ngFor="let f of junctionFields" [value]="f">
                  {{ f }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Field matching related</mat-label>
              <mat-select
                [(ngModel)]="rel.junction_ref_field"
                [disabled]="!rel.junction_table">
                <mat-option *ngFor="let f of junctionFields" [value]="f">
                  {{ f }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="ws-output-name">
          <mat-form-field appearance="outline">
            <mat-label>Return this data as</mat-label>
            <input
              matInput
              maxlength="100"
              [(ngModel)]="rel.name"
              placeholder="e.g. customer" />
            <mat-hint>Optional response field name</mat-hint>
          </mat-form-field>
        </div>

        <div class="ws-rel-footer">
          <p class="ws-rel-preview" *ngIf="relPreview()">
            <mat-icon>arrow_forward</mat-icon>
            <span>{{ relPreview() }}</span>
          </p>
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!relReady()"
            (click)="createRelationship()">
            Save relationship
          </button>
        </div>
      </section>
    </mat-card>
  `,
  styles: [
    `
      .ws-card {
        margin-top: 16px;
        padding: 16px;
      }
      .ws-intro {
        border-left: 3px solid #3f51b5;
        padding-left: 12px;
        margin-bottom: 16px;
      }
      .ws-intro h3 {
        margin: 0 0 4px;
      }
      .ws-intro p {
        color: rgba(0, 0, 0, 0.7);
        font-size: 13px;
        margin: 0;
        max-width: 720px;
      }
      .ws-step {
        margin: 20px 0 4px;
        font-size: 15px;
      }
      .ws-subhead {
        font-weight: 600;
        font-size: 13px;
        margin: 14px 0 4px;
      }
      .ws-hint {
        color: rgba(0, 0, 0, 0.6);
        font-size: 12px;
        margin: 0 0 8px;
        max-width: 720px;
      }
      .ws-list {
        list-style: none;
        padding: 0;
        margin: 0 0 12px;
      }
      .ws-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px 0;
      }
      .ws-li-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        vertical-align: middle;
        margin-right: 6px;
        opacity: 0.6;
      }
      .ws-rel-detail {
        color: rgba(0, 0, 0, 0.55);
        font-size: 12px;
      }
      .ws-empty {
        color: rgba(0, 0, 0, 0.45);
        font-style: italic;
      }
      .ws-add,
      .ws-rel-form {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .ws-rel-form mat-form-field {
        width: 150px;
      }
      .ws-rel-form .ws-name-field {
        width: 240px;
      }
      .ws-side-label {
        flex-basis: 100%;
        font-weight: 600;
        font-size: 12px;
        color: #3f51b5;
        margin-top: 8px;
      }
      .ws-type-hint {
        flex-basis: 100%;
        color: rgba(0, 0, 0, 0.6);
        font-size: 12px;
        margin: 0;
      }
      .ws-rel-footer {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      .ws-rel-preview {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-family: monospace;
        font-size: 13px;
        background: #f2f3fb;
        color: #303f9f;
        padding: 6px 10px;
        border-radius: 4px;
      }
      .ws-rel-preview mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
      .ws-intro {
        align-items: flex-start;
        display: flex;
        justify-content: space-between;
      }
      .ws-count,
      .ws-shared-badge {
        background: rgba(63, 81, 181, 0.1);
        border-radius: 999px;
        color: #303f9f;
        flex: none;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 9px;
      }
      .ws-scope-note {
        align-items: center;
        background: rgba(63, 81, 181, 0.06);
        border-radius: 6px;
        display: flex;
        font-size: 12px;
        gap: 8px;
        margin: 0 0 14px;
        padding: 8px 10px;
      }
      .ws-scope-note mat-icon {
        color: #3f51b5;
        flex: none;
        font-size: 18px;
        height: 18px;
        width: 18px;
      }
      .ws-source-list,
      .ws-relationships {
        display: grid;
        gap: 8px;
        margin: 8px 0 12px;
      }
      .ws-source,
      .ws-relationship {
        align-items: center;
        border: 1px solid rgba(127, 127, 127, 0.22);
        border-radius: 7px;
        display: flex;
        gap: 10px;
        min-height: 48px;
        padding: 4px 6px 4px 12px;
      }
      .ws-source > span,
      .ws-relationship > span:not(.ws-shared-badge) {
        align-items: center;
        display: flex;
        flex: 1;
        gap: 7px;
        min-width: 0;
      }
      .ws-source small,
      .ws-relationship small {
        opacity: 0.65;
      }
      .ws-relationship > mat-icon {
        color: #3f51b5;
      }
      .ws-relationship > span:not(.ws-shared-badge) {
        align-items: flex-start;
        flex-direction: column;
        gap: 1px;
      }
      .ws-empty-card,
      .ws-empty-inline {
        border: 1px dashed rgba(127, 127, 127, 0.35);
        border-radius: 7px;
        margin: 8px 0 12px;
        opacity: 0.7;
        padding: 12px;
      }
      .ws-empty-inline {
        border: 0;
        padding: 0;
      }
      .ws-add mat-form-field {
        min-width: 320px;
      }
      .ws-divider {
        border-top: 1px solid rgba(127, 127, 127, 0.2);
        margin: 10px 0 18px;
      }
      .ws-section-head {
        align-items: center;
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }
      .ws-section-head h4,
      .ws-section-head p {
        margin: 0;
      }
      .ws-section-head p {
        font-size: 12px;
        opacity: 0.7;
      }
      .ws-rel-editor {
        background: rgba(127, 127, 127, 0.035);
        border: 1px solid rgba(63, 81, 181, 0.3);
        border-radius: 8px;
        display: grid;
        gap: 14px;
        margin-top: 14px;
        padding: 14px;
      }
      .ws-editor-heading {
        align-items: center;
        display: flex;
        gap: 10px;
      }
      .ws-editor-heading > span:last-child {
        display: flex;
        flex-direction: column;
      }
      .ws-editor-heading small {
        opacity: 0.68;
      }
      .ws-editor-heading.compact {
        margin-bottom: 10px;
      }
      .ws-step-number {
        align-items: center;
        background: #3f51b5;
        border-radius: 50%;
        color: #fff;
        display: inline-flex;
        flex: none;
        font-weight: 700;
        height: 26px;
        justify-content: center;
        width: 26px;
      }
      .ws-rel-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(4, minmax(150px, 1fr));
      }
      .ws-rel-grid mat-form-field {
        min-width: 0;
        width: auto;
      }
      .ws-junction {
        background: rgba(63, 81, 181, 0.05);
        border-radius: 7px;
        padding: 12px;
      }
      .ws-output-name mat-form-field {
        max-width: 360px;
        width: 100%;
      }
      .ws-rel-footer {
        justify-content: space-between;
      }
      @media (max-width: 980px) {
        .ws-intro,
        .ws-section-head {
          align-items: stretch;
          flex-direction: column;
        }
        .ws-rel-grid {
          grid-template-columns: 1fr;
        }
        .ws-add mat-form-field {
          min-width: 0;
          width: 100%;
        }
      }
    `,
  ],
})
export class DfApiBuilderWorkspaceComponent implements OnChanges {
  @Input() apiId: number | null = null;
  /** Fires when the workspace service set changes, so the host can refresh. */
  @Output() workspaceChanged = new EventEmitter<void>();

  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  allServices: SvcRow[] = [];
  workspace: WorkspaceLink[] = [];
  relationships: RelRow[] = [];

  serviceToAdd: number | null = null;
  relationshipEditorOpen = false;

  localTables: string[] = [];
  localFields: string[] = [];
  refTables: string[] = [];
  refFields: string[] = [];
  junctionTables: string[] = [];
  junctionFields: string[] = [];

  rel: {
    service: string | null;
    table: string | null;
    field: string | null;
    type: string;
    ref_service: string | null;
    ref_table: string | null;
    ref_field: string | null;
    junction_service: string | null;
    junction_table: string | null;
    junction_field: string | null;
    junction_ref_field: string | null;
    name: string;
  } = this.emptyRel();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['apiId'] && this.apiId) {
      this.loadServices();
      this.loadWorkspace();
      this.loadRelationships();
      this.rel = this.emptyRel();
    }
  }

  private emptyRel() {
    return {
      service: null,
      table: null,
      field: null,
      type: 'belongs_to',
      ref_service: null,
      ref_table: null,
      ref_field: null,
      junction_service: null,
      junction_table: null,
      junction_field: null,
      junction_ref_field: null,
      name: '',
    };
  }

  serviceName(id: number): string {
    return this.allServices.find(s => s.id === id)?.name ?? `#${id}`;
  }

  serviceLabel(id: number): string {
    const service = this.allServices.find(s => s.id === id);
    return service?.label || service?.name || `#${id}`;
  }

  serviceType(id: number): string {
    return this.allServices.find(s => s.id === id)?.type ?? 'service';
  }

  workspaceServices(): SvcRow[] {
    const ids = new Set(this.workspace.map(w => w.serviceId));
    return this.allServices.filter(s => ids.has(s.id));
  }

  addableServices(): SvcRow[] {
    const ids = new Set(this.workspace.map(w => w.serviceId));
    return this.allServices.filter(s => !ids.has(s.id));
  }

  relReady(): boolean {
    const r = this.rel;
    const baseReady = !!(
      r.service &&
      r.table &&
      r.field &&
      r.ref_service &&
      r.ref_table &&
      r.ref_field
    );
    if (!baseReady) {
      return false;
    }
    if (r.type !== 'many_many') {
      return true;
    }
    return !!(
      r.junction_service &&
      r.junction_table &&
      r.junction_field &&
      r.junction_ref_field
    );
  }

  toggleRelationshipEditor(): void {
    this.relationshipEditorOpen = !this.relationshipEditorOpen;
    if (!this.relationshipEditorOpen) {
      this.rel = this.emptyRel();
    }
  }

  relationshipSummary(r: RelRow): string {
    const type = this.relationshipTypeLabel(r.type);
    const target =
      r.refService && r.refTable
        ? `${r.refService}.${r.refTable}`
        : 'related dataset';
    return `${type} from ${r.service}.${r.table} to ${target}`;
  }

  private relationshipTypeLabel(type: string): string {
    switch (type) {
      case 'belongs_to':
        return 'Many to one';
      case 'has_one':
        return 'One to one';
      case 'has_many':
        return 'One to many';
      case 'many_many':
        return 'Many to many';
      default:
        return type.replaceAll('_', ' ');
    }
  }

  /** A plain-language preview of the relationship being built. */
  relPreview(): string {
    const r = this.rel;
    if (!r.service || !r.table || !r.field) {
      return '';
    }
    const left = `${r.service}.${r.table}.${r.field}`;
    const verb = r.type.replace('_', ' ');
    const right =
      r.ref_service && r.ref_table && r.ref_field
        ? `${r.ref_service}.${r.ref_table}.${r.ref_field}`
        : '(choose the related record)';
    const as = r.name ? `, attached as "${r.name}"` : '';
    return `${left} ${verb} ${right}${as}`;
  }

  /** One-line explanation of the selected relationship type. */
  typeHint(): string {
    switch (this.rel.type) {
      case 'belongs_to':
        return 'Each record here points to one record in the other service (an order belongs to one customer).';
      case 'has_many':
        return 'Each record here links to many records in the other service (a customer has many orders).';
      case 'has_one':
        return 'Each record here links to exactly one record in the other service.';
      case 'many_many':
        return 'Many records on each side connect through a junction table.';
      default:
        return '';
    }
  }

  private loadServices(): void {
    this.http
      .get<{ resource: SvcRow[] }>(`${BASE_URL}/system/service`, {
        params: { fields: 'id,name,type,label', limit: 500 },
      })
      .subscribe(r => (this.allServices = r.resource ?? []));
  }

  private loadWorkspace(): void {
    this.http
      .get<{ resource: WorkspaceLink[] }>(`${BASE_URL}/api_builder/services`, {
        params: { filter: `api_id=${this.apiId}` },
      })
      .subscribe(r => (this.workspace = r.resource ?? []));
  }

  private loadRelationships(): void {
    this.http
      .get<{ resource: RelRow[] }>(`${BASE_URL}/api_builder/relationships`, {
        params: { api_id: `${this.apiId}` },
      })
      .subscribe(r => (this.relationships = r.resource ?? []));
  }

  addService(): void {
    if (!this.serviceToAdd || !this.apiId) {
      return;
    }
    this.http
      .post(`${BASE_URL}/api_builder/services`, {
        // camelCase: the case interceptor maps these to api_id/service_id.
        resource: [{ apiId: this.apiId, serviceId: this.serviceToAdd }],
      })
      .subscribe({
        next: () => {
          this.serviceToAdd = null;
          this.loadWorkspace();
          this.workspaceChanged.emit();
        },
        error: e => this.fail(e),
      });
  }

  removeService(link: WorkspaceLink): void {
    this.http.delete(`${BASE_URL}/api_builder/services/${link.id}`).subscribe({
      next: () => {
        this.loadWorkspace();
        this.workspaceChanged.emit();
      },
      error: e => this.fail(e),
    });
  }

  sourceChanged(side: 'local' | 'ref' | 'junction'): void {
    if (side === 'local') {
      this.rel.table = null;
      this.rel.field = null;
      this.localTables = [];
      this.localFields = [];
      this.loadTables(this.rel.service, side);
      return;
    }
    if (side === 'ref') {
      this.rel.ref_table = null;
      this.rel.ref_field = null;
      this.refTables = [];
      this.refFields = [];
      this.loadTables(this.rel.ref_service, side);
      return;
    }
    this.rel.junction_table = null;
    this.rel.junction_field = null;
    this.rel.junction_ref_field = null;
    this.junctionTables = [];
    this.junctionFields = [];
    this.loadTables(this.rel.junction_service, side);
  }

  tableChanged(side: 'local' | 'ref' | 'junction'): void {
    if (side === 'local') {
      this.rel.field = null;
      this.loadFields(this.rel.service, this.rel.table, side);
      return;
    }
    if (side === 'ref') {
      this.rel.ref_field = null;
      this.loadFields(this.rel.ref_service, this.rel.ref_table, side);
      return;
    }
    this.rel.junction_field = null;
    this.rel.junction_ref_field = null;
    this.loadFields(this.rel.junction_service, this.rel.junction_table, side);
  }

  loadTables(service: string | null, side: 'local' | 'ref' | 'junction'): void {
    if (!service) {
      return;
    }
    this.http
      .get<{ resource: Array<{ name: string }> }>(
        `${BASE_URL}/${service}/_table`,
        {
          params: { fields: 'name' },
        }
      )
      .subscribe(r => {
        const names = (r.resource ?? []).map(t => t.name);
        if (side === 'local') {
          this.localTables = names;
        } else if (side === 'ref') {
          this.refTables = names;
        } else {
          this.junctionTables = names;
        }
      });
  }

  loadFields(
    service: string | null,
    table: string | null,
    side: 'local' | 'ref' | 'junction'
  ): void {
    if (!service || !table) {
      return;
    }
    this.http
      .get<{ field?: Array<{ name: string }> }>(
        `${BASE_URL}/${service}/_schema/${table}`,
        {
          params: { fields: 'name' },
        }
      )
      .subscribe(r => {
        const names = (r.field ?? []).map(f => f.name);
        if (side === 'local') {
          this.localFields = names;
        } else if (side === 'ref') {
          this.refFields = names;
        } else {
          this.junctionFields = names;
        }
      });
  }

  createRelationship(): void {
    if (!this.relReady() || !this.apiId) {
      return;
    }
    const r = this.rel;
    const payload: Record<string, unknown> = {
      // camelCase: interceptor maps to api_id/ref_service/ref_table/ref_field.
      apiId: this.apiId,
      service: r.service,
      table: r.table,
      field: r.field,
      type: r.type,
      refService: r.ref_service,
      refTable: r.ref_table,
      refField: r.ref_field,
      name: r.name || undefined,
    };
    if (r.type === 'many_many') {
      payload['junctionService'] = r.junction_service;
      payload['junctionTable'] = r.junction_table;
      payload['junctionField'] = r.junction_field;
      payload['junctionRefField'] = r.junction_ref_field;
    }
    this.http.post(`${BASE_URL}/api_builder/relationships`, payload).subscribe({
      next: () => {
        this.rel = this.emptyRel();
        this.relationshipEditorOpen = false;
        this.loadRelationships();
        this.snack.open('Relationship created.', 'OK', { duration: 2500 });
      },
      error: e => this.fail(e),
    });
  }

  removeRelationship(r: RelRow): void {
    const label = r.alias || r.name;
    if (
      !window.confirm(
        `Delete the shared relationship "${label}"? Other APIs using this DreamFactory schema relationship may stop working.`
      )
    ) {
      return;
    }
    this.http
      .delete(`${BASE_URL}/api_builder/relationships/${r.id}`)
      .subscribe({
        next: () => this.loadRelationships(),
        error: e => this.fail(e),
      });
  }

  private fail(e: any): void {
    const msg = e?.error?.error?.message ?? e?.message ?? 'Request failed.';
    this.snack.open(msg, 'Dismiss', { duration: 5000 });
  }
}
