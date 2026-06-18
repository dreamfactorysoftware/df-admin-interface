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
 * Rough first pass: functional, not styled.
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
        <h3>Workspace and relationships</h3>
        <p>
          Set up what this custom API is built from. First add the existing
          services you want to combine, then describe how their records relate.
          Once that is done, a single endpoint can return data from several
          services together (for example orders with their customer attached).
        </p>
      </div>

      <h4 class="ws-step">Step 1. Add the services to build from</h4>
      <p class="ws-hint">
        Pick the existing APIs (databases, files, remote services) this custom
        API is allowed to use. Endpoints and relationships can only reference
        services you add here, so this is the toolbox for this API.
      </p>

      <ul class="ws-list">
        <li *ngFor="let link of workspace">
          <span
            ><mat-icon class="ws-li-icon">storage</mat-icon
            >{{ serviceName(link.serviceId) }}</span
          >
          <button
            mat-icon-button
            color="warn"
            matTooltip="Remove from workspace"
            (click)="removeService(link)">
            <mat-icon>close</mat-icon>
          </button>
        </li>
        <li *ngIf="!workspace.length" class="ws-empty">
          No services added yet. Choose one below to get started.
        </li>
      </ul>

      <div class="ws-add">
        <mat-form-field appearance="outline">
          <mat-label>Add a service to this API</mat-label>
          <mat-select [(ngModel)]="serviceToAdd">
            <mat-option *ngFor="let s of addableServices()" [value]="s.id">
              {{ s.name }} ({{ s.type }})
            </mat-option>
          </mat-select>
        </mat-form-field>
        <button
          mat-stroked-button
          [disabled]="!serviceToAdd"
          (click)="addService()">
          Add to workspace
        </button>
      </div>

      <h4 class="ws-step">Step 2. Connect records across services</h4>
      <p class="ws-hint">
        Describe how a record in one service connects to records in another, so
        an endpoint can pull them together. Example: each order has a customer,
        even when orders live in one database and customers in another. Each
        relationship you add below becomes available to your endpoints.
      </p>

      <p class="ws-subhead" *ngIf="relationships.length">
        Relationships defined so far
      </p>
      <ul class="ws-list">
        <li *ngFor="let r of relationships">
          <span>
            <strong>{{ r.alias || r.name }}</strong>
            <span class="ws-rel-detail">
              ({{ r.type }} on {{ r.service }}.{{ r.table }})
            </span>
          </span>
          <button
            mat-icon-button
            color="warn"
            matTooltip="Delete relationship"
            (click)="removeRelationship(r)">
            <mat-icon>close</mat-icon>
          </button>
        </li>
        <li *ngIf="!relationships.length" class="ws-empty">
          No relationships yet. Build one below.
        </li>
      </ul>

      <p class="ws-subhead">Add a relationship</p>
      <p class="ws-hint">
        Read it as a sentence, left to right: start from the table your endpoint
        returns, choose the type of connection, then point at the related record
        in another service to attach.
      </p>

      <div class="ws-rel-form">
        <span class="ws-side-label">From: the record you start with</span>
        <mat-form-field appearance="outline">
          <mat-label>From service</mat-label>
          <mat-select
            [(ngModel)]="rel.service"
            (selectionChange)="loadTables(rel.service, 'local')">
            <mat-option
              *ngFor="let s of workspaceServices()"
              [value]="s.name"
              >{{ s.name }}</mat-option
            >
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>From table</mat-label>
          <mat-select
            [(ngModel)]="rel.table"
            (selectionChange)="loadFields(rel.service, rel.table, 'local')">
            <mat-option *ngFor="let t of localTables" [value]="t">{{
              t
            }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>From field</mat-label>
          <mat-select [(ngModel)]="rel.field">
            <mat-option *ngFor="let f of localFields" [value]="f">{{
              f
            }}</mat-option>
          </mat-select>
        </mat-form-field>

        <span class="ws-side-label">Connection type</span>
        <mat-form-field appearance="outline">
          <mat-label>How they relate</mat-label>
          <mat-select [(ngModel)]="rel.type">
            <mat-option value="belongs_to">belongs to (one)</mat-option>
            <mat-option value="has_many">has many</mat-option>
            <mat-option value="has_one">has one</mat-option>
          </mat-select>
        </mat-form-field>
        <p class="ws-type-hint">{{ typeHint() }}</p>

        <span class="ws-side-label">To: the related record to attach</span>
        <mat-form-field appearance="outline">
          <mat-label>To service</mat-label>
          <mat-select
            [(ngModel)]="rel.ref_service"
            (selectionChange)="loadTables(rel.ref_service, 'ref')">
            <mat-option
              *ngFor="let s of workspaceServices()"
              [value]="s.name"
              >{{ s.name }}</mat-option
            >
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>To table</mat-label>
          <mat-select
            [(ngModel)]="rel.ref_table"
            (selectionChange)="
              loadFields(rel.ref_service, rel.ref_table, 'ref')
            ">
            <mat-option *ngFor="let t of refTables" [value]="t">{{
              t
            }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>To field</mat-label>
          <mat-select [(ngModel)]="rel.ref_field">
            <mat-option *ngFor="let f of refFields" [value]="f">{{
              f
            }}</mat-option>
          </mat-select>
        </mat-form-field>

        <span class="ws-side-label">Attach as (optional)</span>
        <mat-form-field appearance="outline" class="ws-name-field">
          <mat-label>Attach as</mat-label>
          <input matInput [(ngModel)]="rel.name" placeholder="e.g. customer" />
        </mat-form-field>
        <p class="ws-type-hint">
          The key the related records are nested under in each returned record.
          Example: enter "customer" and every order comes back with a "customer"
          object attached. Leave blank to use a default key.
        </p>
      </div>

      <div class="ws-rel-footer">
        <p class="ws-rel-preview" *ngIf="relPreview()">
          <mat-icon>arrow_forward</mat-icon>
          <span>{{ relPreview() }}</span>
        </p>
        <button
          mat-flat-button
          color="primary"
          [disabled]="!relReady()"
          (click)="createRelationship()">
          Add relationship
        </button>
      </div>
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

  localTables: string[] = [];
  localFields: string[] = [];
  refTables: string[] = [];
  refFields: string[] = [];

  rel: {
    service: string | null;
    table: string | null;
    field: string | null;
    type: string;
    ref_service: string | null;
    ref_table: string | null;
    ref_field: string | null;
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
      name: '',
    };
  }

  serviceName(id: number): string {
    return this.allServices.find(s => s.id === id)?.name ?? `#${id}`;
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
    return !!(
      r.service &&
      r.table &&
      r.field &&
      r.ref_service &&
      r.ref_table &&
      r.ref_field
    );
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

  loadTables(service: string | null, side: 'local' | 'ref'): void {
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
        } else {
          this.refTables = names;
        }
      });
  }

  loadFields(
    service: string | null,
    table: string | null,
    side: 'local' | 'ref'
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
        } else {
          this.refFields = names;
        }
      });
  }

  createRelationship(): void {
    if (!this.relReady() || !this.apiId) {
      return;
    }
    const r = this.rel;
    this.http
      .post(`${BASE_URL}/api_builder/relationships`, {
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
      })
      .subscribe({
        next: () => {
          this.rel = this.emptyRel();
          this.loadRelationships();
          this.snack.open('Relationship created.', 'OK', { duration: 2500 });
        },
        error: e => this.fail(e),
      });
  }

  removeRelationship(r: RelRow): void {
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
