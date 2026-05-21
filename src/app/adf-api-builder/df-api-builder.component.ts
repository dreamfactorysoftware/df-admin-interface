import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize } from 'rxjs';
import { BASE_URL } from '../shared/constants/urls';
import { GenericListResponse } from '../shared/types/generic-http';
import { ApiBuilderMapperService } from './api-builder-mapper.service';

type ApiDefinition = {
  id: number;
  name: string;
  label?: string;
  description?: string;
  basePath?: string;
  base_path?: string;
  status?: string;
  version?: string;
};

type EndpointDefinition = {
  id: number;
  apiId?: number;
  api_id?: number;
  method: string;
  path: string;
  label?: string;
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  executionPlan?: unknown;
  execution_plan?: unknown;
  responseMapping?: unknown;
  response_mapping?: unknown;
  requestSchema?: unknown;
  request_schema?: unknown;
};

type StepPreview = {
  title: string;
  detail: string;
};

type SourceService = {
  name: string;
  label?: string;
  type: string;
};

type SourceServiceGroup = {
  label: string;
  services: SourceService[];
};

type SourceTable = {
  name: string;
  label?: string;
  source?: 'openapi' | 'schema';
};

type SourceField = {
  name: string;
  label?: string;
  type?: string;
  dbType?: string;
  db_type?: string;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  required?: boolean;
  default?: unknown;
  isPrimaryKey?: boolean;
  is_primary_key?: boolean;
  isUnique?: boolean;
  is_unique?: boolean;
  isIndex?: boolean;
  is_index?: boolean;
  isForeignKey?: boolean;
  is_foreign_key?: boolean;
  refTable?: string | null;
  ref_table?: string | null;
  refField?: string | null;
  ref_field?: string | null;
  allowNull?: boolean;
  allow_null?: boolean;
  openapi?: Record<string, unknown>;
  raw?: Record<string, unknown>;
};

type SourceRelationship = {
  name: string;
  label?: string;
  type?: string;
  field?: string;
  refTable?: string;
  ref_table?: string;
  refField?: string;
  ref_field?: string;
};

type SourceSchemaResponse = {
  service: string;
  table?: {
    name: string;
    label?: string;
  };
  primaryKey?: SourceField;
  primary_key?: SourceField;
  resource?: SourceTable[] | SourceField[];
  relationships?: SourceRelationship[];
  raw?: unknown;
};

type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like';

type FilterRule = {
  field: string;
  operator: FilterOperator;
  value: string;
};

type OutputShape = 'data' | 'table';

type FilterOperatorOption = {
  value: FilterOperator;
  label: string;
};

type OpenApiDocument = {
  openapi?: string;
  swagger?: string;
  paths?: Record<string, unknown>;
};

@Component({
  selector: 'df-api-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  template: `
    <section class="builder-shell">
      <header class="builder-header">
        <div>
          <p class="eyebrow">API Builder</p>
          <h1>{{ editorOpen ? editorTitle : 'Custom APIs' }}</h1>
          <p>
            {{
              editorOpen
                ? 'Choose data sources and fields; API Builder generates the route and DreamFactory calls.'
                : 'Manage built APIs, open one to edit endpoints, or create a new API.'
            }}
          </p>
        </div>
        <div class="header-actions">
          <button
            mat-button
            *ngIf="editorOpen"
            type="button"
            (click)="closeEditor()">
            <mat-icon>arrow_back</mat-icon>
            All APIs
          </button>
          <button
            mat-flat-button
            color="primary"
            *ngIf="!editorOpen"
            type="button"
            (click)="newApi()">
            <mat-icon>add</mat-icon>
            New API
          </button>
        </div>
      </header>

      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <div class="api-list" *ngIf="!editorOpen">
        <mat-card class="create-card" (click)="newApi()">
          <mat-card-content>
            <mat-icon>add_circle</mat-icon>
            <strong>Create API</strong>
            <span>Start a custom API with one or more endpoints.</span>
          </mat-card-content>
        </mat-card>

        <mat-card
          class="api-card"
          *ngFor="let api of apis"
          (click)="selectApi(api.id)">
          <mat-card-header>
            <mat-icon mat-card-avatar>api</mat-icon>
            <mat-card-title>{{ api.label || api.name }}</mat-card-title>
            <mat-card-subtitle
              >/{{ api.basePath || api.base_path }}</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content>
            <p>{{ api.description || 'No description yet.' }}</p>
            <div class="card-meta">
              <span>{{ api.status || 'draft' }}</span>
              <span>{{ endpointCount(api.id) }} endpoints</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div
        class="empty-state"
        *ngIf="!editorOpen && !loading && apis.length === 0">
        <mat-icon>api</mat-icon>
        <strong>No custom APIs yet</strong>
        <span
          >Create one to start composing database, RWS, and scripted
          calls.</span
        >
      </div>

      <div class="builder-workbench" *ngIf="editorOpen">
        <mat-card class="endpoint-builder-card">
          <mat-card-header>
            <mat-card-title>Build Endpoint</mat-card-title>
            <mat-card-subtitle>
              Pick a table, remove fields, add filters, and decide whether the
              URL accepts an ID.
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form
              [formGroup]="apiForm"
              class="api-strip"
              (ngSubmit)="saveApi()">
              <mat-form-field appearance="outline">
                <mat-label>API Name</mat-label>
                <input matInput formControlName="label" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>API URL</mat-label>
                <input matInput formControlName="basePath" />
              </mat-form-field>
              <button
                mat-stroked-button
                color="primary"
                type="submit"
                [disabled]="apiForm.invalid || saving">
                <mat-icon>save</mat-icon>
                Save API
              </button>
            </form>

            <form
              [formGroup]="endpointForm"
              class="endpoint-shell"
              (ngSubmit)="saveEndpoint(false)">
              <div class="route-preview hero-preview">
                <mat-icon>route</mat-icon>
                <span>
                  <strong>{{ generatedRouteLabel }}</strong>
                  <small>{{ sourceSummary }}</small>
                </span>
              </div>

              <div class="source-builder" [formGroup]="sourceForm">
                <mat-form-field appearance="outline">
                  <mat-label>Find Source API</mat-label>
                  <input
                    matInput
                    [value]="sourceServiceSearch"
                    (input)="sourceServiceSearch = $any($event.target).value" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Source API</mat-label>
                  <mat-select
                    formControlName="service"
                    (selectionChange)="loadTables($event.value)">
                    <mat-optgroup
                      *ngFor="let group of groupedSourceServices"
                      [label]="group.label">
                      <mat-option
                        *ngFor="let service of group.services"
                        [value]="service.name">
                        {{ service.label || service.name }}
                        ({{ service.type }} · {{ introspectionBadge(service) }})
                      </mat-option>
                    </mat-optgroup>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Table</mat-label>
                  <mat-select
                    formControlName="table"
                    (selectionChange)="loadFields($event.value)">
                    <mat-option
                      *ngFor="let table of sourceTables"
                      [value]="table.name">
                      {{ table.label || titleFromName(table.name) }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-checkbox
                  class="id-toggle"
                  formControlName="includeId"
                  (change)="generateEndpointFromSource()">
                  Pass an ID in the URL
                </mat-checkbox>
              </div>

              <section class="builder-section" *ngIf="sourceFields.length">
                <div class="section-heading">
                  <span>
                    <strong>Fields</strong>
                    <small>Uncheck anything this endpoint should hide.</small>
                  </span>
                  <span
                    >{{ selectedFieldNames.length }} of
                    {{ sourceFields.length }}</span
                  >
                </div>
                <div class="field-toolbar">
                  <mat-form-field appearance="outline">
                    <mat-label>Find Fields</mat-label>
                    <input
                      matInput
                      [value]="fieldSearch"
                      (input)="fieldSearch = $any($event.target).value" />
                  </mat-form-field>
                  <button mat-button type="button" (click)="selectAllFields()">
                    <mat-icon>select_all</mat-icon>
                    Select All
                  </button>
                  <button mat-button type="button" (click)="clearAllFields()">
                    <mat-icon>deselect</mat-icon>
                    Clear
                  </button>
                </div>
                <div class="field-grid">
                  <mat-checkbox
                    *ngFor="let field of displayedSourceFields"
                    [checked]="isFieldSelected(field.name)"
                    (change)="toggleField(field.name, $event.checked)">
                    <span class="field-name">{{
                      field.label || titleFromName(field.name)
                    }}</span>
                    <small>{{ fieldTypeLabel(field) }}</small>
                    <span class="field-badge" *ngIf="isPrimaryKey(field)"
                      >Primary key</span
                    >
                    <span class="field-badge" *ngIf="isUnique(field)"
                      >Unique</span
                    >
                    <span class="field-badge" *ngIf="isForeignKey(field)"
                      >Relationship</span
                    >
                    <span
                      class="field-badge"
                      *ngIf="field.allowNull ?? field.allow_null"
                      >Nullable</span
                    >
                  </mat-checkbox>
                </div>
              </section>

              <section
                class="builder-section"
                *ngIf="sourceRelationships.length">
                <div class="section-heading">
                  <span>
                    <strong>Relationships</strong>
                    <small
                      >Choose related resources to include in the same
                      call.</small
                    >
                  </span>
                </div>
                <div class="relationship-grid">
                  <mat-checkbox
                    class="relationship-pill"
                    *ngFor="let relationship of sourceRelationships"
                    [checked]="isRelationshipSelected(relationship.name)"
                    (change)="
                      toggleRelationship(relationship.name, $event.checked)
                    ">
                    <strong>{{
                      relationship.label || titleFromName(relationship.name)
                    }}</strong>
                    <small>
                      {{ relationship.type || 'relationship' }} to
                      {{
                        relationship.refTable ||
                          relationship.ref_table ||
                          'related table'
                      }}
                    </small>
                  </mat-checkbox>
                </div>
              </section>

              <section class="builder-section">
                <div class="section-heading">
                  <span>
                    <strong>Filters</strong>
                    <small
                      >Add simple rules to limit what this endpoint
                      returns.</small
                    >
                  </span>
                  <button mat-button type="button" (click)="addFilter()">
                    <mat-icon>add</mat-icon>
                    Add Filter
                  </button>
                </div>

                <div class="filter-empty" *ngIf="filterRules.length === 0">
                  <mat-icon>filter_alt_off</mat-icon>
                  <span
                    >No filters yet. This endpoint will return matching records
                    from the selected table.</span
                  >
                </div>

                <div
                  class="filter-row"
                  *ngFor="
                    let filter of filterRules;
                    let i = index;
                    trackBy: trackByFilterIndex
                  ">
                  <mat-form-field appearance="outline">
                    <mat-label>Field</mat-label>
                    <mat-select
                      [value]="filter.field"
                      (selectionChange)="
                        updateFilter(i, 'field', $event.value)
                      ">
                      <mat-option
                        *ngFor="let field of sourceFields"
                        [value]="field.name">
                        {{ field.label || titleFromName(field.name) }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Match</mat-label>
                    <mat-select
                      [value]="filter.operator"
                      (selectionChange)="
                        updateFilter(i, 'operator', $event.value)
                      ">
                      <mat-option
                        *ngFor="
                          let option of filterOperatorOptions(filter.field)
                        "
                        [value]="option.value">
                        {{ option.label }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Value</mat-label>
                    <input
                      matInput
                      [value]="filter.value"
                      (input)="
                        updateFilter(i, 'value', $any($event.target).value)
                      " />
                  </mat-form-field>
                  <button
                    mat-icon-button
                    type="button"
                    aria-label="Remove filter"
                    (click)="removeFilter(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </section>

              <section class="builder-section">
                <div class="section-heading">
                  <span>
                    <strong>Result Options</strong>
                    <small
                      >Set the default sort, row limit, and response
                      wrapper.</small
                    >
                  </span>
                </div>
                <div class="result-options" [formGroup]="sourceForm">
                  <mat-form-field appearance="outline">
                    <mat-label>Sort By</mat-label>
                    <mat-select
                      formControlName="sortField"
                      (selectionChange)="generateEndpointFromSource()">
                      <mat-option value="">No sort</mat-option>
                      <mat-option
                        *ngFor="let field of sourceFields"
                        [value]="field.name">
                        {{ field.label || titleFromName(field.name) }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Direction</mat-label>
                    <mat-select
                      formControlName="sortDirection"
                      (selectionChange)="generateEndpointFromSource()">
                      <mat-option value="ASC">Ascending</mat-option>
                      <mat-option value="DESC">Descending</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Limit</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      max="1000"
                      formControlName="limit"
                      (input)="generateEndpointFromSource()" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Response Shape</mat-label>
                    <mat-select
                      formControlName="outputShape"
                      (selectionChange)="generateEndpointFromSource()">
                      <mat-option value="data">data</mat-option>
                      <mat-option value="table">table name</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </section>

              <div class="save-row">
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  [disabled]="
                    endpointForm.invalid || saving || !canGenerateFromSource
                  ">
                  <mat-icon>add_link</mat-icon>
                  {{
                    selectedEndpointId ? 'Update Endpoint' : 'Create Endpoint'
                  }}
                </button>
                <button
                  mat-stroked-button
                  type="button"
                  [disabled]="
                    endpointForm.invalid || saving || !canGenerateFromSource
                  "
                  (click)="saveEndpoint(true)">
                  <mat-icon>playlist_add</mat-icon>
                  Save + New
                </button>
                <button
                  mat-stroked-button
                  type="button"
                  [disabled]="saving || previewing || !canGenerateFromSource"
                  (click)="runPreview()">
                  <mat-icon>play_arrow</mat-icon>
                  {{ previewStale ? 'Refresh Preview' : 'Preview Return' }}
                </button>
                <button mat-button type="button" (click)="openApiDocs()">
                  <mat-icon>description</mat-icon>
                  API Docs
                </button>
              </div>

              <section class="builder-section" *ngIf="previewResult">
                <div class="section-heading">
                  <span>
                    <strong>Sample Return</strong>
                    <small>
                      {{
                        previewStale
                          ? 'Filters or fields changed. Refresh the preview to run this version.'
                          : 'Result from running the current endpoint definition.'
                      }}
                    </small>
                  </span>
                </div>
                <pre>{{ previewResult }}</pre>
              </section>

              <details class="advanced-contract">
                <summary>Generated details</summary>
                <div class="advanced-grid" [formGroup]="endpointForm">
                  <mat-form-field appearance="outline">
                    <mat-label>Endpoint Name</mat-label>
                    <input matInput formControlName="label" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Path</mat-label>
                    <input matInput formControlName="path" />
                  </mat-form-field>
                  <mat-form-field
                    appearance="outline"
                    class="span-2 json-field">
                    <mat-label>Execution Plan JSON</mat-label>
                    <textarea
                      matInput
                      rows="9"
                      formControlName="executionPlan"></textarea>
                  </mat-form-field>
                  <mat-form-field
                    appearance="outline"
                    class="span-2 json-field">
                    <mat-label>Response Mapping JSON</mat-label>
                    <textarea
                      matInput
                      rows="5"
                      formControlName="responseMapping"></textarea>
                  </mat-form-field>
                </div>
              </details>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="side-panel">
          <mat-card-header>
            <div class="endpoints-header-row">
              <div>
                <mat-card-title>Endpoints</mat-card-title>
                <mat-card-subtitle>Saved routes in this API.</mat-card-subtitle>
              </div>
              <div class="endpoint-actions">
                <button
                  mat-button
                  type="button"
                  [disabled]="!selectedEndpointId"
                  (click)="duplicateSelectedEndpoint()">
                  <mat-icon>content_copy</mat-icon>
                  Duplicate
                </button>
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  [disabled]="!selectedApiId"
                  (click)="newEndpoint()">
                  <mat-icon>add</mat-icon>
                  New Endpoint
                </button>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="list">
              <button
                mat-button
                class="list-row"
                *ngFor="let endpoint of selectedEndpoints"
                [class.selected]="endpoint.id === selectedEndpointId"
                (click)="selectEndpoint(endpoint.id)">
                <mat-icon>route</mat-icon>
                <span>
                  <strong>{{ endpoint.method }} {{ endpoint.path }}</strong>
                  <small>{{ endpoint.label || 'Untitled endpoint' }}</small>
                </span>
              </button>
              <div class="filter-empty" *ngIf="selectedEndpoints.length === 0">
                <mat-icon>route</mat-icon>
                <span>No endpoints saved yet.</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `
      .builder-shell {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;
      }

      .builder-header {
        align-items: flex-start;
        display: flex;
        gap: 16px;
        justify-content: space-between;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .builder-header h1 {
        font-size: 28px;
        line-height: 1.2;
        margin: 0 0 6px;
      }

      .builder-header p {
        margin: 0;
        max-width: 720px;
      }

      .eyebrow {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .builder-workbench {
        display: grid;
        gap: 16px;
        grid-template-columns: minmax(520px, 1fr) minmax(280px, 0.34fr);
      }

      .endpoints-header-row {
        align-items: center;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
      }

      .endpoint-actions {
        align-items: center;
        display: flex;
        gap: 8px;
      }

      .api-list {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .api-card,
      .create-card {
        border-radius: 8px;
        cursor: pointer;
        min-height: 156px;
      }

      .create-card mat-card-content {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
        justify-content: center;
        text-align: center;
      }

      .create-card mat-icon {
        font-size: 34px;
        height: 34px;
        width: 34px;
      }

      .api-card p {
        margin: 8px 0 14px;
        min-height: 40px;
      }

      .card-meta {
        display: flex;
        gap: 8px;
      }

      .card-meta span {
        border: 1px solid rgba(127, 127, 127, 0.35);
        border-radius: 999px;
        font-size: 12px;
        padding: 4px 8px;
      }

      .empty-state {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 48px 16px;
        text-align: center;
      }

      .api-strip {
        align-items: center;
        display: grid;
        gap: 12px;
        grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) auto;
        margin-bottom: 16px;
      }

      .api-strip button {
        margin-bottom: 20px;
      }

      .endpoint-shell {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .section-label {
        border-top: 1px solid rgba(127, 127, 127, 0.25);
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 6px;
        padding-top: 14px;
      }

      .section-label strong {
        font-size: 14px;
      }

      .section-label span,
      .preview-row small {
        opacity: 0.72;
      }

      .preview-list {
        display: grid;
        gap: 8px;
      }

      .source-builder {
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 8px;
        display: grid;
        align-items: center;
        gap: 12px;
        grid-template-columns: minmax(200px, 1fr) minmax(200px, 1fr) minmax(
            180px,
            auto
          );
        padding: 12px;
      }

      .source-builder mat-form-field {
        margin-bottom: -20px;
      }

      .route-preview {
        align-items: flex-start;
        border: 1px solid rgba(63, 81, 181, 0.24);
        border-radius: 8px;
        display: flex;
        gap: 10px;
        padding: 12px;
      }

      .hero-preview {
        background: rgba(63, 81, 181, 0.08);
      }

      .route-preview span {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .route-preview small {
        opacity: 0.72;
      }

      .builder-section {
        border: 1px solid rgba(127, 127, 127, 0.24);
        border-radius: 8px;
        padding: 12px;
      }

      .section-heading {
        align-items: center;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .section-heading span {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .section-heading small {
        opacity: 0.72;
      }

      .field-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }

      .field-toolbar {
        align-items: center;
        display: grid;
        gap: 8px;
        grid-template-columns: minmax(220px, 1fr) auto auto;
        margin-bottom: 8px;
      }

      .field-toolbar mat-form-field {
        margin-bottom: -18px;
      }

      .field-grid mat-checkbox {
        border: 1px solid rgba(127, 127, 127, 0.22);
        border-radius: 6px;
        padding: 6px 8px;
      }

      .field-name {
        font-weight: 600;
      }

      .field-grid small {
        margin-left: 4px;
        opacity: 0.7;
      }

      .field-badge {
        border: 1px solid rgba(127, 127, 127, 0.32);
        border-radius: 999px;
        font-size: 11px;
        margin-left: 5px;
        padding: 2px 6px;
      }

      .relationship-grid {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }

      .relationship-pill {
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
      }

      .relationship-pill small {
        opacity: 0.72;
      }

      .filter-empty {
        align-items: center;
        border: 1px dashed rgba(127, 127, 127, 0.35);
        border-radius: 8px;
        display: flex;
        gap: 8px;
        padding: 12px;
      }

      .filter-row {
        align-items: center;
        display: grid;
        gap: 10px;
        grid-template-columns:
          minmax(170px, 1fr) minmax(160px, 0.8fr) minmax(160px, 1fr)
          auto;
      }

      .filter-row mat-form-field {
        margin-bottom: -18px;
      }

      .result-options {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(4, minmax(140px, 1fr));
      }

      .result-options mat-form-field {
        margin-bottom: -18px;
      }

      .save-row {
        align-items: center;
        display: flex;
        gap: 8px;
      }

      .advanced-contract {
        border-top: 1px solid rgba(127, 127, 127, 0.2);
        padding-top: 8px;
      }

      .advanced-contract summary {
        cursor: pointer;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .advanced-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .preview-row {
        align-items: flex-start;
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 8px;
        display: flex;
        gap: 10px;
        padding: 10px;
      }

      .preview-row span {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .field-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .field-pills span {
        border: 1px solid rgba(127, 127, 127, 0.35);
        border-radius: 999px;
        font-size: 12px;
        padding: 5px 9px;
      }

      .muted {
        opacity: 0.72;
      }

      .span-2 {
        grid-column: 1 / -1;
      }

      .json-field textarea,
      pre {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', monospace;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 16px;
      }

      .toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
      }

      .list-row {
        border-radius: 6px;
        height: auto;
        justify-content: flex-start;
        padding: 10px;
        text-align: left;
        width: 100%;
      }

      .list-row.selected {
        background: rgba(63, 81, 181, 0.12);
      }

      .list-row span {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .list-row small {
        opacity: 0.75;
      }

      pre {
        background: #101418;
        border-radius: 6px;
        color: #f4f7fb;
        margin: 16px 0 0;
        max-height: 420px;
        overflow: auto;
        padding: 14px;
        white-space: pre-wrap;
      }

      @media (max-width: 980px) {
        .builder-header,
        .builder-workbench {
          display: flex;
          flex-direction: column;
        }

        .header-actions {
          flex-wrap: wrap;
        }

        .api-strip,
        .source-builder,
        .filter-row,
        .field-toolbar,
        .result-options,
        .advanced-grid {
          grid-template-columns: 1fr;
        }

        .api-strip button {
          margin-bottom: 0;
        }
      }
    `,
  ],
})
export class DfApiBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private mapper = inject(ApiBuilderMapperService);

  apis: ApiDefinition[] = [];
  endpoints: EndpointDefinition[] = [];
  sourceServices: SourceService[] = [];
  sourceTables: SourceTable[] = [];
  sourceFields: SourceField[] = [];
  sourceRelationships: SourceRelationship[] = [];
  sourceOpenApiPaths: string[] = [];
  sourceServiceSearch = '';
  private readonly recentSourceKey = 'df_api_builder_recent_sources';
  recentSourceNames: string[] = [];
  selectedFields = new Set<string>();
  selectedRelationships = new Set<string>();
  private pendingSelectedFieldNames: string[] | null = null;
  filterRules: FilterRule[] = [];
  fieldSearch = '';
  private readonly textOperators: FilterOperatorOption[] = [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'does not equal' },
    { value: 'like', label: 'contains' },
  ];
  private readonly comparableOperators: FilterOperatorOption[] = [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'does not equal' },
    { value: '>', label: 'greater than' },
    { value: '>=', label: 'greater than or equal' },
    { value: '<', label: 'less than' },
    { value: '<=', label: 'less than or equal' },
  ];
  loading = false;
  saving = false;
  editorOpen = false;
  selectedApiId: number | null = null;
  selectedEndpointId: number | null = null;
  testResult = '';
  previewResult = '';
  previewStale = false;
  previewing = false;

  apiForm = this.fb.group({
    name: ['', [Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    basePath: [
      '',
      [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)],
    ],
    label: [''],
    description: [''],
    status: ['draft'],
  });

  endpointForm = this.fb.group({
    apiId: [null as number | null, Validators.required],
    method: ['GET', Validators.required],
    path: ['/customers/{id}/summary', Validators.required],
    label: [''],
    description: [''],
    executionPlan: [this.sampleExecutionPlan(), Validators.required],
    responseMapping: [this.sampleResponseMapping(), Validators.required],
  });

  testForm = this.fb.group({
    endpointId: [null as number | null, Validators.required],
    pathParams: ['{\n  "id": 1\n}', Validators.required],
    query: ['{}', Validators.required],
  });

  sourceForm = this.fb.group({
    service: [''],
    table: [''],
    includeId: [false],
    sortField: [''],
    sortDirection: ['ASC'],
    limit: [25],
    outputShape: ['data' as OutputShape],
  });

  get selectedEndpoints(): EndpointDefinition[] {
    if (!this.selectedApiId) {
      return [];
    }

    return this.endpoints.filter(
      endpoint => (endpoint.apiId ?? endpoint.api_id) === this.selectedApiId
    );
  }

  get filteredSourceServices(): SourceService[] {
    const query = this.sourceServiceSearch.trim().toLowerCase();
    if (!query) {
      return [...this.sourceServices];
    }

    return this.sourceServices.filter(service => {
      const haystack =
        `${service.name} ${service.label ?? ''} ${service.type}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  get groupedSourceServices(): SourceServiceGroup[] {
    const services = this.filteredSourceServices;
    const recent = this.recentSourceNames
      .map(name => services.find(service => service.name === name))
      .filter((service): service is SourceService => !!service);

    const remaining = services.filter(
      service => !this.recentSourceNames.includes(service.name)
    );

    const byType = new Map<string, SourceService[]>();
    remaining.forEach(service => {
      const group = byType.get(service.type) ?? [];
      group.push(service);
      byType.set(service.type, group);
    });

    const groups: SourceServiceGroup[] = [];
    if (recent.length) {
      groups.push({ label: 'Recent', services: recent });
    }

    Array.from(byType.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([type, grouped]) => {
        groups.push({
          label: this.titleFromName(type),
          services: grouped.sort((a, b) =>
            (a.label || a.name).localeCompare(b.label || b.name)
          ),
        });
      });

    return groups;
  }

  get editorTitle(): string {
    const api = this.apis.find(item => item.id === this.selectedApiId);
    return api ? api.label || api.name : 'Create API';
  }

  get executionStepsPreview(): StepPreview[] {
    const plan = this.parseJsonObject(this.endpointForm.value.executionPlan);
    const steps: unknown[] = Array.isArray(plan?.['steps'])
      ? (plan?.['steps'] as unknown[])
      : [];

    return steps
      .filter(
        (step): step is Record<string, unknown> =>
          !!step && typeof step === 'object'
      )
      .map(step => {
        const service = String(step['service'] ?? 'service');
        const method = String(step['method'] ?? 'GET');
        const resource = String(step['resource'] ?? '');
        const id = String(step['id'] ?? service);

        return {
          title: `${id}: ${method} ${service}`,
          detail: resource ? resource : 'Root resource',
        };
      });
  }

  get responseFieldsPreview(): string[] {
    const mapping = this.parseJsonObject(
      this.endpointForm.value.responseMapping
    );
    if (!mapping) {
      return [];
    }

    return Object.keys(mapping);
  }

  get selectedFieldNames(): string[] {
    return Array.from(this.selectedFields);
  }

  get displayedSourceFields(): SourceField[] {
    const search = this.fieldSearch.trim().toLowerCase();
    if (!search) {
      return this.sourceFields;
    }

    return this.sourceFields.filter(field =>
      [field.name, field.label, field.type, field.dbType, field.db_type]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(search))
    );
  }

  get canGenerateFromSource(): boolean {
    return (
      !!this.sourceForm.value.service &&
      !!this.sourceForm.value.table &&
      this.selectedFields.size > 0
    );
  }

  get generatedRouteLabel(): string {
    if (!this.canGenerateFromSource) {
      return 'Choose a source API and table';
    }

    return `${this.endpointForm.value.method ?? 'GET'} ${this.endpointForm.value.path ?? ''}`;
  }

  get sourceSummary(): string {
    const service = this.sourceForm.value.service;
    const table = this.sourceForm.value.table;
    if (!service || !table) {
      return 'API Builder will inspect the source API and generate this endpoint.';
    }

    const action = this.sourceForm.value.includeId
      ? 'one record from'
      : 'records from';
    const filters =
      this.filterRules.length === 0
        ? ''
        : ` with ${this.filterRules.length} filter${this.filterRules.length === 1 ? '' : 's'}`;
    return `Returns ${this.selectedFields.size} selected fields for ${action} ${service}.${table}${filters}.`;
  }

  ngOnInit(): void {
    this.recentSourceNames = this.readRecentSources();
    this.loadSourceServices();
    this.loadAll();
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalShortcut(event: KeyboardEvent): void {
    if (!this.editorOpen || this.saving) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase() ?? '';
    const isTypingContext =
      !!target?.closest('input, textarea, [contenteditable="true"], mat-select');
    if (isTypingContext || ['input', 'textarea', 'select'].includes(tag)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'n') {
      event.preventDefault();
      this.newEndpoint();
      return;
    }

    if (key === 'd') {
      event.preventDefault();
      this.duplicateSelectedEndpoint();
      return;
    }

    if (key === 's') {
      event.preventDefault();
      this.saveEndpoint(false);
    }
  }

  introspectionBadge(service: SourceService): string {
    const t = (service.type || '').toLowerCase();
    if (
      ['pgsql', 'mysql', 'sqlite', 'sqlsrv', 'oracle', 'ibmdb2'].includes(t)
    ) {
      return 'schema';
    }
    if (['rest', 'soap', 'http'].includes(t)) {
      return 'openapi';
    }
    return 'limited';
  }

  private rememberRecentSource(serviceName: string): void {
    const next = [
      serviceName,
      ...this.recentSourceNames.filter(name => name !== serviceName),
    ].slice(0, 6);
    this.recentSourceNames = next;
    localStorage.setItem(this.recentSourceKey, JSON.stringify(next));
  }

  private readRecentSources(): string[] {
    try {
      const raw = localStorage.getItem(this.recentSourceKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(item => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  loadAll(): void {
    this.loading = true;
    this.http
      .get<GenericListResponse<ApiDefinition>>(`${BASE_URL}/api_builder/apis`, {
        params: { limit: 500 },
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: response => {
          this.apis = response.resource ?? [];
          this.loadEndpoints();
        },
        error: () => this.toast('Could not load API Builder definitions.'),
      });
  }

  loadEndpoints(): void {
    this.http
      .get<
        GenericListResponse<EndpointDefinition>
      >(`${BASE_URL}/api_builder/endpoints`, { params: { limit: 500 } })
      .subscribe({
        next: response => {
          this.endpoints = response.resource ?? [];
          if (this.editorOpen && this.selectedApiId) {
            const endpoint = this.selectedEndpoints[0];
            if (endpoint) {
              this.selectEndpoint(endpoint.id);
            }
          }
        },
        error: () => this.toast('Could not load endpoint definitions.'),
      });
  }

  loadSourceServices(): void {
    this.http
      .get<GenericListResponse<SourceService & { is_active?: boolean }>>(
        `${BASE_URL}/system/service`,
        {
          params: { fields: 'name,label,type,is_active', limit: 500 },
        }
      )
      .subscribe({
        next: response => {
          const services = response.resource ?? [];
          this.sourceServices = services.filter(
            service =>
              service.name !== 'api_builder' &&
              service.name !== 'system' &&
              service.is_active !== false
          );
          // Do not auto-load a sample service on page load.
          // In some local environments demo services (e.g. sample_pgsql)
          // exist in metadata but are not configured/running, which can
          // trigger hard API errors and route-level error redirects.
          this.sourceForm.patchValue({ service: '', table: '' });
        },
        error: () => this.toast('Could not load source APIs.'),
      });
  }

  loadTables(serviceName?: string | null): void {
    if (!serviceName) {
      return;
    }

    this.rememberRecentSource(serviceName);

    this.sourceTables = [];
    this.sourceFields = [];
    this.sourceRelationships = [];
    this.sourceOpenApiPaths = [];
    this.selectedFields.clear();
    this.selectedRelationships.clear();
    this.sourceForm.patchValue({ table: '' });

    this.http
      .get<GenericListResponse<SourceTable>>(
        `${BASE_URL}/${serviceName}/_schema`,
        {
          params: { fields: 'name,label' },
        }
      )
      .subscribe({
        next: response => {
          const tables = (response.resource ?? []).map(table => ({
            ...table,
            source: 'schema' as const,
          }));
          if (tables.length) {
            this.setSourceTables(tables);
            return;
          }

          this.loadTablesFromOpenApi(serviceName);
        },
        error: () => this.loadTablesFromOpenApi(serviceName),
      });
  }

  loadTablesFromOpenApi(serviceName: string): void {
    this.http
      .get<OpenApiDocument>(`${BASE_URL}/api_docs/${serviceName}`, {
        params: { expand_schema: true },
      })
      .subscribe({
        next: document => {
          this.sourceOpenApiPaths = Object.keys(document.paths ?? {});
          const tablesFromOpenApi = this.tablesFromOpenApi(
            this.sourceOpenApiPaths
          );
          if (tablesFromOpenApi.length) {
            this.setSourceTables(tablesFromOpenApi);
            return;
          }

          this.loadTablesFromSchema(serviceName);
        },
        error: () => this.loadTablesFromSchema(serviceName),
      });
  }

  loadTablesFromSchema(serviceName: string): void {
    const serviceType = this.sourceServices.find(
      service => service.name === serviceName
    )?.type;
    const isDatabaseService = [
      'pgsql',
      'mysql',
      'sqlite',
      'sqlsrv',
      'oracle',
      'ibmdb2',
    ].includes(String(serviceType));

    if (!isDatabaseService) {
      this.toast(
        'This source API does not expose table schema metadata for field selection.'
      );
      return;
    }

    this.http
      .get<GenericListResponse<SourceTable>>(
        `${BASE_URL}/${serviceName}/_table`,
        {
          params: { limit: 500 },
        }
      )
      .subscribe({
        next: response => {
          this.setSourceTables(
            (response.resource ?? []).map(table => ({
              ...table,
              source: 'schema',
            }))
          );
        },
        error: () => this.toast('Could not load tables for source API.'),
      });
  }

  setSourceTables(tables: SourceTable[]): void {
    this.sourceTables = tables;
    const preferredTable = this.sourceForm.value.table;
    const preferred = preferredTable
      ? this.sourceTables.find(table => table.name === preferredTable)
      : undefined;
    const defaultTable =
      preferred ??
      this.sourceTables.find(table => table.name === 'customers') ??
      this.sourceTables[0];
    if (defaultTable) {
      this.sourceForm.patchValue({ table: defaultTable.name });
      this.loadFields(defaultTable.name);
    }
  }

  loadFields(tableName?: string | null): void {
    const serviceName = this.sourceForm.value.service;
    if (!serviceName || !tableName) {
      return;
    }

    this.sourceFields = [];
    this.sourceRelationships = [];
    this.selectedFields.clear();
    this.fieldSearch = '';

    this.http
      .get<{
        field?: SourceField[];
        related?: any[];
      }>(`${BASE_URL}/${serviceName}/_schema/${tableName}`)
      .subscribe({
        next: response => {
          this.sourceFields = (response.field ?? []).map(field => ({
            ...field,
            label: field.label || this.titleFromName(field.name),
          }));
          this.sourceRelationships = this.mapRelatedToRelationships(
            response.related
          );
          if (this.pendingSelectedFieldNames?.length) {
            const allowed = new Set(this.pendingSelectedFieldNames);
            this.sourceFields.forEach(field => {
              if (allowed.has(field.name)) {
                this.selectedFields.add(field.name);
              }
            });
            this.pendingSelectedFieldNames = null;
          } else {
            this.sourceFields.forEach(field =>
              this.selectedFields.add(field.name)
            );
          }
          this.generateEndpointFromSource();
        },
        error: () => this.loadFieldsFromOpenApi(tableName),
      });
  }

  isFieldSelected(fieldName: string): boolean {
    return this.selectedFields.has(fieldName);
  }

  isRelationshipSelected(relationshipName: string): boolean {
    return this.selectedRelationships.has(relationshipName);
  }

  toggleRelationship(relationshipName: string, checked: boolean): void {
    if (checked) {
      this.selectedRelationships.add(relationshipName);
    } else {
      this.selectedRelationships.delete(relationshipName);
    }
    this.generateEndpointFromSource();
  }

  toggleField(fieldName: string, checked: boolean): void {
    if (checked) {
      this.selectedFields.add(fieldName);
    } else {
      this.selectedFields.delete(fieldName);
    }
    this.generateEndpointFromSource();
  }

  selectAllFields(): void {
    this.sourceFields.forEach(field => this.selectedFields.add(field.name));
    this.generateEndpointFromSource();
  }

  clearAllFields(): void {
    this.selectedFields.clear();
    this.generateEndpointFromSource();
  }

  addFilter(): void {
    const field =
      this.sourceFields.find(item => item.name === 'name') ??
      this.sourceFields.find(
        item => !this.isPrimaryKey(item) && (item.type ?? '').includes('string')
      ) ??
      this.sourceFields.find(item => !this.isPrimaryKey(item)) ??
      this.sourceFields[0];
    if (!field) {
      this.toast('Choose a table before adding filters.');
      return;
    }

    this.filterRules = [
      ...this.filterRules,
      { field: field.name, operator: '=', value: '' },
    ];
    this.markPreviewStale();
  }

  removeFilter(index: number): void {
    this.filterRules = this.filterRules.filter(
      (_, itemIndex) => itemIndex !== index
    );
    this.generateEndpointFromSource();
  }

  updateFilter(
    index: number,
    key: keyof FilterRule,
    value: string | FilterOperator
  ): void {
    const filter = this.filterRules[index];
    if (!filter) {
      return;
    }

    (filter as FilterRule)[key] = value as never;
    this.generateEndpointFromSource();
  }

  trackByFilterIndex(index: number): number {
    return index;
  }

  filterOperatorOptions(fieldName: string): FilterOperatorOption[] {
    const field = this.sourceFields.find(item => item.name === fieldName);
    const type = this.fieldType(field);
    if (
      this.isNumericField(field) ||
      ['date', 'datetime', 'timestamp'].some(item => type.includes(item))
    ) {
      return this.comparableOperators;
    }

    return this.textOperators;
  }

  generateEndpointFromSource(): void {
    const service = this.sourceForm.value.service;
    const table = this.sourceForm.value.table;
    const includeId = !!this.sourceForm.value.includeId;
    const fields = this.selectedFieldNames;
    if (!service || !table || fields.length === 0) {
      return;
    }

    const stepId = this.safeStepId(table);
    const label = includeId
      ? `Get ${this.titleFromName(table)}`
      : `List ${this.titleFromName(table)}`;
    const path = includeId ? `/${table}/{id}` : `/${table}`;
    const resource = includeId
      ? `_table/${table}/{path.id}`
      : `_table/${table}`;
    const filter = this.buildFilterString();
    const params: Record<string, string> = { fields: fields.join(',') };
    if (this.selectedRelationships.size) {
      params['related'] = Array.from(this.selectedRelationships).join(',');
    }
    if (filter) {
      params['filter'] = filter;
    }
    const sortField = this.sourceForm.value.sortField;
    if (sortField) {
      params['order'] =
        `${sortField} ${this.sourceForm.value.sortDirection ?? 'ASC'}`;
    }
    const limit = Number(this.sourceForm.value.limit);
    if (!includeId && limit > 0) {
      params['limit'] = String(limit);
    }
    const outputKey =
      this.sourceForm.value.outputShape === 'table'
        ? this.safeStepId(table)
        : 'data';
    this.endpointForm.patchValue({
      apiId: this.selectedApiId,
      method: 'GET',
      path,
      label,
      description: `Returns selected fields from ${service}.${table}.`,
      executionPlan: JSON.stringify(
        {
          steps: [
            {
              id: stepId,
              type: 'service_request',
              service,
              method: 'GET',
              resource,
              params,
            },
          ],
        },
        null,
        2
      ),
      responseMapping: JSON.stringify(
        {
          [outputKey]: includeId
            ? `{steps.${stepId}}`
            : `{steps.${stepId}.resource}`,
        },
        null,
        2
      ),
    });
    this.testForm.patchValue({
      pathParams: includeId ? '{\n  "id": 1\n}' : '{}',
      query: '{}',
    });
    this.markPreviewStale();
  }

  runPreview(): void {
    let executionPlan: unknown;
    let responseMapping: unknown;
    try {
      executionPlan = JSON.parse(this.endpointForm.value.executionPlan ?? '{}');
      responseMapping = JSON.parse(
        this.endpointForm.value.responseMapping ?? '{}'
      );
    } catch {
      this.toast(
        'Generated endpoint details must be valid JSON before previewing.'
      );
      return;
    }

    this.previewing = true;
    this.http
      .post(`${BASE_URL}/api_builder/test`, {
        endpoint: {
          apiId: this.selectedApiId ?? 0,
          method: this.endpointForm.value.method ?? 'GET',
          path: this.endpointForm.value.path ?? '',
          label: this.endpointForm.value.label ?? '',
          isActive: true,
          requestSchema: this.buildRequestSchema(
            !!this.sourceForm.value.includeId
          ),
          responseSchema: this.buildResponseSchema(
            this.sourceForm.value.outputShape === 'table'
              ? this.safeStepId(this.sourceForm.value.table ?? 'data')
              : 'data',
            !!this.sourceForm.value.includeId
          ),
          executionPlan,
          responseMapping,
        },
        pathParams: this.sourceForm.value.includeId ? { id: 1 } : {},
        query: {},
      })
      .pipe(finalize(() => (this.previewing = false)))
      .subscribe({
        next: result => {
          this.previewResult = JSON.stringify(result, null, 2);
          this.previewStale = false;
        },
        error: error => {
          this.previewResult = JSON.stringify(error?.error ?? error, null, 2);
          this.previewStale = false;
        },
      });
  }

  markPreviewStale(): void {
    if (this.previewResult) {
      this.previewStale = true;
    }
  }

  openApiDocs(): void {
    if (!this.selectedApiId) {
      this.toast('Save the API first so docs can be generated for it.');
      return;
    }

    const selectedApi = this.apis.find(api => api.id === this.selectedApiId);
    const basePath =
      selectedApi?.basePath ??
      selectedApi?.base_path ??
      this.apiForm.value.basePath ??
      '';
    const serviceName = basePath.replace(/^\/+|\/+$/g, '');
    if (!serviceName) {
      this.toast('API URL is empty. Set API URL and save before opening docs.');
      return;
    }

    this.http.get(`${BASE_URL}/api_docs/${serviceName}`).subscribe({
      next: () => {
        window.location.assign(
          `${window.location.origin}/dreamfactory/dist/#/api-connections/api-docs/${serviceName}`
        );
      },
      error: (error: any) => {
        this.toast(
          `Could not load generated OpenAPI spec for ${serviceName}. ${this.describeHttpError(error)}`
        );
      },
    });
  }

  saveApi(): void {
    if (this.apiForm.invalid) {
      return;
    }

    const payload = this.withoutEmptyOptionalFields(
      this.mapper.toApiPayload({
        name:
          this.apiForm.value.name ||
          this.safeStepId(
            this.apiForm.value.basePath ||
              this.apiForm.value.label ||
              'custom_api'
          ),
        basePath: this.apiForm.value.basePath ?? '',
        label: this.apiForm.value.label ?? '',
        description: this.apiForm.value.description ?? '',
        status: this.apiForm.value.status ?? 'draft',
      })
    );
    const request: any = this.selectedApiId
      ? this.http.put<ApiDefinition>(
          `${BASE_URL}/api_builder/apis/${this.selectedApiId}`,
          payload
        )
      : this.http.post<GenericListResponse<ApiDefinition>>(
          `${BASE_URL}/api_builder/apis`,
          {
            resource: [payload],
          }
        );

    this.saving = true;
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (response: GenericListResponse<ApiDefinition> | ApiDefinition) => {
        const saved =
          'resource' in response ? response.resource?.[0] : response;
        if (!saved) {
          this.toast('API save did not return a definition.');
          return;
        }

        const api = { ...payload, ...saved } as ApiDefinition;
        this.toast('API saved.');
        this.apis = [
          api,
          ...this.apis.filter(existing => existing.id !== api.id),
        ];
        this.selectApi(api.id);
      },
      error: (error: any) =>
        this.toast(`Could not save API. ${this.describeHttpError(error)}`),
    });
  }

  saveEndpoint(createAnother = false): void {
    if (!this.selectedApiId) {
      this.toast('Save the API first, then create endpoints inside it.');
      return;
    }

    if (this.endpointForm.invalid) {
      return;
    }

    let executionPlan: unknown;
    let responseMapping: unknown;
    try {
      executionPlan = JSON.parse(this.endpointForm.value.executionPlan ?? '{}');
      responseMapping = JSON.parse(
        this.endpointForm.value.responseMapping ?? '{}'
      );
    } catch {
      this.toast('Execution plan and response mapping must be valid JSON.');
      return;
    }

    const payload = this.withoutEmptyOptionalFields(
      this.mapper.toEndpointPayload({
        apiId: this.endpointForm.value.apiId,
        method: this.endpointForm.value.method ?? 'GET',
        path: this.endpointForm.value.path ?? '',
        label: this.endpointForm.value.label ?? '',
        description: this.endpointForm.value.description ?? '',
        isActive: true,
        requestSchema: this.buildRequestSchema(
          !!this.sourceForm.value.includeId
        ),
        responseSchema: this.buildResponseSchema(
          this.sourceForm.value.outputShape === 'table'
            ? this.safeStepId(this.sourceForm.value.table ?? 'data')
            : 'data',
          !!this.sourceForm.value.includeId
        ),
        executionPlan,
        responseMapping,
      })
    );

    const normalizedPath = String((payload as any).path ?? '').trim();
    const normalizedMethod = String(
      (payload as any).method ?? 'GET'
    ).toUpperCase();
    const duplicate = this.endpoints.find(endpoint => {
      const endpointId = endpoint.id;
      if (this.selectedEndpointId && endpointId === this.selectedEndpointId) {
        return false;
      }

      const endpointApiId = endpoint.apiId ?? endpoint.api_id;
      const endpointPath = String(endpoint.path ?? '').trim();
      const endpointMethod = String(endpoint.method ?? '').toUpperCase();
      return (
        endpointApiId === (payload as any).api_id &&
        endpointPath === normalizedPath &&
        endpointMethod === normalizedMethod
      );
    });

    let targetEndpointId = this.selectedEndpointId;
    if (duplicate) {
      this.toast(
        `Endpoint ${normalizedMethod} ${normalizedPath} already exists in this API (id ${duplicate.id}). Saving as update.`
      );
      this.selectEndpoint(duplicate.id);
      targetEndpointId = duplicate.id;
    }

    const request: any = targetEndpointId
      ? this.http.put<EndpointDefinition>(
          `${BASE_URL}/api_builder/endpoints/${targetEndpointId}`,
          payload
        )
      : this.http.post<GenericListResponse<EndpointDefinition>>(
          `${BASE_URL}/api_builder/endpoints`,
          { resource: [payload] }
        );

    this.saving = true;
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (
        response: GenericListResponse<EndpointDefinition> | EndpointDefinition
      ) => {
        const saved =
          'resource' in response ? response.resource?.[0] : response;
        if (!saved) {
          this.toast('Endpoint save did not return a definition.');
          return;
        }

        const endpoint = { ...payload, ...saved } as EndpointDefinition;
        this.toast(createAnother ? 'Endpoint saved. Ready for next endpoint.' : 'Endpoint saved.');
        this.endpoints = [
          endpoint,
          ...this.endpoints.filter(existing => existing.id !== endpoint.id),
        ];

        if (createAnother) {
          this.newEndpoint();
          return;
        }

        this.selectEndpoint(endpoint.id);
      },
      error: (error: any) =>
        this.toast(`Could not save endpoint. ${this.describeHttpError(error)}`),
    });
  }

  testEndpoint(): void {
    if (this.testForm.invalid) {
      return;
    }

    let pathParams: unknown;
    let query: unknown;
    try {
      pathParams = JSON.parse(this.testForm.value.pathParams ?? '{}');
      query = JSON.parse(this.testForm.value.query ?? '{}');
    } catch {
      this.toast('Path params and query must be valid JSON.');
      return;
    }

    this.saving = true;
    this.http
      .post(`${BASE_URL}/api_builder/test`, {
        endpointId: this.testForm.value.endpointId,
        pathParams,
        query,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: result => (this.testResult = JSON.stringify(result, null, 2)),
        error: error =>
          (this.testResult = JSON.stringify(error?.error ?? error, null, 2)),
      });
  }

  selectApi(id: number): void {
    this.editorOpen = true;
    this.selectedApiId = id;
    const api = this.apis.find(item => item.id === id);
    if (api) {
      this.apiForm.patchValue({
        name: api.name,
        basePath: api.basePath ?? api.base_path ?? '',
        label: api.label ?? '',
        description: api.description ?? '',
        status: api.status ?? 'draft',
      });
    }
    this.endpointForm.patchValue({ apiId: id });
    const endpoint = this.selectedEndpoints[0];
    if (endpoint) {
      this.selectEndpoint(endpoint.id);
    }
  }

  selectEndpoint(id: number): void {
    this.selectedEndpointId = id;
    const endpoint = this.endpoints.find(item => item.id === id);
    if (endpoint) {
      this.endpointForm.patchValue({
        apiId: endpoint.apiId ?? endpoint.api_id ?? this.selectedApiId,
        method: endpoint.method,
        path: endpoint.path,
        label: endpoint.label ?? '',
        description: endpoint.description ?? '',
        executionPlan: JSON.stringify(
          endpoint.executionPlan ?? endpoint.execution_plan ?? {},
          null,
          2
        ),
        responseMapping: JSON.stringify(
          endpoint.responseMapping ?? endpoint.response_mapping ?? {},
          null,
          2
        ),
      });

      const execution = (endpoint.executionPlan ?? endpoint.execution_plan) as
        | { steps?: any[] }
        | undefined;
      const step = Array.isArray(execution?.steps)
        ? execution?.steps?.[0]
        : null;
      const resource = String(step?.resource ?? '');
      const service = String(step?.service ?? '');
      const tableMatch = resource.match(
        /^_table\/([^/{]+)(?:\/\{path\.id\})?$/
      );
      const table = tableMatch?.[1] ?? '';
      const includeId = resource.endsWith('/{path.id}');
      const params = (step?.params ?? {}) as Record<string, unknown>;
      const fields = String(params['fields'] ?? '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const related = String(params['related'] ?? '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const order = String(params['order'] ?? '');
      const [sortField = '', sortDirection = 'ASC'] = order.split(/\s+/, 2);
      const limit = Number(params['limit'] ?? 25);

      if (service && table) {
        this.pendingSelectedFieldNames = fields.length ? fields : null;
        this.selectedRelationships = new Set(related);
        this.sourceForm.patchValue({
          service,
          table,
          includeId,
          sortField,
          sortDirection: sortDirection || 'ASC',
          limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
        });
        this.filterRules = this.parseFilters(String(params['filter'] ?? ''));
        this.loadTables(service);
      }
    }
    this.testForm.patchValue({ endpointId: id });
  }

  newApi(): void {
    this.editorOpen = true;
    this.selectedApiId = null;
    this.apiForm.reset({
      name: '',
      basePath: '',
      label: '',
      description: '',
      status: 'draft',
    });
    this.newEndpoint();
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.selectedApiId = null;
    this.selectedEndpointId = null;
    this.testResult = '';
  }

  endpointCount(apiId: number): number {
    return this.endpoints.filter(
      endpoint => (endpoint.apiId ?? endpoint.api_id) === apiId
    ).length;
  }

  newEndpoint(): void {
    if (!this.selectedApiId) {
      this.toast('Save the API first, then add endpoints to it.');
      return;
    }

    this.selectedEndpointId = null;
    this.pendingSelectedFieldNames = null;
    this.endpointForm.reset({
      apiId: this.selectedApiId,
      method: 'GET',
      path: '',
      label: '',
      description: '',
      executionPlan: '{}',
      responseMapping: '{}',
    });
    this.testForm.patchValue({ endpointId: null });
    this.testResult = '';
    this.previewResult = '';
    this.previewStale = false;

    this.selectedFields.clear();
    this.selectedRelationships.clear();
    this.filterRules = [];
    this.sourceTables = [];
    this.sourceFields = [];
    this.sourceRelationships = [];
    this.sourceForm.patchValue({
      service: '',
      table: '',
      includeId: false,
      sortField: '',
      sortDirection: 'ASC',
      limit: 25,
      outputShape: 'data',
    });
  }

  duplicateSelectedEndpoint(): void {
    const selected = this.endpoints.find(
      endpoint => endpoint.id === this.selectedEndpointId
    );

    if (!selected || !this.selectedApiId) {
      this.toast('Select an endpoint to duplicate.');
      return;
    }

    this.selectEndpoint(selected.id);

    const sourcePath = String(selected.path ?? '').trim();
    const duplicatePath = sourcePath
      ? sourcePath.endsWith('-copy')
        ? sourcePath
        : `${sourcePath}-copy`
      : '/new-endpoint';

    const sourceLabel = String(selected.label ?? '').trim();
    const duplicateLabel = sourceLabel
      ? sourceLabel.endsWith(' (copy)')
        ? sourceLabel
        : `${sourceLabel} (copy)`
      : 'Copied endpoint';

    this.selectedEndpointId = null;
    this.endpointForm.patchValue({
      apiId: this.selectedApiId,
      path: duplicatePath,
      label: duplicateLabel,
    });
    this.testForm.patchValue({ endpointId: null });
    this.toast('Endpoint duplicated into a new draft. Save to create it.');
  }

  loadSample(): void {
    this.apiForm.patchValue({
      name: 'customer_portal',
      basePath: 'customer-portal',
      label: 'Customer Portal API',
      description:
        'Composes sample_pgsql customer summaries with sample_zendesk tickets.',
      status: 'draft',
    });
    this.endpointForm.patchValue({
      method: 'GET',
      path: '/customers/{id}/summary',
      label: 'Customer Summary',
      description:
        'Read customer risk summary from Postgres and tickets from Zendesk.',
      executionPlan: this.sampleExecutionPlan(),
      responseMapping: this.sampleResponseMapping(),
    });
    this.testForm.patchValue({
      pathParams: '{\n  "id": 1\n}',
      query: '{}',
    });
  }

  private sampleExecutionPlan(): string {
    return JSON.stringify(
      {
        steps: [
          {
            id: 'summary',
            type: 'service_request',
            service: 'sample_pgsql',
            method: 'GET',
            resource: '_table/customer_risk_summary',
            params: {
              filter: 'customer_id={path.id}',
            },
          },
          {
            id: 'tickets',
            type: 'service_request',
            service: 'sample_zendesk',
            method: 'GET',
            resource: 'tickets',
            params: {
              customer_id: '{path.id}',
            },
          },
        ],
      },
      null,
      2
    );
  }

  private sampleResponseMapping(): string {
    return JSON.stringify(
      {
        summary: '{steps.summary.resource.0}',
        tickets: '{steps.tickets.tickets}',
      },
      null,
      2
    );
  }

  private withoutEmptyOptionalFields<T extends Record<string, unknown>>(
    payload: T
  ): T {
    return Object.fromEntries(
      Object.entries(payload).filter(
        ([key, value]) =>
          !['label', 'description'].includes(key) || value !== ''
      )
    ) as T;
  }

  private parseJsonObject(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  private tablesFromOpenApi(paths: string[]): SourceTable[] {
    const tableNames = new Set<string>();
    paths.forEach(path => {
      const tableMatch = path.match(/^\/_table\/([^/{]+)$/);
      if (tableMatch?.[1]) {
        tableNames.add(tableMatch[1]);
        return;
      }

      const resourceMatch = path.match(/^\/([^/{]+)(?:\/\{[^}]+\})?$/);
      if (resourceMatch?.[1] && !resourceMatch[1].startsWith('_')) {
        tableNames.add(resourceMatch[1]);
      }
    });

    return Array.from(tableNames)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ name, source: 'openapi' }));
  }

  private loadFieldsFromOpenApi(tableName: string): void {
    const serviceName = this.sourceForm.value.service;
    if (!serviceName) {
      this.toast('Could not load table fields.');
      return;
    }

    this.http
      .get<OpenApiDocument>(`${BASE_URL}/api_docs/${serviceName}`, {
        params: { expand_schema: true },
      })
      .subscribe({
        next: document => {
          const fields = this.fieldsFromOpenApi(document, tableName);
          if (!fields.length) {
            this.toast('No field schema found in API spec for this resource.');
            return;
          }

          this.sourceFields = fields;
          this.sourceRelationships = [];
          if (this.pendingSelectedFieldNames?.length) {
            const allowed = new Set(this.pendingSelectedFieldNames);
            this.sourceFields.forEach(field => {
              if (allowed.has(field.name)) {
                this.selectedFields.add(field.name);
              }
            });
            this.pendingSelectedFieldNames = null;
          } else {
            this.sourceFields.forEach(field =>
              this.selectedFields.add(field.name)
            );
          }
          this.generateEndpointFromSource();
        },
        error: () => this.toast('Could not load table fields.'),
      });
  }

  private fieldsFromOpenApi(
    document: OpenApiDocument,
    resourceName: string
  ): SourceField[] {
    const paths = document.paths ?? {};
    const candidatePaths = [
      `/_table/${resourceName}`,
      `/${resourceName}`,
      `/${resourceName}/{id}`,
    ];

    for (const path of candidatePaths) {
      const pathItem = paths[path] as Record<string, any> | undefined;
      const getOperation = pathItem?.['get'];
      const schema =
        getOperation?.responses?.['200']?.content?.['application/json']?.schema;
      const rowSchema = this.resolveRowSchema(schema);
      const properties = rowSchema?.properties as
        | Record<string, any>
        | undefined;
      if (!properties) {
        continue;
      }

      return Object.entries(properties).map(([name, propertySchema]) => ({
        name,
        label: this.titleFromName(name),
        type: this.sourceFieldTypeFromOpenApi(
          propertySchema as Record<string, unknown>
        ),
        openapi: propertySchema as Record<string, unknown>,
      }));
    }

    return [];
  }

  private resolveRowSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return null;
    }

    if (schema.type === 'object' && schema.properties) {
      const values = Object.values(schema.properties as Record<string, any>);
      const arrayProperty = values.find(
        value => value?.type === 'array' && value?.items
      );
      return arrayProperty?.items ?? schema;
    }

    if (schema.type === 'array' && schema.items) {
      return schema.items;
    }

    return null;
  }

  private sourceFieldTypeFromOpenApi(schema: Record<string, unknown>): string {
    const type = String(schema?.['type'] ?? 'string');
    const format = String(schema?.['format'] ?? '');
    return format ? `${type}:${format}` : type;
  }

  private mapRelatedToRelationships(related?: any[]): SourceRelationship[] {
    if (!Array.isArray(related)) {
      return [];
    }

    return related
      .map((item: any) => ({
        name: String(item?.name ?? item?.field ?? ''),
        label: String(
          item?.label ??
            this.titleFromName(String(item?.name ?? item?.field ?? ''))
        ),
        type: String(item?.type ?? 'relationship'),
        field: String(item?.field ?? ''),
        refTable: String(item?.ref_table ?? item?.table ?? ''),
        refField: String(item?.ref_field ?? item?.id_field ?? ''),
      }))
      .filter(item => !!item.name);
  }

  private buildFilterString(): string {
    return this.filterRules
      .filter(filter => filter.field && filter.value !== '')
      .map(filter => {
        const value = this.formatFilterValue(filter);
        return filter.operator === 'like'
          ? `${filter.field} like ${value}`
          : `${filter.field}${filter.operator}${value}`;
      })
      .join(' AND ');
  }

  private parseFilters(filterString: string): FilterRule[] {
    if (!filterString.trim()) {
      return [];
    }

    return filterString
      .split(/\s+AND\s+/i)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const likeMatch = part.match(/^([A-Za-z0-9_]+)\s+like\s+'?(.*?)'?$/i);
        if (likeMatch) {
          const [, field, value] = likeMatch;
          return {
            field,
            operator: 'like' as FilterOperator,
            value: value.replace(/^%|%$/g, ''),
          };
        }

        const opMatch = part.match(
          /^([A-Za-z0-9_]+)\s*(=|!=|>=|<=|>|<)\s*'?(.+?)'?$/
        );
        if (opMatch) {
          const [, field, operator, value] = opMatch;
          return {
            field,
            operator: operator as FilterOperator,
            value,
          };
        }

        return null;
      })
      .filter((rule): rule is FilterRule => !!rule);
  }

  private formatFilterValue(filter: FilterRule): string {
    const value =
      filter.operator === 'like' ? `%${filter.value}%` : filter.value;
    const field = this.sourceFields.find(item => item.name === filter.field);
    if (field && this.isNumericField(field)) {
      return value;
    }

    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }

    return `'${value.replace(/'/g, "''")}'`;
  }

  private buildRequestSchema(includeId: boolean): Record<string, unknown> {
    if (!includeId) {
      return {};
    }

    const primaryKey =
      this.sourceFields.find(field => this.isPrimaryKey(field)) ??
      this.sourceFields.find(field => field.name === 'id');

    return {
      path: {
        id: {
          ...this.openApiSchemaForField(primaryKey),
          required: true,
          description: primaryKey
            ? `Value for ${primaryKey.label || primaryKey.name}.`
            : 'Record identifier.',
        },
      },
    };
  }

  private buildResponseSchema(
    outputKey: string,
    includeId: boolean
  ): Record<string, unknown> {
    const properties = Object.fromEntries(
      this.selectedFieldNames.map(fieldName => {
        const field = this.sourceFields.find(item => item.name === fieldName);
        return [fieldName, this.openApiSchemaForField(field)];
      })
    );
    const required = this.sourceFields
      .filter(
        field =>
          this.selectedFields.has(field.name) &&
          !!field.required &&
          !(field.allowNull ?? field.allow_null)
      )
      .map(field => field.name);
    const rowSchema: Record<string, unknown> = {
      type: 'object',
      properties,
      additionalProperties: false,
    };
    if (required.length) {
      rowSchema['required'] = required;
    }

    return {
      type: 'object',
      properties: {
        [outputKey]: includeId
          ? rowSchema
          : {
              type: 'array',
              items: rowSchema,
            },
      },
      additionalProperties: false,
    };
  }

  private openApiSchemaForField(field?: SourceField): Record<string, unknown> {
    if (field?.openapi) {
      return field.openapi;
    }

    const type = this.fieldType(field);
    if (this.isNumericField(field)) {
      return type.includes('int') || type === 'id'
        ? { type: 'integer' }
        : { type: 'number' };
    }
    if (type.includes('bool')) {
      return { type: 'boolean' };
    }
    if (type === 'date') {
      return { type: 'string', format: 'date' };
    }
    if (type.includes('date') || type.includes('time')) {
      return { type: 'string', format: 'date-time' };
    }
    if (type === 'array') {
      return { type: 'array', items: {} };
    }
    if (type === 'object') {
      return { type: 'object', additionalProperties: true };
    }

    const schema: Record<string, unknown> = { type: 'string' };
    if (field?.length) {
      schema['maxLength'] = field.length;
    }
    if (field && (field.allowNull ?? field.allow_null)) {
      schema['nullable'] = true;
    }

    return schema;
  }

  fieldTypeLabel(field: SourceField): string {
    const pieces = [field.type, field.dbType ?? field.db_type].filter(Boolean);
    const size =
      field.length ??
      (field.precision
        ? `${field.precision}${field.scale ? `,${field.scale}` : ''}`
        : null);
    return `${pieces.join(' / ')}${size ? ` (${size})` : ''}`;
  }

  isPrimaryKey(field: SourceField): boolean {
    return !!(field.isPrimaryKey ?? field.is_primary_key);
  }

  isUnique(field: SourceField): boolean {
    return !!(field.isUnique ?? field.is_unique);
  }

  isForeignKey(field: SourceField): boolean {
    return !!(field.isForeignKey ?? field.is_foreign_key);
  }

  private isNumericField(field?: SourceField): boolean {
    const type = this.fieldType(field);
    return ['number', 'integer', 'decimal', 'float', 'double', 'id'].some(
      item => type.includes(item)
    );
  }

  private fieldType(field?: SourceField): string {
    return String(field?.type ?? field?.dbType ?? field?.db_type ?? '')
      .toLowerCase()
      .trim();
  }

  private safeStepId(value: string): string {
    return value.replace(/[^A-Za-z0-9_]+/g, '_');
  }

  private describeHttpError(error: any): string {
    const message =
      error?.error?.context?.resource?.[0]?.message ??
      error?.error?.message ??
      error?.message ??
      'Unknown error.';
    const normalized = String(message)
      .replace(/\s+/g, ' ')
      .replace(/&quot;/g, '"')
      .trim();

    if (
      normalized.includes('Duplicate entry') &&
      normalized.includes('api_id_method_path_unique')
    ) {
      return 'An endpoint with the same HTTP method and path already exists in this API.';
    }

    return normalized;
  }

  titleFromName(value: string): string {
    return value
      .split(/[_-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private toast(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000 });
  }
}
