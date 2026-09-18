import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, forkJoin, interval, of, switchMap, takeUntil } from 'rxjs';
import { ConfigSchema } from 'src/app/shared/types/service';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { DfMcpApiService, McpRole } from '../df-mcp-api.service';
import { DfMcpExposureComponent } from '../df-mcp-exposure/df-mcp-exposure.component';
import {
  CONNECT_CLIENTS,
  ConnectClient,
  McpBackend,
  accessRowsForChanges,
  connectSnippet,
} from '../mcp-model';

/**
 * df-mcp-create — the short stepper for a new `mcp` service:
 * name → attach APIs → who can connect → client settings → review (the
 * server page in preview mode) → connect snippet, waiting for the first call.
 *
 * Owns its own form (built from the type's config schema) and its own POST,
 * so df-service-details only has to render it when type === 'mcp'.
 */
@Component({
  selector: 'df-mcp-create',
  standalone: true,
  templateUrl: './df-mcp-create.component.html',
  styleUrls: ['./df-mcp-create.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    MatStepperModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    DfMcpExposureComponent,
  ],
})
export class DfMcpCreateComponent implements OnInit, OnDestroy {
  /** Config schema for type `mcp`, camelCased by the host. */
  @Input() configSchema: ConfigSchema[] = [];

  form: FormGroup;
  config: FormGroup;
  disabledTools = new Set<string>();
  backends: McpBackend[] = [];
  roles: McpRole[] = [];
  grantRoleIds = new Set<number>();
  loading = true;
  creating = false;
  error = '';
  createdId: number | null = null;
  firstCall = false;
  client: ConnectClient = 'claude';
  readonly clients = CONNECT_CLIENTS;
  copied = false;

  private destroy$ = new Subject<void>();
  private stopPoll$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private api: DfMcpApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      label: [''],
      description: [''],
    });
    this.config = this.fb.group({});
  }

  ngOnInit(): void {
    const names = new Set(this.configSchema.map(c => c.name));
    const add = (name: string, value: unknown) => {
      if (names.has(name) || name === 'exposedServices') {
        this.config.addControl(name, new FormControl(value));
      }
    };
    add('exposedServices', []);
    add('lazyMode', 'auto');
    add('toolStyle', 'merged');
    add('allowApiKeyAuth', false);
    add('requireRoleAccess', true);
    add('allowWrites', true);

    const exposed = this.configSchema.find(c => c.name === 'exposedServices');
    const attachable = Array.isArray(exposed?.values)
      ? (exposed?.values as Array<{ name: string }>).map(v => v.name)
      : null;
    forkJoin({
      backends: this.api.attachableBackends(attachable),
      roles: this.api.roles(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.backends = r.backends;
        this.roles = r.roles.filter(x => x.isActive !== false);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.stopPoll$.next();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get name(): string {
    return (this.form.get('name')?.value ?? '') as string;
  }

  get exposed(): string[] {
    return (this.config.get('exposedServices')?.value ?? []) as string[];
  }

  get previewRoles(): McpRole[] {
    return this.roles.filter(r => this.grantRoleIds.has(r.id));
  }

  ctl(name: string): FormControl {
    return this.config.get(name) as FormControl;
  }

  has(name: string): boolean {
    return !!this.config.get(name);
  }

  isExposed(b: McpBackend): boolean {
    return this.exposed.includes(b.name);
  }

  toggleBackend(b: McpBackend): void {
    const cur = this.exposed;
    this.ctl('exposedServices').setValue(
      cur.includes(b.name) ? cur.filter(n => n !== b.name) : [...cur, b.name]
    );
  }

  toggleRole(id: number): void {
    if (this.grantRoleIds.has(id)) this.grantRoleIds.delete(id);
    else this.grantRoleIds.add(id);
    // new Set reference so the preview picks the change up
    this.grantRoleIds = new Set(this.grantRoleIds);
  }

  get endpointUrl(): string {
    return this.api.endpointUrl(this.name);
  }

  get snippet(): string {
    return connectSnippet(this.client, {
      name: this.name,
      url: this.endpointUrl,
    });
  }

  copySnippet(): void {
    navigator.clipboard?.writeText(this.snippet).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    });
  }

  create(): void {
    if (this.form.invalid || this.creating) return;
    this.creating = true;
    this.error = '';
    const payload = {
      name: this.name,
      label: this.form.get('label')?.value || this.name,
      description: this.form.get('description')?.value || '',
      type: 'mcp',
      isActive: true,
      config: {
        ...this.config.getRawValue(),
        disabledTools: [],
        customTools: [],
      },
    };
    this.api
      .createService(payload)
      .pipe(
        switchMap(id => {
          this.createdId = id;
          const grants = this.previewRoles.map(role =>
            this.api.patchRoleAccess(
              role.id,
              accessRowsForChanges(
                [{ serviceId: id, label: '', before: 'none', after: 'read' }],
                role.rows
              )
            )
          );
          return grants.length ? forkJoin(grants) : of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.creating = false;
          this.pollFirstCall();
        },
        error: err => {
          this.creating = false;
          this.error = normalizeError(err).message;
        },
      });
  }

  private pollFirstCall(): void {
    const id = this.createdId;
    if (id == null) return;
    interval(5000)
      .pipe(
        switchMap(() => this.api.usage(id, '7d')),
        takeUntil(this.stopPoll$),
        takeUntil(this.destroy$)
      )
      .subscribe(u => {
        if ((u?.total_requests ?? 0) > 0) {
          this.firstCall = true;
          this.stopPoll$.next();
        }
      });
  }

  openPage(): void {
    if (this.createdId == null) return;
    this.router.navigate(['../', this.createdId], { relativeTo: this.route });
  }

  trackByName(_: number, o: { name: string }): string {
    return o.name;
  }

  trackById(_: number, o: { id: number }): number {
    return o.id;
  }
}
