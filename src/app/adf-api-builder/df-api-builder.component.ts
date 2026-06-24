import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { BASE_URL } from '../shared/constants/urls';
import { DfApiBuilderWorkspaceComponent } from './df-api-builder-workspace.component';
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
  id?: number;
  name: string;
  label?: string;
  type: string;
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

type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like';

type FilterRule = {
  field: string;
  operator: FilterOperator;
  value: string;
};

type OutputShape = 'resource' | 'data' | 'table';

type FilterOperatorOption = {
  value: FilterOperator;
  label: string;
};

type OpenApiDocument = {
  openapi?: string;
  swagger?: string;
  paths?: Record<string, unknown>;
};

type WorkflowStepKey =
  | 'source'
  | 'shape'
  | 'rules'
  | 'route'
  | 'output'
  | 'publish';

type WorkflowStep = {
  key: WorkflowStepKey;
  label: string;
  detail: string;
  complete: boolean;
};

@Component({
  selector: 'df-api-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
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
    MatTooltipModule,
    DfApiBuilderWorkspaceComponent,
  ],
  template: `
    <section class="builder-shell">
      <header class="builder-header">
        <div *ngIf="!editorOpen">
          <p class="eyebrow">API Builder</p>
          <h1>Custom APIs</h1>
          <p>
            Manage built APIs, open one to edit its endpoints, or create a new
            API.
          </p>
        </div>
        <a
          *ngIf="editorOpen"
          class="back-link"
          role="button"
          tabindex="0"
          (click)="closeEditor()"
          (keydown.enter)="closeEditor()">
          <mat-icon>arrow_back</mat-icon>
          All APIs
        </a>
        <div class="header-actions">
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

      <mat-progress-bar
        *ngIf="loading || saving || previewing"
        mode="indeterminate"></mat-progress-bar>

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
            <button
              mat-icon-button
              class="api-card-delete"
              type="button"
              aria-label="Delete API"
              matTooltip="Delete API"
              (click)="deleteApi(api.id, $event)">
              <mat-icon>delete</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            <p>{{ api.description || 'No description yet.' }}</p>
            <div class="card-meta">
              <span class="status-chip status-{{ api.status || 'draft' }}">{{
                api.status || 'draft'
              }}</span>
              <span class="count-chip">
                {{ endpointCounts.get(api.id) ?? 0 }}
                {{
                  (endpointCounts.get(api.id) ?? 0) === 1
                    ? 'endpoint'
                    : 'endpoints'
                }}
              </span>
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

      <div class="api-detail" *ngIf="editorOpen">
        <mat-card class="api-settings-card">
          <form
            [formGroup]="apiForm"
            class="api-settings-form"
            (ngSubmit)="saveApi()">
            <div class="api-settings-head">
              <div class="api-title-block">
                <p class="eyebrow">Custom API</p>
                <h2>
                  {{
                    apiForm.value.label ||
                      apiForm.value.basePath ||
                      'Untitled API'
                  }}
                </h2>
                <code class="base-url" *ngIf="apiForm.value.basePath"
                  >/api/v2/{{ apiForm.value.basePath }}</code
                >
              </div>
              <div class="api-settings-actions">
                <span class="status-chip status-{{ apiForm.value.status }}">{{
                  apiForm.value.status || 'draft'
                }}</span>
                <button
                  mat-button
                  type="button"
                  [disabled]="!selectedApiId"
                  (click)="openApiDocs()">
                  <mat-icon>description</mat-icon>
                  API Docs
                </button>
                <button
                  mat-button
                  color="warn"
                  type="button"
                  *ngIf="selectedApiId"
                  (click)="deleteApi(selectedApiId)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </div>
            </div>
            <div class="api-settings-grid">
              <mat-form-field appearance="outline">
                <mat-label>API Name</mat-label>
                <input matInput formControlName="label" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>API URL Segment</mat-label>
                <input matInput formControlName="basePath" />
                <mat-hint>Served at /api/v2/&lt;segment&gt;</mat-hint>
                <mat-error
                  *ngIf="apiForm.controls.basePath.hasError('required')">
                  API URL is required.
                </mat-error>
                <mat-error
                  *ngIf="apiForm.controls.basePath.hasError('pattern')">
                  Use letters, numbers, dashes, or underscores only.
                </mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="draft">Draft</mat-option>
                  <mat-option value="published">Published</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="span-all">
                <mat-label>Description</mat-label>
                <textarea
                  matInput
                  rows="2"
                  formControlName="description"></textarea>
              </mat-form-field>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="save-api-btn"
                [disabled]="apiForm.invalid || saving">
                <mat-icon>save</mat-icon>
                Save API
              </button>
            </div>
          </form>
        </mat-card>

        <df-api-builder-workspace
          *ngIf="selectedApiId"
          [apiId]="selectedApiId"
          (workspaceChanged)="
            loadWorkspaceServices(selectedApiId)
          "></df-api-builder-workspace>

        <div class="endpoints-section">
          <div class="endpoints-bar">
            <div>
              <h3>Endpoints</h3>
              <p class="muted">
                Click an endpoint to edit it, or add a new one.
              </p>
            </div>
            <button
              mat-flat-button
              color="primary"
              type="button"
              [disabled]="!selectedApiId"
              (click)="addEndpoint()">
              <mat-icon>add</mat-icon>
              Add Endpoint
            </button>
          </div>

          <p class="save-hint" *ngIf="!selectedApiId">
            <mat-icon>info</mat-icon>
            <span
              >Save the API above first — then you can add endpoints to
              it.</span
            >
          </p>

          <div class="endpoint-accordion">
            <div class="endpoint-card open" *ngIf="addingEndpoint">
              <div class="endpoint-row">
                <div class="endpoint-row-main static">
                  <span class="method-chip method-get">NEW</span>
                  <span class="ep-path">{{
                    endpointForm.value.path || 'new endpoint'
                  }}</span>
                  <span class="ep-label">{{
                    endpointForm.value.label || 'Unsaved endpoint'
                  }}</span>
                </div>
                <button
                  mat-icon-button
                  type="button"
                  matTooltip="Discard"
                  (click)="cancelAddEndpoint()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="endpoint-editor">
                <ng-container *ngTemplateOutlet="endpointEditor"></ng-container>
              </div>
            </div>

            <div
              class="endpoint-card"
              *ngFor="let endpoint of selectedEndpoints; trackBy: trackById"
              [class.open]="
                endpoint.id === selectedEndpointId && !addingEndpoint
              ">
              <div class="endpoint-row">
                <button
                  type="button"
                  class="endpoint-row-main"
                  (click)="toggleEndpoint(endpoint)">
                  <span
                    class="method-chip method-{{
                      endpoint.method || 'get' | lowercase
                    }}"
                    >{{ endpoint.method }}</span
                  >
                  <span class="ep-path">{{ endpoint.path }}</span>
                  <span class="ep-label">{{
                    endpoint.label || 'Untitled endpoint'
                  }}</span>
                  <span class="spacer"></span>
                  <mat-icon class="ep-chevron">{{
                    endpoint.id === selectedEndpointId && !addingEndpoint
                      ? 'expand_less'
                      : 'expand_more'
                  }}</mat-icon>
                </button>
                <button
                  mat-icon-button
                  class="endpoint-row-delete"
                  type="button"
                  matTooltip="Delete endpoint"
                  (click)="deleteEndpoint(endpoint.id, $event)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              <div
                class="endpoint-editor"
                *ngIf="endpoint.id === selectedEndpointId && !addingEndpoint">
                <ng-container *ngTemplateOutlet="endpointEditor"></ng-container>
              </div>
            </div>

            <div
              class="empty-state small"
              *ngIf="
                selectedApiId &&
                selectedEndpoints.length === 0 &&
                !addingEndpoint
              ">
              <mat-icon>route</mat-icon>
              <strong>No endpoints yet</strong>
              <span>Add an endpoint to expose data from a source.</span>
            </div>
          </div>
        </div>
      </div>

      <ng-template #endpointEditor>
        <form
          [formGroup]="endpointForm"
          class="endpoint-shell"
          (ngSubmit)="saveEndpoint(false)">
          <div class="route-preview hero-preview" id="workflow-route">
            <mat-icon>route</mat-icon>
            <span>
              <strong>{{ generatedRouteLabel }}</strong>
              <small>{{ sourceSummary }}</small>
            </span>
          </div>

          <section class="endpoint-identity" [formGroup]="endpointForm">
            <mat-form-field appearance="outline">
              <mat-label>Endpoint Name</mat-label>
              <input
                matInput
                formControlName="label"
                placeholder="e.g. List active customers" />
              <mat-hint>A friendly name for this endpoint.</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Endpoint URL Path</mat-label>
              <input matInput formControlName="path" placeholder="/customers" />
              <mat-hint
                >The path for this endpoint under the API (e.g.
                /customers).</mat-hint
              >
            </mat-form-field>
          </section>

          <section class="workflow-strip" aria-label="Workflow status">
            <button
              type="button"
              class="workflow-step"
              *ngFor="let step of workflowSteps; trackBy: trackByStepKey"
              [class.complete]="step.complete"
              (click)="focusWorkflowStep(step.key)">
              <span class="step-top">
                <mat-icon class="step-check">{{
                  step.complete ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <span class="step-label">{{ step.label }}</span>
              </span>
              <span class="step-detail">{{ step.detail }}</span>
            </button>
          </section>

          <div
            class="source-builder"
            [formGroup]="sourceForm"
            id="workflow-source">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Source API</mat-label>
              <input
                matInput
                type="text"
                placeholder="Type to search source APIs…"
                [value]="sourceServiceSearch"
                (input)="sourceServiceSearch = $any($event.target).value"
                (focus)="onSourceFocus()"
                (blur)="onSourceBlur()"
                [matAutocomplete]="svcAuto" />
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete
                #svcAuto="matAutocomplete"
                (optionSelected)="chooseSourceService($event.option.value)">
                <mat-option *ngIf="sourceServicesLoading" disabled>
                  Loading sources…
                </mat-option>
                <mat-option
                  *ngFor="
                    let service of filteredSourceServices;
                    trackBy: trackByName
                  "
                  [value]="service.name">
                  {{ service.label || service.name }}
                  <small class="option-meta"
                    >{{ service.type }} ·
                    {{ introspectionBadge(service) }}</small
                  >
                </mat-option>
                <mat-option
                  *ngIf="
                    !sourceServicesLoading &&
                    filteredSourceServices.length === 0
                  "
                  disabled>
                  No matching source APIs
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <div
              class="recent-source-chips"
              *ngIf="recentSourceServices.length">
              <button
                mat-stroked-button
                type="button"
                *ngFor="
                  let recent of recentSourceServices;
                  trackBy: trackByName
                "
                (click)="selectRecentSource(recent.name)">
                {{ recent.label || recent.name }}
              </button>
            </div>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Table / Resource</mat-label>
              <input
                matInput
                type="text"
                placeholder="Type to search tables…"
                [value]="sourceTableSearch"
                (input)="sourceTableSearch = $any($event.target).value"
                (focus)="onTableFocus()"
                (blur)="onTableBlur()"
                [matAutocomplete]="tblAuto"
                [disabled]="!sourceForm.value.service" />
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete
                #tblAuto="matAutocomplete"
                (optionSelected)="chooseSourceTable($event.option.value)">
                <mat-option
                  *ngFor="
                    let table of filteredSourceTables;
                    trackBy: trackByName
                  "
                  [value]="table.name">
                  {{ table.label || titleFromName(table.name) }}
                </mat-option>
                <mat-option *ngIf="filteredSourceTables.length === 0" disabled>
                  {{
                    sourceForm.value.service
                      ? 'No matching tables'
                      : 'Select a source API first'
                  }}
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <p class="source-hint" *ngIf="sourceIntrospectionHint">
              {{ sourceIntrospectionHint }}
            </p>
            <mat-checkbox
              class="id-toggle"
              formControlName="includeId"
              (change)="generateEndpointFromSource()">
              Pass an ID in the URL
            </mat-checkbox>
          </div>

          <section
            class="builder-section"
            *ngIf="sourceFields.length"
            id="workflow-shape">
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
              <div
                class="field-item"
                *ngFor="
                  let field of displayedSourceFields;
                  trackBy: trackByName
                ">
                <mat-checkbox
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
                <input
                  class="rename-input"
                  *ngIf="isFieldSelected(field.name)"
                  [value]="aliasFor(field.name)"
                  [placeholder]="'rename ' + field.name + '…'"
                  (input)="setAlias(field.name, $any($event.target).value)" />
              </div>
            </div>
          </section>

          <section class="builder-section" *ngIf="sourceRelationships.length">
            <div class="section-heading">
              <span>
                <strong>Relationships</strong>
                <small
                  >Choose related resources to include in the same call.</small
                >
              </span>
            </div>
            <div class="relationship-grid">
              <div
                class="relationship-item"
                *ngFor="
                  let relationship of sourceRelationships;
                  trackBy: trackByName
                ">
                <mat-checkbox
                  class="relationship-pill"
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
                <input
                  class="rename-input"
                  *ngIf="isRelationshipSelected(relationship.name)"
                  [value]="aliasFor(relationship.name)"
                  [placeholder]="'rename to…'"
                  (input)="
                    setAlias(relationship.name, $any($event.target).value)
                  " />
              </div>
            </div>
          </section>

          <section class="builder-section" id="workflow-rules">
            <div class="section-heading">
              <span>
                <strong>Filters</strong>
                <small
                  >Add simple rules to limit what this endpoint returns.</small
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
                >No filters yet. This endpoint will return matching records from
                the selected table.</span
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
                  (selectionChange)="updateFilter(i, 'field', $event.value)">
                  <mat-option
                    *ngFor="let field of sourceFields; trackBy: trackByName"
                    [value]="field.name">
                    {{ field.label || titleFromName(field.name) }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Match</mat-label>
                <mat-select
                  [value]="filter.operator"
                  (selectionChange)="updateFilter(i, 'operator', $event.value)">
                  <mat-option
                    *ngFor="
                      let option of filterOperatorOptions(filter.field);
                      trackBy: trackByOptionValue
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

          <section class="builder-section" id="workflow-output">
            <div class="section-heading">
              <span>
                <strong>Result Options</strong>
                <small
                  >Set the default sort, row limit, and response wrapper.</small
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
                    *ngFor="let field of sourceFields; trackBy: trackByName"
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
                  <mat-option value="resource"
                    >Wrap in "resource" key (DreamFactory default)</mat-option
                  >
                  <mat-option value="data">Wrap in "data" key</mat-option>
                  <mat-option value="table">Wrap in table-named key</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </section>

          <p class="save-hint" *ngIf="!selectedApiId">
            <mat-icon>info</mat-icon>
            <span
              >Save the API above first — then you can create endpoints inside
              it.</span
            >
          </p>

          <div class="save-row" id="workflow-publish">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="endpointForm.invalid || saving || hasJsonErrors">
              <mat-icon>add_link</mat-icon>
              {{ selectedEndpointId ? 'Update Endpoint' : 'Create Endpoint' }}
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="endpointForm.invalid || saving || hasJsonErrors"
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
            <span class="save-row-spacer"></span>
            <button
              mat-button
              type="button"
              *ngIf="selectedEndpointId"
              (click)="duplicateSelectedEndpoint()">
              <mat-icon>content_copy</mat-icon>
              Duplicate
            </button>
            <button
              mat-button
              color="warn"
              type="button"
              *ngIf="selectedEndpointId"
              (click)="deleteEndpoint(selectedEndpointId)">
              <mat-icon>delete</mat-icon>
              Delete
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
            <div *ngIf="previewTrace.length" style="margin: 4px 0 12px;">
              <div
                style="font-size: 0.8em; color: rgba(0,0,0,0.55); margin-bottom: 4px;">
                Execution trace — {{ previewTrace.length }} step(s){{
                  previewOk === false ? ' · failed' : ''
                }}
              </div>
              <div
                *ngFor="let s of previewTrace"
                style="display: flex; align-items: center; gap: 10px; padding: 6px 0; border-top: 1px solid rgba(0,0,0,0.06);">
                <mat-icon
                  [style.color]="s.ok === false ? '#d9534f' : '#1a7f1a'"
                  style="font-size: 18px; width: 18px; height: 18px;"
                  >{{ s.ok === false ? 'error' : 'check_circle' }}</mat-icon
                >
                <strong>{{ s.key }}</strong>
                <span style="color: rgba(0,0,0,0.6);"
                  >{{ s.method }} {{ s.service }}/{{ s.resource }}</span
                >
                <span style="flex: 1;"></span>
                <span
                  [style.color]="s.ok === false ? '#a11' : 'rgba(0,0,0,0.7)'"
                  >{{ s.ok === false ? s.error : s.preview }}</span
                >
                <span *ngIf="s.ms != null" style="color: rgba(0,0,0,0.45);"
                  >{{ s.ms }}ms</span
                >
              </div>
            </div>
            <pre>{{ previewResult }}</pre>
          </section>
        </form>

        <section class="endpoint-inspect">
          <p class="inspect-heading">Inspect &amp; advanced</p>
          <mat-tab-group class="endpoint-panel-tabs">
            <mat-tab label="Inspector">
              <div class="inspector-panel">
                <div class="inspector-block">
                  <strong>Execution Steps</strong>
                  <div
                    class="preview-list"
                    *ngIf="executionStepsPreview.length; else noSteps">
                    <div
                      class="preview-row"
                      *ngFor="
                        let step of executionStepsPreview;
                        trackBy: trackByTitle
                      ">
                      <span>{{ step.title }}</span>
                      <small>{{ step.detail }}</small>
                    </div>
                  </div>
                  <ng-template #noSteps>
                    <p class="inspector-empty">
                      No execution steps in JSON yet.
                    </p>
                  </ng-template>
                </div>

                <div class="inspector-block">
                  <strong>Response Fields</strong>
                  <div
                    class="response-tags"
                    *ngIf="responseFieldsPreview.length; else noResponseFields">
                    <span
                      class="response-tag"
                      *ngFor="
                        let field of responseFieldsPreview;
                        trackBy: trackByValue
                      "
                      >{{ field }}</span
                    >
                  </div>
                  <ng-template #noResponseFields>
                    <p class="inspector-empty">
                      No response mapping fields yet.
                    </p>
                  </ng-template>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Advanced JSON">
              <div class="advanced-json-panel" [formGroup]="endpointForm">
                <mat-form-field appearance="outline" class="json-field">
                  <mat-label>Execution Plan JSON</mat-label>
                  <textarea
                    matInput
                    rows="10"
                    formControlName="executionPlan"></textarea>
                  <mat-error *ngIf="executionPlanError">{{
                    executionPlanError
                  }}</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="json-field">
                  <mat-label>Response Mapping JSON</mat-label>
                  <textarea
                    matInput
                    rows="8"
                    formControlName="responseMapping"></textarea>
                  <mat-error *ngIf="responseMappingError">{{
                    responseMappingError
                  }}</mat-error>
                </mat-form-field>

                <details style="margin-top: 4px;">
                  <summary
                    style="cursor: pointer; color: #2a4b8d; font-weight: 600;">
                    Step types &amp; examples
                  </summary>
                  <div
                    style="font-size: 0.88em; color: rgba(0,0,0,0.75); padding: 8px 2px;">
                    <p>
                      <strong>service_request</strong> — call a workspace
                      service (database / file / remote). Selectors are static;
                      <code>params</code>/<code>body</code> resolve caller input
                      via <code>&#123;path.*&#125;</code>,
                      <code>&#123;query.*&#125;</code>,
                      <code>&#123;body.*&#125;</code>,
                      <code>&#123;steps.&lt;id&gt;.*&#125;</code>.
                    </p>
                    <p>
                      <strong>transform</strong> — reshape a prior step
                      in-memory (no request). <code>from</code> = a context path;
                      <code>ops</code> run in order. Ops: <code>pick</code>,
                      <code>omit</code>, <code>rename</code>,
                      <code>defaults</code>, <code>first</code>,
                      <code>limit</code>, <code>count</code>, <code>wrap</code>,
                      <code>unwrap</code>.
                    </p>
                    <p style="margin-bottom: 4px;">
                      Example — fetch rows, then shape them:
                    </p>
                    <pre
                      style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 6px; overflow: auto;">{{ stepExample }}</pre>
                    <p>
                      Run <strong>Preview Return</strong> to execute it and see
                      each step's result, status, and timing.
                    </p>
                  </div>
                </details>
              </div>
            </mat-tab>

            <mat-tab label="Test">
              <div class="test-panel" [formGroup]="testForm">
                <p class="inspector-empty" *ngIf="!selectedEndpointId">
                  Save and select an endpoint to run a live test against it.
                </p>
                <ng-container *ngIf="selectedEndpointId">
                  <mat-form-field appearance="outline" class="json-field">
                    <mat-label>Path Params JSON</mat-label>
                    <textarea
                      matInput
                      rows="4"
                      formControlName="pathParams"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="json-field">
                    <mat-label>Query JSON</mat-label>
                    <textarea
                      matInput
                      rows="3"
                      formControlName="query"></textarea>
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    [disabled]="saving || testForm.invalid"
                    (click)="testEndpoint()">
                    <mat-icon>play_arrow</mat-icon>
                    Run Test
                  </button>
                  <pre *ngIf="testResult">{{ testResult }}</pre>
                </ng-container>
              </div>
            </mat-tab>
          </mat-tab-group>
        </section>
      </ng-template>
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

      .back-link {
        align-items: center;
        cursor: pointer;
        display: inline-flex;
        font-weight: 600;
        gap: 6px;
        opacity: 0.85;
      }

      .back-link:hover {
        opacity: 1;
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

      /* ===== Restructured API detail view ===== */
      .api-detail {
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .api-settings-card {
        border-radius: 10px;
      }

      .api-settings-head {
        align-items: flex-start;
        display: flex;
        gap: 16px;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .api-title-block h2 {
        font-size: 22px;
        line-height: 1.2;
        margin: 4px 0 8px;
      }

      .base-url {
        background: rgba(127, 127, 127, 0.12);
        border-radius: 6px;
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        padding: 3px 8px;
      }

      .api-settings-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .status-chip {
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 4px 10px;
        text-transform: uppercase;
      }

      .status-draft {
        background: rgba(255, 171, 0, 0.16);
        color: #b07400;
      }

      .status-published {
        background: rgba(34, 197, 94, 0.16);
        color: #1a7f43;
      }

      .api-settings-grid {
        align-items: start;
        display: grid;
        gap: 12px 14px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .api-settings-grid .span-all {
        grid-column: 1 / -1;
      }

      .api-settings-grid .save-api-btn {
        justify-self: start;
      }

      /* ===== Endpoints section ===== */
      .endpoints-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .endpoints-bar {
        align-items: center;
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }

      .endpoints-bar h3 {
        font-size: 18px;
        margin: 0;
      }

      .endpoints-bar .muted {
        margin: 2px 0 0;
        opacity: 0.7;
      }

      .endpoint-accordion {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .endpoint-card {
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 8px;
        overflow: hidden;
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
      }

      .endpoint-card.open {
        border-color: rgba(63, 81, 181, 0.55);
        box-shadow: 0 1px 12px rgba(63, 81, 181, 0.12);
      }

      .endpoint-row {
        align-items: center;
        display: flex;
        gap: 4px;
      }

      .endpoint-row-main {
        align-items: center;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex: 1;
        font: inherit;
        gap: 12px;
        min-width: 0;
        padding: 12px 14px;
        text-align: left;
        width: 100%;
      }

      .endpoint-row-main.static {
        cursor: default;
      }

      .endpoint-row-main:hover:not(.static) {
        background: rgba(127, 127, 127, 0.06);
      }

      .method-chip {
        border-radius: 5px;
        color: #fff;
        flex: none;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.03em;
        min-width: 56px;
        padding: 4px 8px;
        text-align: center;
      }

      .method-get {
        background: #49cc90;
      }
      .method-post {
        background: #61affe;
      }
      .method-put {
        background: #fca130;
      }
      .method-delete {
        background: #f93e3e;
      }
      .method-patch {
        background: #50e3c2;
      }

      .ep-path {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ep-label {
        opacity: 0.68;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .spacer {
        flex: 1;
      }

      .ep-chevron {
        flex: none;
        opacity: 0.55;
      }

      .endpoint-row-delete {
        flex: none;
        opacity: 0.45;
      }

      .endpoint-row:hover .endpoint-row-delete {
        opacity: 1;
      }

      .endpoint-editor {
        border-top: 1px solid rgba(127, 127, 127, 0.2);
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 18px 16px;
      }

      .endpoint-inspect {
        border-top: 1px solid rgba(127, 127, 127, 0.18);
        padding-top: 10px;
      }

      .inspect-heading {
        font-size: 13px;
        font-weight: 700;
        margin: 0 0 4px;
        opacity: 0.7;
      }

      .empty-state.small {
        gap: 6px;
        padding: 32px 16px;
      }

      .endpoint-panel-tabs {
        margin-top: 12px;
      }

      .inspector-panel {
        display: grid;
        gap: 12px;
        padding-top: 12px;
      }

      .inspector-block {
        border: 1px solid rgba(127, 127, 127, 0.25);
        border-radius: 8px;
        display: grid;
        gap: 8px;
        padding: 10px;
      }

      .inspector-empty {
        margin: 0;
        opacity: 0.72;
      }

      .response-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .response-tag {
        border: 1px solid rgba(127, 127, 127, 0.3);
        border-radius: 999px;
        font-size: 12px;
        padding: 2px 8px;
      }

      .advanced-json-panel {
        display: grid;
        gap: 10px;
        padding-top: 12px;
      }

      .workflow-strip {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        margin-bottom: 8px;
      }

      .workflow-step {
        align-items: stretch;
        background: rgba(127, 127, 127, 0.05);
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 8px;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        font: inherit;
        gap: 5px;
        line-height: 1.3;
        padding: 10px 12px;
        text-align: left;
      }

      .workflow-step:hover {
        border-color: rgba(148, 163, 184, 0.7);
      }

      .workflow-step.complete {
        background: rgba(34, 197, 94, 0.1);
        border-color: rgba(34, 197, 94, 0.55);
      }

      .step-top {
        align-items: center;
        display: flex;
        gap: 6px;
      }

      .step-check {
        font-size: 17px;
        height: 17px;
        opacity: 0.45;
        width: 17px;
      }

      .workflow-step.complete .step-check {
        color: #16a34a;
        opacity: 1;
      }

      .workflow-step .step-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .workflow-step.complete .step-label {
        color: #15803d;
      }

      .workflow-step .step-detail {
        font-size: 12.5px;
        opacity: 0.92;
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

      .endpoint-shell {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

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

      .recent-source-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .source-hint {
        font-size: 12px;
        margin: 0;
        opacity: 0.82;
      }

      .option-meta {
        margin-left: 6px;
        opacity: 0.6;
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

      .endpoint-identity {
        display: grid;
        gap: 12px;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }

      @media (max-width: 980px) {
        .endpoint-identity {
          grid-template-columns: 1fr;
        }
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

      .field-item {
        border: 1px solid rgba(127, 127, 127, 0.22);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 6px 8px;
      }

      .rename-input {
        background: rgba(127, 127, 127, 0.06);
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 4px;
        font-size: 12px;
        margin-top: 2px;
        outline: none;
        padding: 3px 6px;
        width: 100%;
      }

      .rename-input:focus {
        border-color: rgba(63, 81, 181, 0.6);
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

      .relationship-item {
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 10px;
      }

      .relationship-pill {
        display: flex;
        flex-direction: column;
        gap: 2px;
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
        flex-wrap: wrap;
        gap: 8px;
      }

      .save-row-spacer {
        flex: 1;
      }

      .count-chip {
        border: 1px solid rgba(127, 127, 127, 0.35);
        border-radius: 999px;
        font-size: 12px;
        padding: 4px 8px;
      }

      .save-hint {
        align-items: center;
        background: rgba(255, 171, 0, 0.1);
        border: 1px solid rgba(255, 171, 0, 0.4);
        border-radius: 8px;
        display: flex;
        gap: 8px;
        margin: 0;
        padding: 10px 12px;
      }

      .save-hint mat-icon {
        color: #c77700;
        flex: none;
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

      .api-card mat-card-header {
        position: relative;
      }

      .api-card-delete {
        position: absolute;
        right: 4px;
        top: 4px;
      }

      .api-card mat-card-title {
        overflow: hidden;
        padding-right: 32px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .route-preview small {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .test-panel {
        display: grid;
        gap: 10px;
        padding-top: 12px;
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
        .builder-header {
          display: flex;
          flex-direction: column;
        }

        .header-actions {
          flex-wrap: wrap;
        }

        .source-builder,
        .filter-row,
        .field-toolbar,
        .result-options {
          grid-template-columns: 1fr;
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
  private destroyRef = inject(DestroyRef);

  apis: ApiDefinition[] = [];
  endpoints: EndpointDefinition[] = [];
  endpointCounts = new Map<number, number>();
  sourceServices: SourceService[] = [];
  sourceTables: SourceTable[] = [];
  sourceFields: SourceField[] = [];
  sourceRelationships: SourceRelationship[] = [];
  sourceOpenApiPaths: string[] = [];
  sourceServiceSearch = '';
  sourceTableSearch = '';
  sourceIntrospectionHint = '';
  private readonly recentSourceKey = 'df_api_builder_recent_sources';
  // Service types that expose no buildable tables/resources, so they are hidden
  // from the source picker (you can't build a data endpoint off a file store,
  // mail relay, auth provider, or the docs service).
  private readonly NON_SOURCE_TYPES = new Set<string>([
    'local_file',
    'aws_s3',
    'azure_blob',
    'rackspace_cloud_files',
    'openstack_object_storage',
    'ftp',
    'sftp',
    'webdav',
    'local_email',
    'smtp',
    'mailgun',
    'mandrill',
    'sendgrid',
    'aws_ses',
    'office365',
    'user',
    'oauth',
    'oauth_azure_ad',
    'oauth_facebook',
    'oauth_github',
    'oauth_google',
    'oauth_linkedin',
    'oauth_microsoft',
    'oauth_twitter',
    'oidc',
    'saml',
    'ldap',
    'adldap',
    'azure_ad',
    'swagger',
    'system',
    'api_builder',
  ]);
  recentSourceNames: string[] = [];
  selectedFields = new Set<string>();
  selectedRelationships = new Set<string>();
  // Output rename map: source field/relationship name -> alias to emit in the
  // response. Applied as a cheap key-remap pass on the fetched rows server-side.
  fieldAliases: Record<string, string> = {};
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
  sourceServicesLoading = false;
  editorOpen = false;
  selectedApiId: number | null = null;
  selectedEndpointId: number | null = null;
  addingEndpoint = false;
  testResult = '';
  previewResult = '';
  previewTrace: Array<{
    key: string;
    service?: string;
    resource?: string;
    method?: string;
    ok?: boolean;
    preview?: string;
    error?: string;
    ms?: number;
  }> = [];
  previewOk: boolean | null = null;
  previewStale = false;
  previewing = false;
  stepExample = `{
  "steps": [
    { "id": "rows", "type": "service_request",
      "service": "your_db", "resource": "_table/your_table",
      "method": "GET", "params": { "limit": "25" } },
    { "id": "shaped", "type": "transform", "from": "{steps.rows.resource}",
      "ops": [
        { "op": "pick", "fields": ["id", "name"] },
        { "op": "rename", "map": { "name": "title" } }
      ] }
  ]
}

Response Mapping  ->  { "items": "{steps.shaped}" }`;

  // Memo caches for the two JSON-parsing preview getters. These getters are
  // bound in the template (*ngIf / *ngFor) and run on every change-detection
  // pass; without memoization they JSON.parse the editor text every tick and
  // return a fresh array reference each time. The cache key is the exact raw
  // editor string, so a cache hit is provably identical to a recompute.
  private executionStepsCache: { key: string; value: StepPreview[] } | null =
    null;
  private responseFieldsCache: { key: string; value: string[] } | null = null;

  // Last identity values auto-generated from the source. Used so regeneration
  // only overwrites path/label/description that the user hasn't manually edited:
  // if the current field still equals what we last generated (or is empty) it's
  // safe to refresh; once the user changes it, we leave it alone.
  private lastGeneratedPath = '';
  private lastGeneratedLabel = '';
  private lastGeneratedDescription = '';

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
    path: ['', Validators.required],
    label: [''],
    description: [''],
    executionPlan: ['{}', Validators.required],
    responseMapping: ['{}', Validators.required],
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
    outputShape: ['resource' as OutputShape],
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
    // Scope the source picker to this API's workspace. When a workspace is
    // defined, an endpoint may only build from those services (the executor
    // enforces the same at runtime). An empty/absent workspace shows all, so
    // APIs created before workspaces existed keep working.
    let list = [...this.sourceServices];
    if (this.workspaceServiceIds && this.workspaceServiceIds.size) {
      list = list.filter(
        service =>
          service.id != null && this.workspaceServiceIds!.has(service.id)
      );
    }

    const query = this.sourceServiceSearch.trim().toLowerCase();
    if (!query) {
      return list;
    }

    return list.filter(service => {
      const haystack =
        `${service.name} ${service.label ?? ''} ${service.type}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  /** Service ids in the selected API's workspace, or null when none defined. */
  workspaceServiceIds: Set<number> | null = null;

  loadWorkspaceServices(apiId: number | null): void {
    if (!apiId) {
      this.workspaceServiceIds = null;
      return;
    }
    this.http
      .get<
        GenericListResponse<{ serviceId?: number; service_id?: number }>
      >(`${BASE_URL}/api_builder/services`, { params: { filter: `api_id=${apiId}`, limit: 500 } })
      .subscribe({
        next: response => {
          const ids = (response.resource ?? [])
            .map(r => r.serviceId ?? r.service_id)
            .filter((v): v is number => v != null);
          this.workspaceServiceIds = ids.length ? new Set(ids) : null;
        },
        error: () => (this.workspaceServiceIds = null),
      });
  }

  get filteredSourceTables(): SourceTable[] {
    const query = this.sourceTableSearch.trim().toLowerCase();
    if (!query) {
      return [...this.sourceTables];
    }

    return this.sourceTables.filter(table => {
      const haystack = `${table.name} ${table.label ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  get recentSourceServices(): SourceService[] {
    return this.recentSourceNames
      .map(name => this.sourceServices.find(service => service.name === name))
      .filter((service): service is SourceService => !!service);
  }

  get workflowSteps(): WorkflowStep[] {
    const serviceSelected = !!this.sourceForm.value.service;
    const tableSelected = !!this.sourceForm.value.table;
    const routeReady = !!this.endpointForm.value.path;
    const hasFields = this.selectedFieldNames.length > 0;
    const hasRuleData = this.filterRules.length > 0;
    const hasOutput = !!this.sourceForm.value.outputShape;
    const hasSavedEndpoint = !!this.selectedEndpointId;

    return [
      {
        key: 'source',
        label: 'Source',
        detail:
          serviceSelected && tableSelected
            ? 'Service + table selected'
            : 'Pick service and table',
        complete: serviceSelected && tableSelected,
      },
      {
        key: 'shape',
        label: 'Shape',
        detail: hasFields
          ? `${this.selectedFieldNames.length} fields selected`
          : 'Select fields',
        complete: hasFields,
      },
      {
        key: 'rules',
        label: 'Rules',
        detail: hasRuleData
          ? `${this.filterRules.length} filters`
          : 'Optional filters',
        complete: hasRuleData,
      },
      {
        key: 'route',
        label: 'Route',
        detail: routeReady ? this.generatedRouteLabel : 'Generate route',
        complete: routeReady,
      },
      {
        key: 'output',
        label: 'Output',
        detail: hasOutput
          ? `Shape: ${this.sourceForm.value.outputShape}`
          : 'Set output options',
        complete: hasOutput,
      },
      {
        key: 'publish',
        label: 'Publish',
        detail: hasSavedEndpoint ? 'Saved endpoint selected' : 'Save endpoint',
        complete: hasSavedEndpoint,
      },
    ];
  }

  get executionStepsPreview(): StepPreview[] {
    const key = this.endpointForm.value.executionPlan ?? '';
    if (this.executionStepsCache?.key === key) {
      return this.executionStepsCache.value;
    }

    const plan = this.parseJsonObject(this.endpointForm.value.executionPlan);
    const steps: unknown[] = Array.isArray(plan?.['steps'])
      ? (plan?.['steps'] as unknown[])
      : [];

    const value = steps
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

    this.executionStepsCache = { key, value };
    return value;
  }

  get responseFieldsPreview(): string[] {
    const key = this.endpointForm.value.responseMapping ?? '';
    if (this.responseFieldsCache?.key === key) {
      return this.responseFieldsCache.value;
    }

    const mapping = this.parseJsonObject(
      this.endpointForm.value.responseMapping
    );
    const value = mapping ? Object.keys(mapping) : [];
    this.responseFieldsCache = { key, value };
    return value;
  }

  get executionPlanError(): string {
    return this.jsonValidationError(
      this.endpointForm.controls.executionPlan.errors
    );
  }

  get responseMappingError(): string {
    return this.jsonValidationError(
      this.endpointForm.controls.responseMapping.errors
    );
  }

  get hasJsonErrors(): boolean {
    return !!this.executionPlanError || !!this.responseMappingError;
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
    this.validateJsonEditors();
    this.endpointForm.controls.executionPlan.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validateJsonEditors();
        this.markPreviewStale();
      });
    this.endpointForm.controls.responseMapping.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validateJsonEditors();
        this.markPreviewStale();
      });
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
    const isTypingContext = !!target?.closest(
      'input, textarea, [contenteditable="true"], mat-select'
    );
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
      return 'api_docs';
    }
    return 'no metadata';
  }

  selectRecentSource(serviceName: string): void {
    this.chooseSourceService(serviceName);
  }

  // Autocomplete selection handlers. The "Source API" / "Table" fields are
  // type-ahead inputs: typing filters the list live, picking an option sets the
  // form control, syncs the visible label, and triggers introspection.
  chooseSourceService(serviceName: string): void {
    if (!serviceName) {
      return;
    }
    this.sourceForm.patchValue({ service: serviceName });
    this.sourceServiceSearch = this.serviceDisplay(serviceName);
    this.loadTables(serviceName);
  }

  chooseSourceTable(tableName: string): void {
    if (!tableName) {
      return;
    }
    this.sourceForm.patchValue({ table: tableName });
    this.sourceTableSearch = this.tableDisplay(tableName);
    this.loadFields(tableName);
  }

  // On focus, blank the query so the autocomplete shows the FULL list (otherwise
  // the pre-filled selected label filters it down to just that one row, which
  // reads as an empty/broken dropdown). On blur, restore the selected label so
  // an abandoned search doesn't leave a stray query in the box.
  onSourceFocus(): void {
    this.sourceServiceSearch = '';
  }

  onSourceBlur(): void {
    // Deferred so a click on an option (which fires optionSelected slightly
    // after blur) isn't clobbered by re-filtering the list out from under it.
    setTimeout(() => {
      const selected = this.sourceForm.value.service;
      this.sourceServiceSearch = selected ? this.serviceDisplay(selected) : '';
    }, 150);
  }

  onTableFocus(): void {
    this.sourceTableSearch = '';
  }

  onTableBlur(): void {
    setTimeout(() => {
      const selected = this.sourceForm.value.table;
      this.sourceTableSearch = selected ? this.tableDisplay(selected) : '';
    }, 150);
  }

  private serviceDisplay(name: string): string {
    const service = this.sourceServices.find(item => item.name === name);
    return service ? service.label || service.name : name;
  }

  private tableDisplay(name: string): string {
    const table = this.sourceTables.find(item => item.name === name);
    return table
      ? table.label || this.titleFromName(table.name)
      : this.titleFromName(name);
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
          this.rebuildEndpointCounts();
        },
        error: () => this.toast('Could not load endpoint definitions.'),
      });
  }

  loadSourceServices(): void {
    this.sourceServicesLoading = true;
    this.http
      .get<GenericListResponse<SourceService & { is_active?: boolean }>>(
        `${BASE_URL}/system/service`,
        {
          params: { fields: 'id,name,label,type,is_active', limit: 500 },
        }
      )
      .pipe(finalize(() => (this.sourceServicesLoading = false)))
      .subscribe({
        next: response => {
          const services = response.resource ?? [];
          this.sourceServices = services.filter(
            service =>
              service.name !== 'api_builder' &&
              service.name !== 'system' &&
              service.is_active !== false &&
              !this.NON_SOURCE_TYPES.has((service.type || '').toLowerCase())
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
    this.sourceIntrospectionHint = '';
    this.sourceTableSearch = '';
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
          try {
            const rawTables = Array.isArray(response?.resource)
              ? response.resource
              : [];
            const tables = rawTables.map(table => ({
              ...table,
              source: 'schema' as const,
            }));
            if (tables.length) {
              this.sourceIntrospectionHint =
                'Schema metadata loaded from native service schema.';
              this.setSourceTables(tables);
              return;
            }

            this.loadTablesFromOpenApi(serviceName);
          } catch (error) {
            console.error('Failed to process source schema table list', {
              serviceName,
              response,
              error,
            });
            this.loadTablesFromOpenApi(serviceName);
          }
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
            this.sourceIntrospectionHint =
              'Using api_docs fallback for resource discovery (native schema unavailable).';
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
      this.sourceIntrospectionHint =
        'No metadata available for this source type. Choose a source with schema or api_docs support.';
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
      this.sourceTableSearch = this.tableDisplay(defaultTable.name);
      this.loadFields(defaultTable.name);
    }
  }

  // Populates the table dropdown for an already-selected source WITHOUT the
  // selection-clearing side effects of loadTables(). Used when restoring a saved
  // endpoint so the user can still switch tables without re-picking the source.
  private populateSourceTablesQuietly(serviceName?: string | null): void {
    if (!serviceName) {
      return;
    }
    this.http
      .get<
        GenericListResponse<SourceTable>
      >(`${BASE_URL}/${serviceName}/_schema`, { params: { fields: 'name,label' } })
      .subscribe({
        next: response => {
          const raw = Array.isArray(response?.resource)
            ? response.resource
            : [];
          if (raw.length) {
            this.sourceTables = raw.map(table => ({
              ...table,
              source: 'schema' as const,
            }));
          }
        },
        error: () => {
          /* dropdown stays as-is; not fatal */
        },
      });
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
          try {
            const rawFields = Array.isArray(response?.field)
              ? response.field
              : [];
            this.sourceFields = rawFields.map(field => ({
              ...field,
              label: field.label || this.titleFromName(field.name),
            }));
            this.sourceRelationships = this.mapRelatedToRelationships(
              Array.isArray(response?.related) ? response.related : []
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
          } catch (error) {
            console.error('Failed to process source fields response', {
              serviceName,
              tableName,
              response,
              error,
            });
            this.loadFieldsFromOpenApi(tableName);
          }
        },
        error: () => this.loadFieldsFromOpenApi(tableName),
      });
  }

  isFieldSelected(fieldName: string): boolean {
    return this.selectedFields.has(fieldName);
  }

  aliasFor(sourceName: string): string {
    return this.fieldAliases[sourceName] ?? '';
  }

  setAlias(sourceName: string, alias: string): void {
    const trimmed = alias.trim();
    if (trimmed) {
      this.fieldAliases[sourceName] = trimmed;
    } else {
      delete this.fieldAliases[sourceName];
    }
    this.generateEndpointFromSource();
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

    // When the field changes, its valid operator set may change too (e.g.
    // numeric -> text drops ">", "<"). Reset to "=" if the current operator
    // is no longer offered so the Match dropdown never renders blank.
    if (key === 'field') {
      const allowed = this.filterOperatorOptions(filter.field);
      if (!allowed.some(option => option.value === filter.operator)) {
        filter.operator = '=';
      }
    }

    this.generateEndpointFromSource();
  }

  trackByFilterIndex(index: number): number {
    return index;
  }

  // trackBy functions keep *ngFor from tearing down and rebuilding every child
  // view on each change-detection pass. The editor binds several getters that
  // allocate a new array on every call; without trackBy, Angular destroys and
  // recreates the animated Material rows each cycle, which reschedules animation
  // tasks and spins change detection forever (tab freeze on "Create API").
  trackByStepKey(_index: number, step: { key: string }): string {
    return step.key;
  }

  trackByName(_index: number, item: { name: string }): string {
    return item.name;
  }

  trackById(_index: number, item: { id: number | string }): number | string {
    return item.id;
  }

  trackByTitle(_index: number, item: { title: string }): string {
    return item.title;
  }

  trackByOptionValue(_index: number, option: { value: unknown }): unknown {
    return option.value;
  }

  trackByValue(_index: number, value: string): string {
    return value;
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
    const outputKey = this.resolveOutputKey(table);
    const description = `Returns selected fields from ${service}.${table}.`;

    // Output rename map for the selected fields/relationships only. Emitted on
    // the step; the backend applies it as a key-remap on the fetched rows.
    const aliases: Record<string, string> = {};
    for (const name of [
      ...this.selectedFieldNames,
      ...this.selectedRelationships,
    ]) {
      const alias = this.fieldAliases[name];
      if (alias && alias !== name) {
        aliases[name] = alias;
      }
    }

    const step: Record<string, unknown> = {
      id: stepId,
      type: 'service_request',
      service,
      method: 'GET',
      resource,
      params,
    };
    if (Object.keys(aliases).length) {
      step['aliases'] = aliases;
    }

    // The execution plan + response mapping are the functional contract — they
    // must always track the current source/fields/filters. The identity fields
    // (path/label/description) are user-facing and are only refreshed while the
    // user hasn't customized them (still empty or still equal to our last
    // auto-generated value).
    const current = this.endpointForm.value;
    const patch: Record<string, unknown> = {
      apiId: this.selectedApiId,
      method: 'GET',
      executionPlan: JSON.stringify(
        {
          steps: [step],
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
    };

    if (!current.path || current.path === this.lastGeneratedPath) {
      patch['path'] = path;
      this.lastGeneratedPath = path;
    }
    if (!current.label || current.label === this.lastGeneratedLabel) {
      patch['label'] = label;
      this.lastGeneratedLabel = label;
    }
    if (
      !current.description ||
      current.description === this.lastGeneratedDescription
    ) {
      patch['description'] = description;
      this.lastGeneratedDescription = description;
    }

    this.endpointForm.patchValue(patch);
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
            this.resolveOutputKey(this.sourceForm.value.table ?? ''),
            !!this.sourceForm.value.includeId
          ),
          executionPlan,
          responseMapping,
        },
        // Backend reads snake_case and defaults dry_run=true (which only echoes
        // the plan); send dry_run:false so the preview actually runs the query.
        path_params: this.sourceForm.value.includeId ? { id: 1 } : {},
        query: {},
        dry_run: false,
        trace: true,
      })
      .pipe(finalize(() => (this.previewing = false)))
      .subscribe({
        next: (result: any) => {
          this.previewTrace = result?.trace ?? [];
          this.previewOk = result?.ok ?? null;
          this.previewResult = JSON.stringify(
            result?.result ?? result,
            null,
            2
          );
          this.previewStale = false;
        },
        error: error => {
          const env = error?.error ?? error;
          this.previewTrace = env?.trace ?? [];
          this.previewOk = false;
          this.previewResult = JSON.stringify(env?.error ?? env, null, 2);
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
          this.resolveOutputKey(this.sourceForm.value.table ?? ''),
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
        this.toast(
          createAnother
            ? 'Endpoint saved. Ready for next endpoint.'
            : 'Endpoint saved.'
        );
        this.endpoints = [
          endpoint,
          ...this.endpoints.filter(existing => existing.id !== endpoint.id),
        ];
        this.rebuildEndpointCounts();

        if (createAnother) {
          this.resetEndpointEditor();
          this.addingEndpoint = true;
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
        endpoint_id: this.testForm.value.endpointId,
        path_params: pathParams,
        query,
        dry_run: false,
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
    this.loadWorkspaceServices(id);
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
    // Start with all endpoints collapsed (Swagger-style) — the user clicks an
    // endpoint row to expand and edit it.
    this.selectedEndpointId = null;
    this.addingEndpoint = false;
  }

  selectEndpoint(id: number): void {
    this.selectedEndpointId = id;
    this.addingEndpoint = false;
    // A saved endpoint's path/label/description are user content — clear the
    // generated-value trackers so later regeneration treats them as customized
    // and never overwrites them.
    this.lastGeneratedPath = '';
    this.lastGeneratedLabel = '';
    this.lastGeneratedDescription = '';
    const endpoint = this.endpoints.find(item => item.id === id);
    if (endpoint) {
      try {
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

        const execution = (endpoint.executionPlan ??
          endpoint.execution_plan) as { steps?: any[] } | undefined;
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
        const [sortField = '', rawDirection = 'ASC'] = order.split(/\s+/, 2);
        const sortDirection =
          (rawDirection || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const limit = Number(params['limit'] ?? 25);

        const aliases = (step?.aliases ?? {}) as Record<string, unknown>;

        // Restore the output wrapper shape from the saved response mapping's
        // top-level key so reopening the endpoint doesn't silently switch it.
        const respMap = (endpoint.responseMapping ??
          endpoint.response_mapping ??
          {}) as Record<string, unknown>;
        const outKey = Object.keys(respMap)[0] ?? 'resource';
        const outputShape: OutputShape =
          outKey === 'data'
            ? 'data'
            : outKey === this.safeStepId(table)
              ? 'table'
              : 'resource';

        if (service && table) {
          this.pendingSelectedFieldNames = fields.length ? fields : null;
          this.selectedRelationships = new Set(related);
          this.fieldAliases = Object.fromEntries(
            Object.entries(aliases)
              .filter(([, v]) => typeof v === 'string' && v)
              .map(([k, v]) => [k, String(v)])
          );
          this.sourceForm.patchValue({
            service,
            table,
            includeId,
            sortField,
            sortDirection,
            limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
            outputShape,
          });
          this.sourceServiceSearch = this.serviceDisplay(service);
          this.sourceTableSearch = this.tableDisplay(table);
          this.filterRules = this.parseFilters(String(params['filter'] ?? ''));
          this.sourceIntrospectionHint = '';
          // Re-introspect the saved endpoint's source so the Fields and
          // Relationships sections render with the saved selections checked.
          // (pendingSelectedFieldNames + selectedRelationships were set above.)
          this.loadFields(table);
          this.populateSourceTablesQuietly(service);
        }
      } catch (error: any) {
        console.error('Failed to load endpoint into builder', {
          endpointId: id,
          error,
          endpoint,
        });
        this.toast(
          `Could not load endpoint ${id} into the builder. ${error?.message ?? ''}`
        );
        this.newEndpoint();
        return;
      }
    }
    this.testForm.patchValue({ endpointId: id });
  }

  newApi(): void {
    this.editorOpen = true;
    this.selectedApiId = null;
    this.workspaceServiceIds = null;
    this.apiForm.reset({
      name: '',
      basePath: '',
      label: '',
      description: '',
      status: 'draft',
    });
    this.resetEndpointEditor();
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.selectedApiId = null;
    this.selectedEndpointId = null;
    this.addingEndpoint = false;
    this.testResult = '';
  }

  private rebuildEndpointCounts(): void {
    const counts = new Map<number, number>();
    for (const endpoint of this.endpoints) {
      const apiId = endpoint.apiId ?? endpoint.api_id;
      if (typeof apiId === 'number') {
        counts.set(apiId, (counts.get(apiId) ?? 0) + 1);
      }
    }
    this.endpointCounts = counts;
  }

  newEndpoint(): void {
    if (!this.selectedApiId) {
      this.toast('Save the API first, then add endpoints to it.');
      return;
    }

    this.resetEndpointEditor();
  }

  // Accordion controls for the endpoint list. Adding opens a blank editor panel
  // (the "new endpoint" draft); toggling an existing row loads it for editing or
  // collapses it if it is already open.
  addEndpoint(): void {
    if (!this.selectedApiId) {
      this.toast('Save the API first, then add endpoints to it.');
      return;
    }
    this.resetEndpointEditor();
    this.addingEndpoint = true;
  }

  cancelAddEndpoint(): void {
    this.addingEndpoint = false;
    this.resetEndpointEditor();
  }

  toggleEndpoint(endpoint: EndpointDefinition): void {
    if (this.selectedEndpointId === endpoint.id && !this.addingEndpoint) {
      this.selectedEndpointId = null;
      return;
    }
    this.addingEndpoint = false;
    this.selectEndpoint(endpoint.id);
  }

  // Clears the endpoint editor to a blank slate. Called when starting a brand
  // new API (before any API id exists) and when adding another endpoint, so a
  // fresh editor never shows leftover sample/inspector data.
  private resetEndpointEditor(): void {
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
    this.previewTrace = [];
    this.previewOk = null;
    this.previewStale = false;

    this.selectedFields.clear();
    this.selectedRelationships.clear();
    this.fieldAliases = {};
    this.filterRules = [];
    this.sourceTables = [];
    this.sourceFields = [];
    this.sourceRelationships = [];
    this.sourceServiceSearch = '';
    this.sourceTableSearch = '';
    this.lastGeneratedPath = '';
    this.lastGeneratedLabel = '';
    this.lastGeneratedDescription = '';
    this.sourceForm.patchValue({
      service: '',
      table: '',
      includeId: false,
      sortField: '',
      sortDirection: 'ASC',
      limit: 25,
      outputShape: 'resource',
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

  focusWorkflowStep(step: WorkflowStepKey): void {
    const targetId = `workflow-${step}`;
    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  deleteEndpoint(id: number, event?: Event): void {
    event?.stopPropagation();
    const endpoint = this.endpoints.find(item => item.id === id);
    const label = endpoint
      ? `${endpoint.method} ${endpoint.path}`
      : `endpoint ${id}`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }

    this.saving = true;
    this.http
      .delete(`${BASE_URL}/api_builder/endpoints/${id}`)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.endpoints = this.endpoints.filter(item => item.id !== id);
          this.rebuildEndpointCounts();
          this.toast('Endpoint deleted.');
          if (this.selectedEndpointId === id) {
            this.newEndpoint();
          }
        },
        error: (error: any) =>
          this.toast(
            `Could not delete endpoint. ${this.describeHttpError(error)}`
          ),
      });
  }

  deleteApi(id: number, event?: Event): void {
    event?.stopPropagation();
    const api = this.apis.find(item => item.id === id);
    const label = api ? api.label || api.name : `API ${id}`;
    if (
      !window.confirm(
        `Delete "${label}" and all of its endpoints? This cannot be undone.`
      )
    ) {
      return;
    }

    this.loading = true;
    this.http
      .delete(`${BASE_URL}/api_builder/apis/${id}`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.apis = this.apis.filter(item => item.id !== id);
          this.endpoints = this.endpoints.filter(
            endpoint => (endpoint.apiId ?? endpoint.api_id) !== id
          );
          this.rebuildEndpointCounts();
          this.toast('API deleted.');
          if (this.selectedApiId === id) {
            this.closeEditor();
          }
        },
        error: (error: any) =>
          this.toast(`Could not delete API. ${this.describeHttpError(error)}`),
      });
  }

  private validateJsonEditors(): void {
    this.applyJsonControlValidation(
      this.endpointForm.controls.executionPlan,
      'Execution plan'
    );
    this.applyJsonControlValidation(
      this.endpointForm.controls.responseMapping,
      'Response mapping'
    );
  }

  private applyJsonControlValidation(
    control: {
      value: string | null;
      errors: Record<string, any> | null;
      setErrors: (errors: Record<string, any> | null) => void;
    },
    label: string
  ): void {
    const value = control.value ?? '';
    const nextErrors: Record<string, any> = {
      ...(control.errors ?? {}),
    };
    delete nextErrors['jsonInvalid'];

    if (!value.trim()) {
      nextErrors['required'] = true;
    } else {
      delete nextErrors['required'];
      try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          nextErrors['jsonInvalid'] = `${label} must be a JSON object.`;
        }
      } catch (error: any) {
        nextErrors['jsonInvalid'] =
          `${label} JSON is invalid: ${error?.message ?? 'Parse error.'}`;
      }
    }

    control.setErrors(Object.keys(nextErrors).length ? nextErrors : null);
  }

  private jsonValidationError(
    errors: Record<string, any> | null | undefined
  ): string {
    if (!errors) {
      return '';
    }
    if (typeof errors['jsonInvalid'] === 'string') {
      return errors['jsonInvalid'];
    }
    if (errors['required']) {
      return 'JSON is required.';
    }
    return '';
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

  // Top-level key the records are wrapped in. "resource" is DreamFactory's
  // standard envelope (and the default); "data" and the table name are options.
  private resolveOutputKey(tableName: string): string {
    switch (this.sourceForm.value.outputShape) {
      case 'table':
        return this.safeStepId(tableName || 'data');
      case 'data':
        return 'data';
      default:
        return 'resource';
    }
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
