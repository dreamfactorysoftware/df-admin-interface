import { Inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, shareReplay } from 'rxjs';
import {
  LIMIT_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { ROUTES } from 'src/app/shared/types/routes';
import {
  ServiceHealth,
  ServiceHealthRule,
  ServiceRow,
} from 'src/app/shared/types/service';

/**
 * Everything needed to score every service, fetched once and diffed locally.
 * Sets hold explicit per-service grants/limits/docs; the `hasGlobal*` flags
 * cover the null-serviceId case (a role or limit that applies to all services).
 */
export interface ServiceHealthContext {
  grantedServiceIds: Set<number>;
  hasGlobalGrant: boolean;
  limitedServiceIds: Set<number>;
  hasGlobalLimit: boolean;
  documentedServiceIds: Set<number>;
}

/**
 * Derives the API Health chip client-side (Meridian spec 3.2/3.3). No backend
 * change: three list reads (roles + their service-access grants, rate limits,
 * services with their doc relation) are folded into a context, then each
 * service is scored against it. Every read degrades to empty on failure so a
 * missing signal omits its rule rather than fabricating a pass/fail.
 *
 * The context is cached (shareReplay) for the lifetime of the app; call
 * reset() after a grant/limit/doc is created so the next chip re-derives.
 */
@Injectable({ providedIn: 'root' })
export class DfServiceHealthService {
  private context$?: Observable<ServiceHealthContext>;

  constructor(
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService,
    @Inject(LIMIT_SERVICE_TOKEN) private limitService: DfBaseCrudService,
    @Inject(SERVICES_SERVICE_TOKEN) private serviceService: DfBaseCrudService
  ) {}

  getContext(): Observable<ServiceHealthContext> {
    if (!this.context$) {
      this.context$ = forkJoin({
        roles: this.roleService
          .getAll<GenericListResponse<any>>({
            related: 'role_service_access_by_role_id',
            fields: 'id,name,is_active',
            limit: 1000,
            showSpinner: false,
            errorHandling: 'toast-off',
          })
          .pipe(catchError(() => of({ resource: [] as any[] }))),
        limits: this.limitService
          .getAll<GenericListResponse<any>>({
            fields: 'id,service_id,is_active',
            limit: 1000,
            showSpinner: false,
            errorHandling: 'toast-off',
          })
          .pipe(catchError(() => of({ resource: [] as any[] }))),
        docs: this.serviceService
          .getAll<GenericListResponse<any>>({
            related: 'service_doc_by_service_id',
            fields: 'id',
            limit: 1000,
            showSpinner: false,
            errorHandling: 'toast-off',
          })
          .pipe(catchError(() => of({ resource: [] as any[] }))),
      }).pipe(
        map(({ roles, limits, docs }) =>
          this.buildContext(
            roles.resource ?? [],
            limits.resource ?? [],
            docs.resource ?? []
          )
        ),
        shareReplay(1)
      );
    }
    return this.context$;
  }

  /** Drop the cache so the next getContext() re-fetches after a config change. */
  reset(): void {
    this.context$ = undefined;
  }

  private buildContext(
    roles: any[],
    limits: any[],
    docs: any[]
  ): ServiceHealthContext {
    const grantedServiceIds = new Set<number>();
    let hasGlobalGrant = false;
    for (const role of roles) {
      if (role?.isActive === false) {
        continue;
      }
      for (const access of role?.roleServiceAccessByRoleId ?? []) {
        // verbMask 0 = a grant that permits no verb; treat as no access.
        if (!access?.verbMask) {
          continue;
        }
        if (access.serviceId == null) {
          hasGlobalGrant = true;
        } else {
          grantedServiceIds.add(access.serviceId);
        }
      }
    }

    const limitedServiceIds = new Set<number>();
    let hasGlobalLimit = false;
    for (const limit of limits) {
      if (limit?.isActive === false) {
        continue;
      }
      if (limit?.serviceId == null) {
        hasGlobalLimit = true;
      } else {
        limitedServiceIds.add(limit.serviceId);
      }
    }

    const documentedServiceIds = new Set<number>();
    for (const service of docs) {
      const doc = service?.serviceDocByServiceId;
      const present = Array.isArray(doc)
        ? doc.length > 0
        : !!(doc && (doc.content || doc.id));
      if (present) {
        documentedServiceIds.add(service.id);
      }
    }

    return {
      grantedServiceIds,
      hasGlobalGrant,
      limitedServiceIds,
      hasGlobalLimit,
      documentedServiceIds,
    };
  }

  /**
   * Pure scoring of one service against a fetched context. Only failing rules
   * are returned; an empty list means healthy. `level` rolls up to the worst
   * failing rule.
   */
  derive(row: ServiceRow, ctx: ServiceHealthContext): ServiceHealth {
    const rules: ServiceHealthRule[] = [];

    if (!ctx.hasGlobalGrant && !ctx.grantedServiceIds.has(row.id)) {
      rules.push({
        id: 'noAccess',
        level: 'danger',
        fix: [
          '/',
          ROUTES.API_CONNECTIONS,
          ROUTES.ROLE_BASED_ACCESS,
          ROUTES.CREATE,
        ],
      });
    }

    if (!ctx.hasGlobalLimit && !ctx.limitedServiceIds.has(row.id)) {
      rules.push({
        id: 'noRateLimit',
        level: 'warning',
        fix: ['/', ROUTES.API_SECURITY, ROUTES.RATE_LIMITING, ROUTES.CREATE],
      });
    }

    if (!ctx.documentedServiceIds.has(row.id)) {
      rules.push({
        id: 'noDocs',
        level: 'warning',
        fix: ['/', ROUTES.API_CONNECTIONS, ROUTES.API_DOCS, row.name],
      });
    }

    // Deprecated is opt-in: DF has no standard flag, so this rule only appears
    // when the source service explicitly carries deprecated === true. No fix
    // link (no single config surface owns it) rather than a fabricated one.
    if (row.deprecated === true) {
      rules.push({ id: 'deprecated', level: 'danger' });
    }

    const level = rules.some(rule => rule.level === 'danger')
      ? 'danger'
      : rules.length
        ? 'warning'
        : 'success';

    return { level, rules };
  }
}
