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
import { NgIf, NgFor, NgClass, SlicePipe } from '@angular/common';
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
    SlicePipe,
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

  apiDocJson: ApiDocJson;
  apiKeys: ApiKeyInfo[] = [];

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
          this.apiKeys = keys;
          if (!this.selectedApiKey && keys.length) {
            this.selectedApiKey = keys[0].apiKey;
          }
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
    // A new operation means a fresh filter and, when it targets a real table,
    // fresh column options for the visual builder.
    this.currentFilter = '';
    this.tableFields = [];
    this.loadTableFields(op);
  }

  /** True when the selected op is a table-collection GET, i.e. a `?filter=`
   *  actually shapes the response. Gates the filter builder in the console. */
  get showFilterBuilder(): boolean {
    const op = this.selectedOp;
    return !!op && op.method === 'GET' && /_table\//.test(op.path);
  }

  /** Pull the table name out of a `/_table/<name>` path. Braced OpenAPI
   *  placeholders (`{table_name}`) are rejected, so those fall back to the
   *  builder's free-text field input rather than a bad schema fetch. */
  private tableFromPath(path: string): string | null {
    const m = path.match(/_table\/([^/{}]+)(?:\/|$)/);
    return m ? m[1] : null;
  }

  /** Best-effort schema introspection so the field slot lists real columns.
   *  Silent on failure: the builder still works with a free-text field. */
  private loadTableFields(op: DocOperation): void {
    if (!this.serviceName || op.method !== 'GET') {
      return;
    }
    const table = this.tableFromPath(op.path);
    if (!table) {
      return;
    }
    this.subscriptions.push(
      this.http
        .get<{ field?: Array<{ name: string }> }>(
          `${BASE_URL}/${this.serviceName}/_schema/${table}`,
          { params: { fields: 'name' }, context: toastOff() }
        )
        .pipe(
          map(res => (res.field ?? []).map(f => f.name)),
          catchError(() => of([] as string[]))
        )
        .subscribe(names => {
          if (this.selectedOp === op) {
            this.tableFields = names;
          }
        })
    );
  }

  onFilterChange(filter: string): void {
    this.currentFilter = filter;
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
    const path = this.selectedOp?.path ?? '';
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
  trackByGroup = (_: number, group: DocGroup): string => group.tag;
  trackByOperation = (_: number, op: DocOperation): string => op.id;
  trackByParam = (_: number, p: DocParameter): string =>
    `${p.location}:${p.name}`;
  trackByResponse = (_: number, r: DocResponse): string => r.code;
}
