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
import { MatInputModule } from '@angular/material/input';
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

/** How a single `{token}` in an operation path is resolved into a real value. */
type TokenKind = 'table' | 'field' | 'proc' | 'func' | 'text';

/** One `{token}` placeholder parsed out of an operation's path. `labelKey` is an
 *  i18n key for the enumerable kinds; a free-text token carries `null` and falls
 *  back to its (humanized) name. */
interface PathToken {
  token: string;
  kind: TokenKind;
  labelKey: string | null;
}

/** A left-nav group: a resource/tag and the operations under it. */
interface DocGroup {
  tag: string;
  operations: DocOperation[];
}

/** One piece of the request line: either a literal path chunk (`token` null)
 *  or a `{token}` placeholder rendered as an inline picker. */
interface PathSegment {
  text: string;
  token: PathToken | null;
}

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
    MatInputModule,
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

  // Path-token pickers (FB12): every `{token}` an operation's path presents gets
  // a control so the call can be made concrete. Enumerable tokens (table / field
  // / procedure / function names) become dropdowns backed by live introspection;
  // anything else stays an editable text input. `pathTokens` is the ordered set
  // parsed from the op path, `tokenValues` the chosen substitution per token, and
  // `tokenOptions` the resolved dropdown choices per token.
  pathTokens: PathToken[] = [];
  tokenValues: Record<string, string> = {};
  tokenOptions: Record<string, string[]> = {};
  // Real columns (name + type) of the selected table, driving both the filter
  // builder field list, the prefilled sample body, AND the `{field_name}` picker.
  tableColumns: Array<{ name: string; type: string }> = [];
  // Guards async schema introspection against cascade races: a newer table pick
  // must win over an in-flight response for the previously selected one.
  private tableSeq = 0;

  // Three-column model.
  loading = true;
  groups: DocGroup[] = [];
  selectedOp: DocOperation | null = null;

  // Request builder (right column), computed once per selected operation so the
  // *ngFor lists never re-allocate on every change-detection pass (the getter-
  // in-*ngFor CD-loop trap): the request line split into inline segments, and
  // the operation's parameters partitioned into the addable list (query/header,
  // section 2) vs the path params shown in the tamed reference.
  pathSegments: PathSegment[] = [];
  addableParams: DocParameter[] = [];
  pathParams: DocParameter[] = [];

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
    this.subscriptions.push(
      this.activatedRoute.data.subscribe(({ data }) => {
        // Read the current service on EVERY navigation, not once: Angular
        // reuses this component across /api-docs/:name changes, so a snapshot
        // read in ngOnInit went stale and the token pickers kept introspecting
        // the previously-loaded service's tables/fields/procs.
        this.serviceName = this.activatedRoute.snapshot.params['name'];
        this.resolveServiceId();
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

  // Resolve the current service's id for the api-key loader. Runs on every
  // navigation so a service switch re-scopes the keys too.
  private resolveServiceId(): void {
    if (!this.serviceName) {
      return;
    }
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
    // A new operation resets the filter, the token pickers, and the introspected
    // columns. Then re-hydrate for the new op.
    this.currentFilter = '';
    this.tableFields = [];
    this.tableColumns = [];
    this.pathTokens = this.parsePathTokens(op.path);
    this.tokenValues = {};
    this.tokenOptions = {};
    // Precompute the request-line segments + the parameter partition (stable for
    // the life of the selected op; values live in tokenValues / df-try-it).
    this.pathSegments = this.buildPathSegments(op);
    this.addableParams = op.parameters.filter(p => this.isAddableParam(p));
    this.pathParams = op.parameters.filter(p => !this.isAddableParam(p));
    if (this.pathTokens.length) {
      // Templated path — resolve every `{token}` into its picker.
      this.pathTokens.forEach(t => this.resolveToken(t));
    } else {
      // Concrete `/_table/<name>` — introspect its columns for the filter
      // builder + sample body.
      const table = this.tableFromPath(op.path);
      if (table) {
        this.loadTableSchema(table);
      }
    }
  }

  // ---- path tokens (FB12) --------------------------------------------------

  /** Parse `{token}` placeholders out of a path, in order, de-duplicated. */
  private parsePathTokens(path: string): PathToken[] {
    const out: PathToken[] = [];
    const seen = new Set<string>();
    const re = /\{([^}]+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(path)) !== null) {
      const token = m[1];
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      out.push({
        token,
        kind: this.tokenKind(token),
        labelKey: this.tokenLabelKey(token),
      });
    }
    return out;
  }

  /** Split the op path into literal chunks and `{token}` placeholders so the
   *  request line can render each token as an inline picker (fill-in-the-blank)
   *  instead of a separate list of dropdowns above the path. */
  private buildPathSegments(op: DocOperation): PathSegment[] {
    const segs: PathSegment[] = [];
    const re = /\{([^}]+)\}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(op.path)) !== null) {
      if (m.index > last) {
        segs.push({ text: op.path.slice(last, m.index), token: null });
      }
      const token =
        this.pathTokens.find(t => t.token === m![1]) ??
        ({ token: m[1], kind: 'text', labelKey: null } as PathToken);
      segs.push({ text: '', token });
      last = re.lastIndex;
    }
    if (last < op.path.length) {
      segs.push({ text: op.path.slice(last), token: null });
    }
    return segs;
  }

  private tokenKind(token: string): TokenKind {
    switch (token) {
      case 'table_name':
        return 'table';
      case 'field_name':
        return 'field';
      case 'procedure_name':
        return 'proc';
      case 'function_name':
        return 'func';
      default:
        return 'text';
    }
  }

  private tokenLabelKey(token: string): string | null {
    switch (this.tokenKind(token)) {
      case 'table':
        return 'apiDocs.token.table';
      case 'field':
        return 'apiDocs.token.field';
      case 'proc':
        return 'apiDocs.token.procedure';
      case 'func':
        return 'apiDocs.token.function';
      default:
        return null;
    }
  }

  /** True for tokens backed by a dropdown of real values (vs a text input). */
  isEnumerableToken(t: PathToken): boolean {
    return t.kind !== 'text';
  }

  /**
   * Whether this token renders as a picker rather than a text box.
   *
   * A `{table_name}` / `{procedure_name}` / `{function_name}` token is only
   * enumerable if something came back to enumerate. The lookup can legitimately
   * return nothing - a service with no stored procedures - and it can fail
   * outright (RBAC on the listing endpoint, a backend the service cannot
   * reach); loadTableOptions/loadResourceOptions swallow that into an empty
   * list. A <select> with no options and a disabled placeholder leaves the
   * operation unrunnable with nothing to type into, so an empty list falls back
   * to free text.
   *
   * `undefined` means the request is still in flight: keep the picker so the
   * control does not flip from input to select underneath the user.
   */
  usePicker(t: PathToken): boolean {
    if (!this.isEnumerableToken(t)) {
      return false;
    }
    const options = this.tokenOptions[t.token];
    return options === undefined || options.length > 0;
  }

  /** A human label for a free-text token: its name with spaces for underscores.
   *  Bound as data, not a hardcoded UI string. */
  humanizeToken(token: string): string {
    return token.replace(/_/g, ' ');
  }

  /** Kick off the resolver for a token when the operation is selected. Field
   *  tokens wait for a table to be chosen (the cascade), unless the path already
   *  carries a concrete table. */
  private resolveToken(t: PathToken): void {
    switch (t.kind) {
      case 'table':
        this.loadTableOptions(t);
        break;
      case 'proc':
        this.loadResourceOptions('_proc', t);
        break;
      case 'func':
        this.loadResourceOptions('_func', t);
        break;
      case 'field': {
        const table = this.tableFromPath(this.effectivePath);
        if (table) {
          this.loadTableSchema(table);
        }
        break;
      }
      default:
        break;
    }
  }

  /** Show the token-picker block whenever the selected op carries a placeholder. */
  get showTokenPickers(): boolean {
    return !!this.selectedOp && this.pathTokens.length > 0;
  }

  /** True while any enumerable token has no chosen value: the effective path is
   *  not yet concrete, so surface the hint. */
  get hasUnresolvedToken(): boolean {
    return this.pathTokens.some(
      t => this.isEnumerableToken(t) && !this.tokenValues[t.token]
    );
  }

  /** The path actually run: every `{token}` replaced by its chosen value.
   *  Unset tokens keep their `{token}` placeholder. */
  get effectivePath(): string {
    const op = this.selectedOp;
    if (!op) {
      return '';
    }
    let path = op.path;
    this.pathTokens.forEach(t => {
      const value = this.tokenValues[t.token];
      if (value) {
        path = path.replace(`{${t.token}}`, value);
      }
    });
    return path;
  }

  /** True when a `?filter=` actually shapes the (effective) response: a table
   *  collection GET. Gates the filter builder in the console. */
  get showFilterBuilder(): boolean {
    const op = this.selectedOp;
    return !!op && op.method === 'GET' && /_table\//.test(this.effectivePath);
  }

  onTokenSelected(t: PathToken, value: string): void {
    this.tokenValues[t.token] = value;
    if (t.kind === 'table') {
      // Cascade: a new table resets the filter, the introspected columns, and
      // any dependent `{field_name}` token, then refreshes them for the pick.
      this.currentFilter = '';
      this.tableFields = [];
      this.tableColumns = [];
      const fieldTok = this.pathTokens.find(x => x.kind === 'field');
      if (fieldTok) {
        this.tokenValues[fieldTok.token] = '';
        this.tokenOptions[fieldTok.token] = [];
      }
      this.loadTableSchema(value);
    }
  }

  /** Pull the table name out of a `/_table/<name>` path. Braced OpenAPI
   *  placeholders (`{table_name}`) are rejected, so those fall back to the
   *  builder's free-text field input rather than a bad schema fetch. */
  private tableFromPath(path: string): string | null {
    const m = path.match(/_table\/([^/{}]+)(?:\/|$)/);
    return m ? m[1] : null;
  }

  /** List the service's real tables so a `{table_name}` token becomes a picker.
   *  Silent on failure. */
  private loadTableOptions(t: PathToken): void {
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
        .subscribe(names => (this.tokenOptions[t.token] = names))
    );
  }

  /** List a service's stored procedures / functions (`_proc` / `_func`) so those
   *  tokens become pickers. A service with none silently yields an empty list.
   *  The endpoint may return bare name strings or `{name}` objects; handle both. */
  private loadResourceOptions(resource: '_proc' | '_func', t: PathToken): void {
    if (!this.serviceName) {
      return;
    }
    this.subscriptions.push(
      this.http
        .get<{ resource?: Array<string | { name?: string }> }>(
          `${BASE_URL}/${this.serviceName}/${resource}`,
          { context: toastOff() }
        )
        .pipe(
          map(res =>
            (res.resource ?? [])
              .map(r => (typeof r === 'string' ? r : r?.name))
              .filter((n): n is string => !!n)
          ),
          catchError(() => of([] as string[]))
        )
        .subscribe(names => (this.tokenOptions[t.token] = names))
    );
  }

  /** Introspect one table's schema. Feeds the filter builder + sample body
   *  columns AND, when the path carries a `{field_name}` token, that token's
   *  dropdown (the cascade). Sequence-guarded so a superseded pick never wins.
   *  Silent on failure. */
  private loadTableSchema(table: string): void {
    if (!this.serviceName) {
      return;
    }
    const seq = ++this.tableSeq;
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
          if (seq !== this.tableSeq) {
            return;
          }
          this.tableColumns = fields.map(f => ({
            name: f.name,
            type: f.type ?? '',
          }));
          this.tableFields = this.tableColumns.map(c => c.name);
          const fieldTok = this.pathTokens.find(x => x.kind === 'field');
          if (fieldTok) {
            this.tokenOptions[fieldTok.token] = this.tableFields;
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

  private paramLocation(p: DocParameter): 'query' | 'header' {
    return p.location === 'header' ? 'header' : 'query';
  }

  /** Is this parameter already a row in the console's request? Drives the
   *  always-visible add/remove toggle in the compact parameter list. */
  isParamAdded(p: DocParameter): boolean {
    return this.tryIt?.isInjected(p.name, this.paramLocation(p)) ?? false;
  }

  /** One obvious control per parameter row: add it to the call, or (if already
   *  added) pull it back out. Values are then filled in the console's Params /
   *  Headers tab. */
  toggleParam(p: DocParameter): void {
    if (!this.isAddableParam(p)) {
      return;
    }
    const location = this.paramLocation(p);
    if (this.tryIt?.isInjected(p.name, location)) {
      this.tryIt.removeInjected(p.name, location);
    } else {
      this.tryIt?.injectParam(p.name, location);
    }
  }

  /** True when the tamed reference disclosure has anything to show (long prose,
   *  path params, request-body schema, or response codes). */
  get hasReference(): boolean {
    const op = this.selectedOp;
    return (
      !!op &&
      (!!op.description ||
        !!op.requestBodySchema ||
        op.responses.length > 0 ||
        this.pathParams.length > 0)
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

  // ---- right column: base URL ---------------------------------------------
  // The curl / Python / JS / MCP export moved into df-try-it, which generates
  // its snippets from the ACTUAL composed request (path + added params +
  // identity) rather than a re-derived one. This component only supplies the
  // service base URL the console builds on.

  get serviceBaseUrl(): string {
    return `${BASE_URL}/${this.serviceName ?? ''}`;
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
  trackBySegment = (i: number): number => i;
  trackByToken = (_: number, t: PathToken): string => t.token;
  trackByOption = (_: number, option: string): string => option;
  trackByGroup = (_: number, group: DocGroup): string => group.tag;
  trackByOperation = (_: number, op: DocOperation): string => op.id;
  trackByParam = (_: number, p: DocParameter): string =>
    `${p.location}:${p.name}`;
  trackByResponse = (_: number, r: DocResponse): string => r.code;
}
