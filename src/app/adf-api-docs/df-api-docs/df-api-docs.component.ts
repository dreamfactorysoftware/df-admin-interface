import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import SwaggerUI from 'swagger-ui';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@ngneat/transloco';
import { saveRawAsFile } from 'src/app/shared/utilities/file';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import {
  SESSION_TOKEN_HEADER,
  API_KEY_HEADER,
} from 'src/app/shared/constants/http-headers';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ApiKeysService } from '../services/api-keys.service';
import { ApiKeyInfo } from 'src/app/shared/types/api-keys';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DfCurrentServiceService } from 'src/app/shared/services/df-current-service.service';
import {
  tap,
  switchMap,
  map,
  distinctUntilChanged,
  catchError,
} from 'rxjs/operators';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { toastOff } from 'src/app/shared/utilities/http-contexts';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { Subscription, of } from 'rxjs';
import { ApiDocJson } from 'src/app/shared/types/files';
import { healthCheckEndpointsInfo } from '../constants/health-check-endpoints';

import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfPageHeaderComponent } from 'src/app/shared/components/df-page-header/df-page-header.component';
import {
  DfTryItComponent,
  TryItMethod,
  TryItResult,
} from 'src/app/shared/components/df-try-it/df-try-it.component';
import { DfFilterBuilderComponent } from 'src/app/shared/components/df-filter-builder/df-filter-builder.component';

interface ServiceResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

/** One documented operation, flattened out of the OpenAPI paths map. */
interface DocOperation {
  id: string;
  method: TryItMethod;
  path: string;
  operationId: string;
  summary: string;
  description: string;
  tag: string;
  parameters: DocParameter[];
  requestBodySchema: string | null;
  responses: DocResponse[];
}

interface DocParameter {
  name: string;
  location: string;
  required: boolean;
  type: string;
  description: string;
}

interface DocResponse {
  code: string;
  description: string;
}

/** A left-nav group: a resource/tag and the operations under it. */
interface DocGroup {
  tag: string;
  operations: DocOperation[];
}

type SnippetLang = 'js' | 'python' | 'curl' | 'mcp';
type HealthStatus = 'loading' | 'healthy' | 'unhealthy' | 'warning';

const KNOWN_METHODS: TryItMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-api-docs',
  templateUrl: './df-api-docs.component.html',
  styleUrls: ['./df-api-docs.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonToggleModule,
    MatListModule,
    MatTooltipModule,
    MatSlideToggleModule,
    TranslocoModule,
    FormsModule,
    NgIf,
    NgFor,
    NgClass,
    DfBadgeComponent,
    DfSkeletonComponent,
    DfEmptyStateComponent,
    DfPageHeaderComponent,
    DfTryItComponent,
    DfFilterBuilderComponent,
  ],
})
export class DfApiDocsComponent implements OnInit, OnDestroy {
  // Swagger container only exists once the raw-spec panel is opened.
  @ViewChild('apiDocumentation') apiDocElement: ElementRef | undefined;

  // Live console handle: lets a metadata click (a parameter/filter) push a row
  // straight into the test call below.
  @ViewChild(DfTryItComponent) tryIt?: DfTryItComponent;

  apiDocJson: ApiDocJson;
  apiKeys: ApiKeyInfo[] = [];

  // Table picker (spec FB6.9): when an operation targets `/_table/{table_name}`
  // there is no real table to call, so we introspect the service's tables and
  // let the user pick one. Selecting rewrites the path to a concrete table.
  tableNames: string[] = [];
  selectedTable: string | null = null;
  // Real columns (name + type) of the effective table, driving both the filter
  // builder field list and the prefilled sample body.
  tableColumns: Array<{ name: string; type: string }> = [];

  // Three-column model.
  loading = true;
  groups: DocGroup[] = [];
  selectedOp: DocOperation | null = null;

  // Right column.
  snippetLang: SnippetLang = 'curl';
  selectedApiKey: string | null = null;

  // Filter builder (spec 3.5): compiled ?filter= string + the current table's
  // columns (when the selected op is a table GET the schema is introspectable).
  currentFilter = '';
  tableFields: string[] = [];

  // Raw-spec (advanced) demotion.
  showAdvanced = false;
  private swaggerRendered = false;
  expandSchema = false;

  private subscriptions: Subscription[] = [];
  healthStatus: HealthStatus = 'loading';
  healthError: string | null = null;
  serviceName: string | null = null;
  showUnhealthyErrorDetails = false;

  private rawHttp: HttpClient;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userDataService: DfUserDataService,
    private apiKeysService: ApiKeysService,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private currentServiceService: DfCurrentServiceService,
    private http: HttpClient,
    private httpBackend: HttpBackend
  ) {
    this.rawHttp = new HttpClient(httpBackend);
  }

  ngOnInit(): void {
    this.serviceName = this.activatedRoute.snapshot.params['name'];

    if (this.serviceName) {
      this.subscriptions.push(
        this.http
          .get<ServiceResponse>(
            `${BASE_URL}/system/service?filter=name=${this.serviceName}`
          )
          .pipe(
            map(response => response?.resource?.[0]?.id || -1),
            tap(id => {
              if (id !== -1) {
                this.currentServiceService.setCurrentServiceId(id);
              }
            })
          )
          .subscribe()
      );
    }

    this.subscriptions.push(
      this.activatedRoute.data.subscribe(({ data }) => {
        if (data) {
          this.apiDocJson = data;
          this.buildOperations();
          this.checkApiHealth();
        }
      })
    );

    this.subscriptions.push(
      this.currentServiceService
        .getCurrentServiceId()
        .pipe(
          distinctUntilChanged(),
          switchMap(serviceId =>
            this.apiKeysService.getApiKeysForService(serviceId)
          )
        )
        .subscribe(keys => {
          // Do NOT pre-select a key: the console defaults to the session
          // identity so a call returns data out of the box.
          this.apiKeys = keys;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ---- spec -> operations -------------------------------------------------

  private buildOperations(): void {
    this.loading = true;
    const groupMap = new Map<string, DocOperation[]>();
    const paths = this.apiDocJson?.paths ?? {};

    Object.keys(paths).forEach(path => {
      const methods = paths[path] ?? {};
      Object.keys(methods).forEach(rawMethod => {
        const method = rawMethod.toUpperCase() as TryItMethod;
        if (!KNOWN_METHODS.includes(method)) {
          return;
        }
        const op = methods[rawMethod];
        const tag = op?.tags?.[0] || this.serviceName || 'default';
        const operation: DocOperation = {
          id: `${method} ${path}`,
          method,
          path,
          operationId: op?.operationId || '',
          summary: op?.summary || '',
          description: op?.description || '',
          tag,
          parameters: this.buildParameters(op?.['parameters']),
          requestBodySchema: this.buildRequestBody(op?.['requestBody']),
          responses: this.buildResponses(op?.['responses']),
        };
        const bucket = groupMap.get(tag) ?? [];
        bucket.push(operation);
        groupMap.set(tag, bucket);
      });
    });

    this.groups = [...groupMap.entries()]
      .map(([tag, operations]) => ({
        tag,
        operations: operations.sort(
          (a, b) =>
            a.path.localeCompare(b.path) ||
            KNOWN_METHODS.indexOf(a.method) - KNOWN_METHODS.indexOf(b.method)
        ),
      }))
      .sort((a, b) => a.tag.localeCompare(b.tag));

    const first = this.groups[0]?.operations[0] ?? null;
    if (first) {
      this.selectOperation(first);
    } else {
      this.selectedOp = null;
    }
    this.loading = false;
  }

  private buildParameters(params: any[] | undefined): DocParameter[] {
    if (!Array.isArray(params)) {
      return [];
    }
    return params.map(p => ({
      name: p?.name || '',
      location: p?.in || '',
      required: !!p?.required,
      type: p?.schema?.type || p?.type || p?.schema?.items?.type || '',
      description: p?.description || '',
    }));
  }

  private buildRequestBody(requestBody: any): string | null {
    const schema = requestBody?.content?.['application/json']?.schema;
    if (!schema) {
      return null;
    }
    try {
      return JSON.stringify(schema, null, 2);
    } catch {
      return null;
    }
  }

  private buildResponses(responses: any): DocResponse[] {
    if (!responses || typeof responses !== 'object') {
      return [];
    }
    return Object.keys(responses).map(code => ({
      code,
      description: responses[code]?.description || '',
    }));
  }

  get hasOperations(): boolean {
    return this.groups.length > 0;
  }

  selectOperation(op: DocOperation): void {
    this.selectedOp = op;
    // A new operation resets the filter, the picked table, and the introspected
    // columns. Then re-hydrate for the new op.
    this.currentFilter = '';
    this.tableFields = [];
    this.tableColumns = [];
    this.tableNames = [];
    this.selectedTable = null;
    if (this.pathHasTableTemplate(op.path)) {
      // `/_table/{table_name}` — offer the service's real tables to pick from.
      this.loadTableNames();
    } else {
      // Concrete `/_table/<name>` — introspect its columns directly.
      this.introspectTable(op.path);
    }
  }

  /** True when the op path carries the `{table_name}` placeholder and therefore
   *  cannot be called until a real table is chosen. */
  private pathHasTableTemplate(path: string): boolean {
    return /_table\/\{table_name\}/.test(path);
  }

  /** Show the table dropdown for placeholder `/_table/{table_name}` ops. */
  get showTablePicker(): boolean {
    return (
      !!this.serviceName &&
      !!this.selectedOp &&
      this.pathHasTableTemplate(this.selectedOp.path)
    );
  }

  /** The path actually run: the placeholder resolved to the picked table when
   *  there is one, otherwise the op's own path. */
  get effectivePath(): string {
    const op = this.selectedOp;
    if (!op) {
      return '';
    }
    if (this.selectedTable && this.pathHasTableTemplate(op.path)) {
      return op.path.replace('{table_name}', this.selectedTable);
    }
    return op.path;
  }

  /** True when a `?filter=` actually shapes the (effective) response: a table
   *  collection GET. Gates the filter builder in the console. */
  get showFilterBuilder(): boolean {
    const op = this.selectedOp;
    return !!op && op.method === 'GET' && /_table\//.test(this.effectivePath);
  }

  onTableSelected(name: string): void {
    this.selectedTable = name;
    this.currentFilter = '';
    this.tableFields = [];
    this.tableColumns = [];
    this.introspectTable(this.effectivePath);
  }

  /** Pull the table name out of a `/_table/<name>` path. Braced OpenAPI
   *  placeholders (`{table_name}`) are rejected, so those fall back to the
   *  builder's free-text field input rather than a bad schema fetch. */
  private tableFromPath(path: string): string | null {
    const m = path.match(/_table\/([^/{}]+)(?:\/|$)/);
    return m ? m[1] : null;
  }

  private get effectiveTable(): string | null {
    return this.tableFromPath(this.effectivePath);
  }

  /** List the service's real tables so a `{table_name}` op becomes callable.
   *  Silent on failure. */
  private loadTableNames(): void {
    if (!this.serviceName) {
      return;
    }
    this.subscriptions.push(
      this.http
        .get<{ resource?: Array<{ name: string }> }>(
          `${BASE_URL}/${this.serviceName}/_table`,
          { params: { fields: 'name' }, context: toastOff() }
        )
        .pipe(
          map(res => (res.resource ?? []).map(r => r.name).filter(Boolean)),
          catchError(() => of([] as string[]))
        )
        .subscribe(names => (this.tableNames = names))
    );
  }

  /** Best-effort schema introspection so the field slot lists real columns AND
   *  the sample body can be prefilled with them. Silent on failure. */
  private introspectTable(path: string): void {
    if (!this.serviceName) {
      return;
    }
    const table = this.tableFromPath(path);
    if (!table) {
      return;
    }
    this.subscriptions.push(
      this.http
        .get<{ field?: Array<{ name: string; type?: string }> }>(
          `${BASE_URL}/${this.serviceName}/_schema/${table}`,
          { params: { fields: 'name,type' }, context: toastOff() }
        )
        .pipe(
          map(res => res.field ?? []),
          catchError(() => of([] as Array<{ name: string; type?: string }>))
        )
        .subscribe(fields => {
          if (this.effectiveTable === table) {
            this.tableColumns = fields.map(f => ({
              name: f.name,
              type: f.type ?? '',
            }));
            this.tableFields = this.tableColumns.map(c => c.name);
          }
        })
    );
  }

  onFilterChange(filter: string): void {
    this.currentFilter = filter;
  }

  // ---- sample request body (FB6.6) ----------------------------------------

  private methodTakesBody(method: string): boolean {
    return method === 'POST' || method === 'PUT' || method === 'PATCH';
  }

  /** A prefilled, helpful request body for write operations. Real table columns
   *  win (wrapped in the DreamFactory `{resource:[...]}` envelope); otherwise
   *  the operation's own request-body schema is sampled. Undefined = no body,
   *  so the console leaves its editor untouched. */
  get sampleBody(): string | undefined {
    const op = this.selectedOp;
    if (!op || !this.methodTakesBody(op.method)) {
      return undefined;
    }
    if (this.tableColumns.length) {
      const row: Record<string, unknown> = {};
      this.tableColumns
        .filter(c => !/^id$/i.test(c.name))
        .slice(0, 10)
        .forEach(c => (row[c.name] = this.sampleForType(c.type)));
      return JSON.stringify({ resource: [row] }, null, 2);
    }
    return this.sampleFromSchemaJson(op.requestBodySchema);
  }

  /** Map a DreamFactory/OpenAPI type to a representative placeholder value. */
  private sampleForType(type: string): unknown {
    switch ((type || '').toLowerCase()) {
      case 'integer':
      case 'int':
      case 'id':
      case 'reference':
        return 0;
      case 'number':
      case 'float':
      case 'double':
      case 'decimal':
        return 0;
      case 'boolean':
      case 'bool':
        return false;
      case 'timestamp':
      case 'datetime':
      case 'datetime_on_create':
      case 'datetime_on_update':
        return '2025-01-01T00:00:00Z';
      case 'date':
        return '2025-01-01';
      case 'time':
        return '00:00:00';
      default:
        return 'string';
    }
  }

  private sampleFromSchemaJson(schemaStr: string | null): string | undefined {
    if (!schemaStr) {
      return undefined;
    }
    try {
      const sample = this.sampleFromSchema(JSON.parse(schemaStr), 0);
      if (sample === undefined) {
        return undefined;
      }
      const text = JSON.stringify(sample, null, 2);
      return text === '{}' || text === '[]' ? undefined : text;
    } catch {
      return undefined;
    }
  }

  private sampleFromSchema(schema: any, depth: number): unknown {
    if (!schema || depth > 6) {
      return undefined;
    }
    if (schema.example !== undefined) {
      return schema.example;
    }
    if (schema.default !== undefined) {
      return schema.default;
    }
    if (schema.type === 'object' || schema.properties) {
      const out: Record<string, unknown> = {};
      const props = schema.properties ?? {};
      Object.keys(props).forEach(k => {
        const value = this.sampleFromSchema(props[k], depth + 1);
        if (value !== undefined) {
          out[k] = value;
        }
      });
      return out;
    }
    if (schema.type === 'array' || schema.items) {
      const item = this.sampleFromSchema(schema.items, depth + 1);
      return item === undefined ? [] : [item];
    }
    return this.sampleForType(schema.type);
  }

  // ---- metadata -> test call (FB6.8) --------------------------------------

  /** Only query/header params meaningfully add to the request builder; path
   *  params are resolved by the table picker / path field. */
  isAddableParam(p: DocParameter): boolean {
    return p.location === 'query' || p.location === 'header';
  }

  /** Click a parameter in the metadata table to drop it into the live console,
   *  ready for a value. */
  addParamToTest(p: DocParameter): void {
    if (!this.isAddableParam(p)) {
      return;
    }
    this.tryIt?.injectParam(
      p.name,
      p.location === 'header' ? 'header' : 'query'
    );
  }

  isSelected(op: DocOperation): boolean {
    return this.selectedOp?.id === op.id;
  }

  /** Method -> category tint class (punch item 22: GET=data, POST=security,
   *  PUT=system, PATCH=docs, DELETE=danger). Class only, no literals. */
  methodClass(method: string): string {
    return `m-${(method || '').toLowerCase()}`;
  }

  // ---- right column: live snippets ----------------------------------------

  get serviceBaseUrl(): string {
    return `${BASE_URL}/${this.serviceName ?? ''}`;
  }

  private get fullUrl(): string {
    const path = this.effectivePath;
    const base = `${window.location.origin}${this.serviceBaseUrl}${path}`;
    if (this.currentFilter) {
      return `${base}?filter=${encodeURIComponent(this.currentFilter)}`;
    }
    return base;
  }

  private get mcpUrl(): string {
    return `${window.location.origin}${this.serviceBaseUrl}/_mcp`;
  }

  private get authHeaderName(): string {
    return this.selectedApiKey ? API_KEY_HEADER : SESSION_TOKEN_HEADER;
  }

  private get authHeaderValue(): string {
    if (this.selectedApiKey) {
      return this.selectedApiKey;
    }
    return this.userDataService.token || 'YOUR_SESSION_TOKEN';
  }

  get snippet(): string {
    if (!this.selectedOp) {
      return '';
    }
    switch (this.snippetLang) {
      case 'js':
        return this.jsSnippet();
      case 'python':
        return this.pythonSnippet();
      case 'mcp':
        return this.mcpSnippet();
      default:
        return this.curlSnippet();
    }
  }

  private curlSnippet(): string {
    const method = this.selectedOp!.method;
    return [
      `curl -X ${method} '${this.fullUrl}'`,
      `  -H 'Accept: application/json'`,
      `  -H '${this.authHeaderName}: ${this.authHeaderValue}'`,
    ].join(' \\\n');
  }

  private jsSnippet(): string {
    const method = this.selectedOp!.method;
    return [
      `const resp = await fetch('${this.fullUrl}', {`,
      `  method: '${method}',`,
      `  headers: {`,
      `    'Accept': 'application/json',`,
      `    '${this.authHeaderName}': '${this.authHeaderValue}',`,
      `  },`,
      `});`,
      `console.log(resp.status, await resp.json());`,
    ].join('\n');
  }

  private pythonSnippet(): string {
    const method = this.selectedOp!.method.toLowerCase();
    return [
      `import requests`,
      ``,
      `resp = requests.${method}(`,
      `    '${this.fullUrl}',`,
      `    headers={`,
      `        'Accept': 'application/json',`,
      `        '${this.authHeaderName}': '${this.authHeaderValue}',`,
      `    },`,
      `)`,
      `print(resp.status_code, resp.json())`,
    ].join('\n');
  }

  /** MCP client config: point any MCP-aware client at this service's gateway
   *  endpoint with the live key. Positioning no competitor ships. */
  private mcpSnippet(): string {
    const key = this.selectedApiKey || 'YOUR_API_KEY';
    const name = `dreamfactory-${this.serviceName ?? 'service'}`;
    const config = {
      mcpServers: {
        [name]: {
          url: this.mcpUrl,
          headers: {
            [API_KEY_HEADER]: key,
          },
        },
      },
    };
    return JSON.stringify(config, null, 2);
  }

  copySnippet(): void {
    this.clipboard.copy(this.snippet);
  }

  // ---- df-try-it host log --------------------------------------------------

  onTryItSent(_result: TryItResult): void {
    // Placeholder for a future "Recent Requests" tab (spec 3.5). Kept as a
    // typed sink so the console's `sent` output is bound and observable.
  }

  // ---- health -------------------------------------------------------------

  get healthVariant(): 'neutral' | 'success' | 'warning' | 'danger' {
    switch (this.healthStatus) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  private checkApiHealth(): void {
    const endpointsInfoToValidate =
      healthCheckEndpointsInfo[this.apiDocJson.info.group];
    if (this.serviceName && endpointsInfoToValidate) {
      this.performHealthCheck(endpointsInfoToValidate[0].endpoint);
    } else {
      this.setHealthState('warning');
    }
  }

  private setHealthState(
    status: 'healthy' | 'unhealthy' | 'warning',
    error: string | null = null
  ): void {
    this.healthStatus = status;
    this.healthError = error;
  }

  private performHealthCheck(endpoint: string): void {
    this.healthStatus = 'loading';
    this.healthError = null;

    this.subscriptions.push(
      this.http
        .get(`${BASE_URL}/${this.serviceName}${endpoint}`, {
          responseType: 'text',
          context: toastOff(),
        })
        .pipe(
          tap(() => this.setHealthState('healthy')),
          catchError((error: unknown) => {
            this.setHealthState(
              'unhealthy',
              `${endpoint}: ${normalizeError(error).message}`
            );
            return of(null);
          })
        )
        .subscribe()
    );
  }

  toggleUnhealthyErrorDetails(): void {
    this.showUnhealthyErrorDetails = !this.showUnhealthyErrorDetails;
  }

  // ---- nav + top actions ---------------------------------------------------

  goBackToList(): void {
    this.currentServiceService.clearCurrentServiceId();
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  downloadApiDoc(): void {
    saveRawAsFile(
      JSON.stringify(this.apiDocJson, undefined, 2),
      'api-spec.json',
      'json'
    );
  }

  copyApiKey(key: string): void {
    this.clipboard.copy(key);
    this.snackBar.open('API Key copied to clipboard', 'Close', {
      duration: 2000,
    });
  }

  // ---- raw spec (demoted swagger) -----------------------------------------

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
    if (this.showAdvanced && !this.swaggerRendered) {
      // Wait for the *ngIf container to enter the DOM, then render once.
      setTimeout(() => this.renderSwagger());
    }
  }

  reloadApiDocs(): void {
    if (!this.serviceName) {
      return;
    }
    const params = this.expandSchema ? '?expand_schema=true' : '';
    const headers = new HttpHeaders({
      'X-DreamFactory-API-Key': environment.dfApiDocsApiKey,
      'X-DreamFactory-Session-Token': this.userDataService.token || '',
    });
    this.rawHttp
      .get<any>(`${BASE_URL}/api_docs/${this.serviceName}${params}`, {
        headers,
      })
      .subscribe(data => {
        if (data) {
          this.apiDocJson = data;
          this.buildOperations();
        }
        this.swaggerRendered = false;
        if (this.showAdvanced) {
          setTimeout(() => this.renderSwagger());
        }
      });
  }

  private renderSwagger(): void {
    if (!this.apiDocElement?.nativeElement) {
      return;
    }
    this.swaggerRendered = true;
    SwaggerUI({
      spec: this.apiDocJson,
      domNode: this.apiDocElement.nativeElement,
      requestInterceptor: (req: SwaggerUI.Request) => {
        req['headers'][SESSION_TOKEN_HEADER] = this.userDataService.token;
        req['headers'][API_KEY_HEADER] = environment.dfApiDocsApiKey;
        const url = new URL(req['url']);
        const urlParams = new URLSearchParams(url.search);
        urlParams.forEach((value, key) => {
          urlParams.set(key, decodeURIComponent(value));
        });
        url.search = urlParams.toString();
        req['url'] = url.toString();
        return req;
      },
      showMutatedRequest: true,
    });
  }

  trackByApiKey = (_: number, key: ApiKeyInfo): string => key.apiKey;
  trackByTable = (_: number, name: string): string => name;
  trackByGroup = (_: number, group: DocGroup): string => group.tag;
  trackByOperation = (_: number, op: DocOperation): string => op.id;
  trackByParam = (_: number, p: DocParameter): string =>
    `${p.location}:${p.name}`;
  trackByResponse = (_: number, r: DocResponse): string => r.code;
}
