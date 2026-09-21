/**
 * Settings tab: Identity, Authentication (redirect URIs, API-key toggle,
 * auto OAuth picker, regenerate secret), Serving (tool naming, catalog
 * delivery, scope note), Housekeeping (orphan review, cache flush),
 * Full configuration viewer, Danger zone.
 *
 * The shell owns Save: every control here mutates the draft through the
 * McpEditorStore and calls touch(), and the dirty bar picks it up. The one
 * permitted direct API call on this tab is the manual cache flush.
 */
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import {
  CACHE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import {
  LazyMode,
  ToolStyle,
  normalizeLazyMode,
  serializeMcpConfig,
} from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';
import {
  DfMcpHousekeepingDialogComponent,
  McpHousekeepingDialogData,
} from './df-mcp-housekeeping-dialog.component';

interface OAuthServiceOption {
  name: string;
  label: string;
}

const SECRET_MASK = '••••••••';

function randomHex64(): string {
  const bytes = new Uint8Array(32);
  const c: Crypto | undefined = (globalThis as any).crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

@Component({
  selector: 'df-mcp-settings',
  standalone: true,
  templateUrl: './df-mcp-settings.component.html',
  styleUrls: ['./df-mcp-settings.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
})
export class DfMcpSettingsComponent implements OnInit, OnChanges {
  @Input({ required: true }) store!: McpEditorStore;
  @Output() requestDelete = new EventEmitter<void>();

  /** A new store means a different service: drop the local draft field. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['store'] && !changes['store'].firstChange) {
      this.newRedirectUri = '';
    }
  }

  /** OAuth-group services on this instance, for the Auto OAuth picker. */
  oauthServices: OAuthServiceOption[] = [];
  oauthLoaded = false;

  newRedirectUri = '';
  flushingCache = false;

  constructor(
    @Inject(SERVICE_TYPE_SERVICE_TOKEN)
    private serviceTypeService: DfBaseCrudService,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    private snackbarService: DfSnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOauthServices();
  }

  /** Fetch types in group 'OAuth', then the services of those types. */
  private loadOauthServices(): void {
    forkJoin({
      types: this.serviceTypeService.getAll<GenericListResponse<any>>({
        fields: 'name,group',
        limit: 1000,
      }),
      services: this.servicesService.getAll<GenericListResponse<any>>({
        limit: 1000,
        fields: 'id,name,label,type',
        sort: 'name',
      }),
    }).subscribe({
      next: ({ types, services }) => {
        const oauthTypes = new Set(
          (types?.resource ?? [])
            .filter((t: any) => t.group === 'OAuth')
            .map((t: any) => t.name)
        );
        this.oauthServices = (services?.resource ?? [])
          .filter((s: any) => oauthTypes.has(s.type))
          .map((s: any) => ({ name: s.name, label: s.label || s.name }));
        this.oauthLoaded = true;
      },
      error: () => {
        // Picker degrades to None + the stored value; nothing is asserted.
        this.oauthLoaded = true;
      },
    });
  }

  /* ------------------------------ identity ------------------------------ */
  get renamePending(): boolean {
    return this.store.draftName !== this.store.service.name;
  }

  setName(value: string): void {
    this.store.draftName = value;
    this.store.touch();
  }

  setLabel(value: string): void {
    this.store.draftLabel = value;
    this.store.touch();
  }

  setDescription(value: string): void {
    this.store.draftDescription = value;
    this.store.touch();
  }

  setActive(event: MatSlideToggleChange): void {
    this.store.draftIsActive = event.checked;
    this.store.touch();
  }

  /* --------------------------- authentication --------------------------- */
  addRedirect(): void {
    const value = this.newRedirectUri.trim();
    if (!value) return;
    if (this.store.cfg.redirectUris.includes(value)) {
      this.snackbarService.openSnackBar(
        'That redirect URI is already listed.',
        'warning'
      );
      return;
    }
    this.store.cfg.redirectUris.push(value);
    this.newRedirectUri = '';
    this.store.touch();
  }

  removeRedirect(index: number): void {
    this.store.cfg.redirectUris.splice(index, 1);
    this.store.touch();
  }

  setLoginUrl(value: string): void {
    this.store.cfg.customLoginUrl = value;
    this.store.touch();
  }

  setAutoOauth(value: string | null): void {
    this.store.cfg.autoOauthService = value;
    this.store.touch();
  }

  /** Stored value that no longer matches an OAuth service — kept visible. */
  get missingAutoOauth(): boolean {
    const v = this.store.cfg.autoOauthService;
    return (
      !!v && this.oauthLoaded && !this.oauthServices.some(s => s.name === v)
    );
  }

  setAllowApiKey(event: MatSlideToggleChange): void {
    this.store.cfg.allowApiKeyAuth = event.checked;
    this.store.touch();
  }

  regenerateSecret(): void {
    const ok = window.confirm(
      'Clients using the old secret will stop connecting. Regenerate?'
    );
    if (!ok) return;
    this.store.cfg.oauthClientSecret = randomHex64();
    this.store.touch(); // dirty bar picks it up — the shell owns Save
    this.snackbarService.openSnackBar(
      'New client secret generated — save to apply.',
      'success'
    );
  }

  /* ------------------------------- serving ------------------------------ */
  /** Stored null renders as prefixed (server default) — never as "Auto". */
  get toolStyleValue(): ToolStyle {
    return this.store.cfg.toolStyle === 'merged' ? 'merged' : 'prefixed';
  }

  /** A radio change always writes the explicit value, never null. */
  onToolStyleChange(event: MatRadioChange): void {
    const value: ToolStyle = event.value === 'merged' ? 'merged' : 'prefixed';
    this.store.cfg.toolStyle = value;
    this.store.touch();
  }

  get styleChanged(): boolean {
    return this.store.cfg.toolStyle !== this.store.savedCfg.toolStyle;
  }

  /**
   * The stored contract is exactly auto|on|off (PHP picklist + daemon).
   * Display funnels through the model's normalization so legacy stored
   * tokens ('always'/'never'/booleans) render as their on/off equivalent.
   */
  get lazyValue(): LazyMode {
    return normalizeLazyMode(this.store.cfg.lazyMode);
  }

  /** Writes only contract tokens — never 'always'/'never'. */
  setLazy(value: LazyMode): void {
    this.store.cfg.lazyMode = value;
    this.store.touch();
  }

  /** scope_tools rides in the untouched-config spread; absent means on. */
  get scopeToolsOn(): boolean {
    const rest = this.store.cfg.rest ?? {};
    const v = rest['scope_tools'] ?? rest['scopeTools'];
    return v === undefined || v === null ? true : !!v;
  }

  /* ---------------------------- housekeeping ---------------------------- */
  get orphanCount(): number {
    // Before the backend catalog loads, orphan detection would be a guess.
    return this.store.backendLoaded ? this.store.orphans().length : 0;
  }

  openHousekeeping(): void {
    const keys = this.store.orphans();
    if (!keys.length) return;
    this.dialog
      .open<DfMcpHousekeepingDialogComponent, McpHousekeepingDialogData, string[]>(
        DfMcpHousekeepingDialogComponent,
        { data: { keys }, width: '480px' }
      )
      .afterClosed()
      .subscribe(selected => {
        if (!selected || selected.length === 0) return;
        for (const key of selected) this.store.cfg.disabledTools.delete(key);
        this.store.touch();
        this.snackbarService.openSnackBar(
          `Removed ${selected.length} saved tool setting${
            selected.length === 1 ? '' : 's'
          } — save to apply.`,
          'success'
        );
      });
  }

  /** The ONE permitted direct API call on this tab. */
  flushCache(): void {
    if (this.flushingCache) return;
    this.flushingCache = true;
    this.cacheService.delete(this.store.service.name).subscribe({
      next: () => {
        this.flushingCache = false;
        this.snackbarService.openSnackBar('Cache flushed.', 'success');
      },
      error: () => {
        this.flushingCache = false;
        this.snackbarService.openSnackBar('Cache flush failed.', 'error');
      },
    });
  }

  /* -------------------------- full configuration ------------------------ */
  get fullConfigJson(): string {
    const out = serializeMcpConfig(this.store.cfg, this.store.service.type);
    if (out['oauthClientSecret']) out['oauthClientSecret'] = SECRET_MASK;
    return JSON.stringify(out, null, 2);
  }
}
