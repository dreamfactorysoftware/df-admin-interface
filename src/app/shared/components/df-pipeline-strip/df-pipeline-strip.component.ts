import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import {
  BadgeVariant,
  DfBadgeComponent,
} from 'src/app/shared/components/df-badge/df-badge.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import {
  APP_SERVICE_TOKEN,
  LIMIT_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { ROUTES } from 'src/app/shared/types/routes';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import {
  DfScopeService,
  ScopeMatrixRoleRow,
  SCOPE_VERBS,
} from 'src/app/shared/services/df-scope.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { LimitType } from 'src/app/shared/types/limit';
import { AppType } from 'src/app/shared/types/apps';

/**
 * df-pipeline-strip — the effective request chain for one service.
 *
 * A vertical stack of hairline `--df-surface` cards rendering the ordered path
 * every request runs before it reaches the data: API key -> role gate -> rate
 * limit -> field filter -> generated handler. Each node's present/absent state
 * is derived honestly from real config the platform already stores (the role
 * graph via DfScopeService, the limit list, the app/key list); nothing is
 * assumed. Read-with-deep-links in v1: each node routes to the config that
 * governs it, and an absent policy node offers "+ Add policy" straight into the
 * relevant create form. Tokens only, so the spine stays legible in light, dark,
 * and phosphor.
 *
 * ponytail: v1 deep-links to the config route rather than opening an in-place
 * mat-dialog for every node — the role-scope dialog needs a role and no
 * rate-limit dialog exists yet. Upgrade path: swap the addLink routerLink for a
 * host-emitted (addPolicy) that opens a dialog once one exists per policy type.
 */

export type PipelineNodeKind = 'key' | 'role' | 'rate' | 'filter' | 'handler';

/** active = governance present & broad; filtered = narrowed; open = absent /
 * unmetered; handler = the terminal generated API. Drives the df-badge hue. */
export type PipelineNodeStatus = 'active' | 'filtered' | 'open' | 'handler';

export interface PipelineNode {
  kind: PipelineNodeKind;
  icon: string;
  status: PipelineNodeStatus;
  /** Whether this governance step is actually in force. */
  present: boolean;
  /** i18n key for the derived one-line summary. */
  detailKey: string;
  detailParams?: Record<string, string | number>;
  /** Deep-link to the config that governs this node (read). */
  link: string[];
  /** When absent and addable, the create route for "+ Add policy". */
  addLink?: string[];
}

const BADGE_VARIANT: Record<PipelineNodeStatus, BadgeVariant> = {
  active: 'success',
  filtered: 'warning',
  open: 'neutral',
  handler: 'build',
};

@Component({
  selector: 'df-pipeline-strip',
  standalone: true,
  templateUrl: './df-pipeline-strip.component.html',
  styleUrls: ['./df-pipeline-strip.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatIconModule,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
})
export class DfPipelineStripComponent implements OnChanges, OnDestroy {
  /** The service whose request chain to derive and render. */
  @Input() serviceId?: number | null;

  /** Optional display facts for the terminal handler node; the host already
   * holds them, so passing them avoids an extra fetch. */
  @Input() serviceName?: string;
  @Input() serviceType?: string;

  nodes: PipelineNode[] = [];
  loading = false;
  errored = false;

  private destroy$ = new Subject<void>();

  constructor(
    private scope: DfScopeService,
    @Inject(LIMIT_SERVICE_TOKEN) private limitService: DfBaseCrudService,
    @Inject(APP_SERVICE_TOKEN) private appService: DfBaseCrudService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('serviceId' in changes || 'serviceName' in changes) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  badgeVariant(node: PipelineNode): BadgeVariant {
    return BADGE_VARIANT[node.status];
  }

  trackByKind(_: number, node: PipelineNode): string {
    return node.kind;
  }

  private load(): void {
    const id = this.serviceId;
    this.nodes = [];
    this.errored = false;
    if (id === null || id === undefined) {
      return;
    }
    this.loading = true;

    forkJoin({
      matrix: this.scope.matrixForService(id),
      limits: this.limitService
        .getAll<GenericListResponse<LimitType>>({ limit: 0, sort: 'name' })
        .pipe(
          map(res => res.resource ?? []),
          catchError(() => of([] as LimitType[]))
        ),
      apps: this.appService
        .getAll<GenericListResponse<AppType>>({ limit: 0 })
        .pipe(
          map(res => res.resource ?? []),
          catchError(() => of([] as AppType[]))
        ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ matrix, limits, apps }) => {
          this.loading = false;
          this.nodes = this.buildNodes(id, matrix.roles, limits, apps);
        },
        error: () => {
          this.loading = false;
          this.errored = true;
        },
      });
  }

  private buildNodes(
    serviceId: number,
    roles: ScopeMatrixRoleRow[],
    limits: LimitType[],
    apps: AppType[]
  ): PipelineNode[] {
    // Role gate: any role with a non-'none' verb reaches this service.
    const granting = roles.filter(r =>
      SCOPE_VERBS.some(v => r.verbs[v] !== 'none')
    );
    // Field filter: any reaching grant narrowed to rows/fields ('filtered').
    const filtered = roles.filter(r =>
      SCOPE_VERBS.some(v => r.verbs[v] === 'filtered')
    );
    // Rate limit: a limit bound to this service, or a global (null) cap.
    const svcLimit =
      limits.find(l => l.serviceId === serviceId) ??
      limits.find(l => l.serviceId == null);

    const keysPath = ['/', ROUTES.API_CONNECTIONS, ROUTES.API_KEYS];
    const rolesPath = ['/', ROUTES.API_CONNECTIONS, ROUTES.ROLE_BASED_ACCESS];
    const limitsPath = ['/', ROUTES.API_SECURITY, ROUTES.RATE_LIMITING];

    const keyNode: PipelineNode = {
      kind: 'key',
      icon: 'key',
      present: apps.length > 0,
      status: apps.length > 0 ? 'active' : 'open',
      detailKey: apps.length > 0 ? 'nodes.key.detail' : 'nodes.key.empty',
      detailParams: { count: apps.length },
      link: keysPath,
      addLink: apps.length > 0 ? undefined : [...keysPath, ROUTES.CREATE],
    };

    const roleNode: PipelineNode = {
      kind: 'role',
      icon: 'security',
      present: granting.length > 0,
      status: granting.length > 0 ? 'active' : 'open',
      detailKey: granting.length > 0 ? 'nodes.role.detail' : 'nodes.role.empty',
      detailParams: { count: granting.length },
      // One clear gate deep-links to that role; several go to the roster.
      link:
        granting.length === 1
          ? [...rolesPath, String(granting[0].roleId)]
          : rolesPath,
      addLink: granting.length > 0 ? undefined : [...rolesPath, ROUTES.CREATE],
    };

    const rateNode: PipelineNode = {
      kind: 'rate',
      icon: 'speed',
      present: !!svcLimit,
      status: svcLimit ? 'active' : 'open',
      detailKey: svcLimit ? 'nodes.rate.detail' : 'nodes.rate.empty',
      detailParams: svcLimit
        ? { rate: svcLimit.rate, period: svcLimit.period }
        : undefined,
      link: svcLimit ? [...limitsPath, String(svcLimit.id)] : limitsPath,
      addLink: svcLimit ? undefined : [...limitsPath, ROUTES.CREATE],
    };

    const filterNode: PipelineNode = {
      kind: 'filter',
      icon: 'filter_alt',
      present: filtered.length > 0,
      status: filtered.length > 0 ? 'filtered' : 'open',
      detailKey:
        filtered.length > 0 ? 'nodes.filter.detail' : 'nodes.filter.empty',
      detailParams: { count: filtered.length },
      // Field filters live inside role scope; deep-link to the roster to edit.
      link: rolesPath,
    };

    const handlerNode: PipelineNode = {
      kind: 'handler',
      icon: 'bolt',
      present: true,
      status: 'handler',
      detailKey: this.serviceType ? 'nodes.handler.detail' : 'nodes.handler.empty',
      detailParams: this.serviceType ? { type: this.serviceType } : undefined,
      // The generated API's own docs are the terminal deep-link.
      link: this.serviceName
        ? ['/', ROUTES.API_CONNECTIONS, ROUTES.API_DOCS, this.serviceName]
        : ['/', ROUTES.API_CONNECTIONS, ROUTES.API_DOCS],
    };

    return [keyNode, roleNode, rateNode, filterNode, handlerNode];
  }
}
