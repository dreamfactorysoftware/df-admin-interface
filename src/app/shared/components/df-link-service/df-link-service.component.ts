import {
  Component,
  Inject,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DfBaseCrudService } from '../../services/df-base-crud.service';
import { DfSystemService } from 'src/app/shared/services/df-system.service';
import {
  APP_SERVICE_TOKEN,
  BASE_SERVICE_TOKEN,
  CACHE_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import {
  catchError,
  EMPTY,
  expand,
  map,
  of,
  reduce,
  switchMap,
  throwError,
} from 'rxjs';
import { readAsText } from '../../utilities/file';
import { Service, ServiceType } from '../../types/service';

interface RepoItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-link-service',
  templateUrl: './df-link-service.component.html',
  styleUrls: ['./df-link-service.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTooltipModule,
    FontAwesomeModule,
    MatExpansionModule,
    TranslocoPipe,
    AsyncPipe,
    MatOptionModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  providers: [DfBaseCrudService],
})
export class DfLinkServiceComponent implements OnInit, OnChanges {
  @Input() cache: string;
  @Input() cacheScope: 'event' | 'service' = 'event';
  @Input({ required: true }) storageServiceId!: string;

  @Input({ required: true }) storagePath: FormControl;
  @Input({ required: true }) content: FormControl;
  @Input() storageServiceIdControl?: FormControl;
  @Input() scmRepositoryControl?: FormControl;
  @Input() scmReferenceControl?: FormControl;
  roleForm: FormGroup;
  apiKeyControl = new FormControl('');
  storageServices: Array<Service> = [];
  selectType = false;

  repositories: string[] = [];
  filteredRepositories: string[] = [];
  loadingRepos = false;
  repoFetchTruncated = false;
  selectedService: Service | null = null;
  private repoDefaultBranches = new Map<string, string>();

  private readonly repoPerPage = 100;
  private readonly repoMaxPages = 20;
  private readonly skipErrorHeader = [{ key: 'skip-error', value: 'true' }];

  currentPath = '';
  pathItems: RepoItem[] = [];
  loadingItems = false;
  explorerError: string | null = null;

  generatingKey = false;
  generateKeyError: string | null = null;

  constructor(
    private themeService: DfThemeService,
    private systemService: DfSystemService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    @Inject(BASE_SERVICE_TOKEN) private baseService: DfBaseCrudService,
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService,
    @Inject(APP_SERVICE_TOKEN) private appService: DfBaseCrudService
  ) {
    this.roleForm = new FormGroup({
      serviceList: new FormControl(''),
      repoInput: new FormControl(''),
      branchInput: new FormControl('main'),
      pathInput: new FormControl(''),
    });
    this.baseService
      .getAll<{
        serviceTypes: Array<ServiceType>;
        services: Array<Service>;
      }>({
        additionalParams: [
          {
            key: 'group',
            value: 'source control,file',
          },
        ],
      })
      .subscribe(res => {
        this.storageServices = res.services;
        this.findServiceById();
        this.prefillFromSavedConfig();
      });
  }
  isDarkMode = this.themeService.darkMode$;
  ngOnInit() {
    this.roleForm.get('serviceList')?.valueChanges.subscribe(label => {
      this.onServiceChange(label);
    });
    this.roleForm.get('repoInput')?.valueChanges.subscribe(value => {
      this.updateRepoFilter(value);
      this.resetExplorer();
      if (this.repositories.includes(value)) {
        const defaultBranch = this.repoDefaultBranches.get(value);
        if (defaultBranch) {
          const branchControl = this.roleForm.get('branchInput');
          if (branchControl && branchControl.value !== defaultBranch) {
            branchControl.setValue(defaultBranch, { emitEvent: false });
          }
        }
        this.loadPath('');
      }
    });
    this.roleForm.get('branchInput')?.valueChanges.subscribe(() => {
      this.resetExplorer();
      if (this.roleForm.get('repoInput')?.value) this.loadPath('');
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['storageServiceId']) {
      this.findServiceById();
    }
  }

  findServiceById() {
    const hasGithubService = this.storageServices.some(
      service => service.type === 'github'
    );
    this.selectType = hasGithubService;
  }

  private prefillFromSavedConfig() {
    if (this.selectedService) return;
    const savedId = this.storageServiceIdControl?.value;
    if (!savedId) return;
    const service = this.storageServices.find(s => s.id === savedId);
    if (!service) return;

    this.selectedService = service;

    const savedRepo = this.scmRepositoryControl?.value ?? '';
    const savedBranch = this.scmReferenceControl?.value ?? 'main';
    const savedPath = this.storagePath?.value ?? '';

    this.roleForm.patchValue(
      {
        serviceList: service.label,
        repoInput: savedRepo,
        branchInput: savedBranch,
        pathInput: savedPath,
      },
      { emitEvent: false }
    );

    if (service.type === 'github' && savedRepo) {
      this.loadRepositories();
      const parentPath = savedPath.includes('/')
        ? savedPath.substring(0, savedPath.lastIndexOf('/'))
        : '';
      this.loadPath(parentPath);
    }
  }

  get isGithubSelected(): boolean {
    return this.selectedService?.type === 'github';
  }

  private onServiceChange(label: string) {
    this.selectedService =
      this.storageServices.find(s => s.label === label) ?? null;
    this.resetExplorer();
    this.roleForm.patchValue(
      { repoInput: '', pathInput: '' },
      { emitEvent: false }
    );
    this.repositories = [];
    if (this.selectedService?.type === 'github') {
      this.loadRepositories();
    }
  }

  private loadRepositories() {
    if (!this.selectedService) return;
    const name = this.selectedService.name;
    this.loadingRepos = true;
    this.repoFetchTruncated = false;
    this.repoDefaultBranches.clear();

    const fetchPage = (page: number) =>
      this.baseService.get<any>(`${name}/_repo`, {
        additionalParams: [
          { key: 'page', value: page },
          { key: 'per_page', value: this.repoPerPage },
        ],
        additionalHeaders: this.skipErrorHeader,
        snackbarError: '',
      });

    const parseRepos = (
      res: any
    ): Array<{ name: string; defaultBranch?: string }> => {
      const resources = Array.isArray(res)
        ? res
        : Array.isArray(res?.resource)
          ? res.resource
          : [];
      return resources
        .map((r: any) => {
          if (typeof r === 'string') return { name: r };
          const repoName = r?.name;
          if (!repoName) return null;
          const defaultBranch =
            r?.default_branch ?? r?.defaultBranch ?? undefined;
          return { name: repoName, defaultBranch };
        })
        .filter((r: any): r is { name: string; defaultBranch?: string } => !!r);
    };

    let currentPage = 1;
    fetchPage(currentPage)
      .pipe(
        expand(res => {
          const parsed = parseRepos(res);
          const reachedCap = currentPage >= this.repoMaxPages;
          if (parsed.length === this.repoPerPage && !reachedCap) {
            currentPage += 1;
            return fetchPage(currentPage);
          }
          if (parsed.length === this.repoPerPage && reachedCap) {
            this.repoFetchTruncated = true;
          }
          return EMPTY;
        }),
        reduce(
          (acc: Array<{ name: string; defaultBranch?: string }>, res: any) =>
            acc.concat(parseRepos(res)),
          []
        )
      )
      .subscribe({
        next: all => {
          const seen = new Set<string>();
          const names: string[] = [];
          for (const r of all) {
            if (seen.has(r.name)) continue;
            seen.add(r.name);
            names.push(r.name);
            if (r.defaultBranch) {
              this.repoDefaultBranches.set(r.name, r.defaultBranch);
            }
          }
          this.repositories = names.sort((a, b) => a.localeCompare(b));
          this.updateRepoFilter(this.roleForm.get('repoInput')?.value ?? '');
          this.loadingRepos = false;
        },
        error: () => {
          this.loadingRepos = false;
        },
      });
  }

  private updateRepoFilter(value: string) {
    const query = (value ?? '').toString().toLowerCase();
    this.filteredRepositories = query
      ? this.repositories.filter(r => r.toLowerCase().includes(query))
      : this.repositories.slice();
  }

  private resetExplorer() {
    this.currentPath = '';
    this.pathItems = [];
    this.explorerError = null;
  }

  private loadPath(path: string, attemptedFallback = false) {
    if (!this.selectedService || !this.isGithubSelected) return;
    const repo = this.roleForm.get('repoInput')?.value;
    const branch = this.roleForm.get('branchInput')?.value || 'main';
    if (!repo) return;
    const serviceName = this.selectedService.name;
    this.loadingItems = true;
    this.explorerError = null;
    const params = [
      { key: 'branch', value: branch },
      { key: 'path', value: path },
    ];
    this.baseService
      .get<any>(`${serviceName}/_repo/${repo}`, {
        additionalParams: params,
        additionalHeaders: this.skipErrorHeader,
        snackbarError: '',
      })
      .subscribe({
        next: res => {
          const resources = Array.isArray(res?.resource)
            ? res.resource
            : Array.isArray(res)
              ? res
              : [];
          this.pathItems = resources
            .map((r: any) => ({
              name: r?.name ?? '',
              path: r?.path ?? (path ? `${path}/${r?.name}` : r?.name),
              type: r?.type ?? 'file',
            }))
            .filter((i: RepoItem) => i.name)
            .sort((a: RepoItem, b: RepoItem) => {
              if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
              return a.name.localeCompare(b.name);
            });
          this.currentPath = path;
          this.loadingItems = false;
        },
        error: err => {
          const message: string =
            err?.error?.error?.message ?? err?.message ?? '';
          const looksLikeMissingRef =
            /no commit found/i.test(message) ||
            err?.status === 404 ||
            err?.status === 422;
          if (
            !attemptedFallback &&
            looksLikeMissingRef &&
            (branch === 'main' || branch === 'master')
          ) {
            const fallback = branch === 'main' ? 'master' : 'main';
            this.roleForm
              .get('branchInput')
              ?.setValue(fallback, { emitEvent: false });
            this.loadPath(path, true);
            return;
          }
          this.loadingItems = false;
          this.explorerError = message || 'Unable to load repository contents.';
        },
      });
  }

  onItemClick(item: RepoItem) {
    if (item.type === 'dir') {
      this.loadPath(item.path);
      return;
    }
    this.roleForm.patchValue({ pathInput: item.path }, { emitEvent: false });

    const repo = this.roleForm.get('repoInput')?.value ?? '';
    const branch = this.roleForm.get('branchInput')?.value ?? '';

    // Set storageServiceId BEFORE storagePath; df-script-editor has a
    // valueChanges subscription on storageServiceId that resets storagePath.
    // Using emitEvent:false to silence that side effect here.
    if (this.storageServiceIdControl) {
      this.storageServiceIdControl.setValue(this.selectedService?.id ?? null, {
        emitEvent: false,
      });
    }
    if (this.scmRepositoryControl) {
      this.scmRepositoryControl.setValue(repo);
    }
    if (this.scmReferenceControl) {
      this.scmReferenceControl.setValue(branch);
    }
    if (this.storagePath) {
      this.storagePath.setValue(item.path);
    }

    this.onViewLatest();
  }

  navigateToCrumb(index: number) {
    if (index < 0) {
      this.loadPath('');
      return;
    }
    const segments = this.currentPath.split('/').filter(Boolean);
    const target = segments.slice(0, index + 1).join('/');
    this.loadPath(target);
  }

  get pathSegments(): string[] {
    return this.currentPath.split('/').filter(Boolean);
  }

  onViewLatest() {
    const formValues = this.roleForm.getRawValue();
    const serviceName =
      this.selectedService?.name ?? formValues.serviceList ?? '';
    const repo = formValues.repoInput ?? '';
    const branch = formValues.branchInput ?? 'main';
    const path = formValues.pathInput ?? '';

    if (!serviceName || !repo || !path) return;

    const filePath = `${serviceName}/_repo/${repo}?branch=${branch}&content=1&path=${path}`;

    if (filePath.endsWith('.json')) {
      this.baseService
        .downloadJson(filePath)
        .subscribe(text => this.content.setValue(text));
      return;
    } else {
      this.baseService
        .downloadFile(filePath)
        .pipe(switchMap(res => readAsText(res as Blob)))
        .subscribe(text => this.content.setValue(text));
    }
  }

  onDeleteCache() {
    if (!this.cache) return;
    const key =
      this.cacheScope === 'service' ? this.cache : `_event/${this.cache}`;
    this.cacheService
      .delete(key, {
        snackbarSuccess: 'scripts.deleteCacheSuccessMsg',
      })
      .subscribe();
  }

  get showWebhookSection(): boolean {
    if (!this.cache) return false;
    if (this.storageServiceIdControl?.value) return true;
    const pathValue =
      this.storagePath?.value || this.roleForm.get('pathInput')?.value;
    return !!pathValue;
  }

  get webhookUrl(): string {
    if (!this.cache) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const key = this.apiKeyControl.value || '<API_KEY>';
    const cachePath =
      this.cacheScope === 'event' ? `_event/${this.cache}` : this.cache;
    return `${origin}/api/v2/system/cache/${cachePath}?method=DELETE&api_key=${encodeURIComponent(
      key
    )}`;
  }

  copyWebhookUrl(): void {
    if (!this.webhookUrl) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(this.webhookUrl).catch(() => {
        /* ignore clipboard errors */
      });
    }
  }

  get canGenerateKey(): boolean {
    return !!this.cache && !this.generatingKey;
  }

  get hasGeneratedKey(): boolean {
    return !!this.apiKeyControl.value;
  }

  private readonly sharedRoleName = 'dreamfactory_webhook_cache_role';
  private readonly sharedAppName = 'dreamfactory_webhook_cache_app';

  generateWebhookKey(): void {
    this.generatingKey = true;
    this.generateKeyError = null;

    this.ensureSharedRoleId()
      .pipe(
        switchMap(roleId =>
          this.fetchExistingSharedApp().pipe(
            switchMap(existing => {
              if (!existing) {
                return this.createSharedApp(roleId);
              }
              if (existing.roleId !== roleId || !existing.apiKey) {
                return this.repairSharedApp(existing.id, roleId);
              }
              return of(existing.apiKey);
            })
          )
        )
      )
      .subscribe({
        next: apiKey => {
          this.apiKeyControl.setValue(apiKey);
          this.generatingKey = false;
        },
        error: err => {
          this.generatingKey = false;
          this.generateKeyError = this.extractError(
            err,
            'Could not get webhook key.'
          );
        },
      });
  }

  private fetchExistingSharedApp() {
    return this.appService
      .getAll<any>({
        filter: `name="${this.sharedAppName}"`,
        fields: 'id,api_key,role_id',
        limit: 1,
      })
      .pipe(
        map((res: any) => {
          const app = res?.resource?.[0];
          if (!app) return null;
          return {
            id: app.id as number,
            apiKey: (app.apiKey ?? app.api_key) as string | undefined,
            roleId: (app.roleId ?? app.role_id) as number | null,
          };
        }),
        catchError(() => of(null))
      );
  }

  private createSharedApp(roleId: number) {
    const appPayload = {
      resource: [
        {
          name: this.sharedAppName,
          description:
            'Shared auto-generated app used by GitHub webhooks to invalidate service caches.',
          type: '0',
          role_id: roleId,
          is_active: true,
          url: null,
          storage_service_id: null,
          storage_container: null,
          path: null,
        },
      ],
    };
    return this.systemService
      .post('app?fields=*&related=role_by_role_id', appPayload)
      .pipe(
        map((appResp: any) => {
          const app = appResp?.resource?.[0];
          const key = app?.apiKey ?? app?.api_key;
          if (!key) {
            throw new Error('App response missing apiKey.');
          }
          return key as string;
        })
      );
  }

  private repairSharedApp(appId: number, roleId: number) {
    return this.appService
      .patch<any, any>(
        appId,
        { role_id: roleId, is_active: true },
        {
          additionalParams: [{ key: 'fields', value: '*' }],
          snackbarError: '',
        }
      )
      .pipe(
        map((resp: any) => {
          const app = resp?.resource?.[0] ?? resp;
          const key = app?.apiKey ?? app?.api_key;
          if (!key) {
            throw new Error('Repair response missing apiKey.');
          }
          return key as string;
        })
      );
  }

  private ensureSharedRoleId() {
    return this.roleService
      .getAll<any>({
        filter: `name="${this.sharedRoleName}"`,
        fields: 'id',
        limit: 1,
      })
      .pipe(
        switchMap((res: any) => {
          const existing = res?.resource?.[0]?.id;
          if (existing) return of(existing as number);
          return this.getSystemServiceId().pipe(
            switchMap(systemServiceId => {
              const rolePayload = {
                resource: [
                  {
                    name: this.sharedRoleName,
                    description:
                      'Shared role for GitHub webhook cache invalidation. Scoped to DELETE on system/cache/*.',
                    is_active: true,
                    role_service_access_by_role_id: [
                      {
                        service_id: systemServiceId,
                        component: 'cache/*',
                        verb_mask: 16,
                        requestor_mask: 3,
                        filters: [],
                        filter_op: 'AND',
                      },
                    ],
                    user_to_app_to_role_by_role_id: [],
                  },
                ],
              };
              return this.systemService.post('role', rolePayload).pipe(
                map((resp: any) => {
                  const id = resp?.resource?.[0]?.id;
                  if (!id) {
                    throw new Error('Role response missing id.');
                  }
                  return id as number;
                })
              );
            })
          );
        })
      );
  }

  private getSystemServiceId() {
    return this.systemService
      .get(
        `service?filter=${encodeURIComponent('name="system"')}&fields=id&limit=1`
      )
      .pipe(
        map((res: any) => {
          const id = res?.resource?.[0]?.id;
          if (typeof id !== 'number') {
            throw new Error('Could not resolve system service id.');
          }
          return id;
        })
      );
  }

  private extractError(err: any, fallback: string): string {
    return (
      err?.error?.error?.message ??
      err?.error?.message ??
      err?.message ??
      fallback
    );
  }
}
