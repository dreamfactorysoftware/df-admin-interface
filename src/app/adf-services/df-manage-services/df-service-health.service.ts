import { Inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import { ROLE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
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
 * The set holds explicit per-service grants; `hasGlobalGrant` covers the
 * null-serviceId case (a role grant that applies to all services).
 */
export interface ServiceHealthContext {
  grantedServiceIds: Set<number>;
  hasGlobalGrant: boolean;
}

/**
 * Derives the API Health chip client-side (Meridian spec 3.2/3.3). No backend
 * change: one list read (roles + their service-access grants) is folded into a
 * context, then each service is scored against it. The read degrades to empty
 * on failure so a missing signal omits its rule rather than fabricating a
 * pass/fail.
 *
 * Health covers only signals that actually make a service unusable or unsafe.
 * Two earlier rules were dropped because neither tracked service health:
 *  - noDocs read `service_doc_by_service_id`, which is populated only when an
 *    admin uploads a *custom* OpenAPI override. Every service gets a spec
 *    generated from its type at runtime, so that relation is empty on a
 *    healthy install and the rule flagged the entire catalog.
 *  - noRateLimit flagged every service on any install without limits, which is
 *    the norm (limits are a licensed feature), so it was noise, not a signal.
 *
 * The context is cached (shareReplay) for the lifetime of the app; call
 * reset() after a grant is created so the next chip re-derives.
 */
@Injectable({ providedIn: 'root' })
export class DfServiceHealthService {
  private context$?: Observable<ServiceHealthContext>;

  constructor(
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService
  ) {}

  getContext(): Observable<ServiceHealthContext> {
    if (!this.context$) {
      this.context$ = this.roleService
        .getAll<GenericListResponse<any>>({
          related: 'role_service_access_by_role_id',
          fields: 'id,name,is_active',
          limit: 1000,
          showSpinner: false,
          errorHandling: 'toast-off',
        })
        .pipe(
          catchError(() => of({ resource: [] as any[] })),
          map(roles => this.buildContext(roles.resource ?? [])),
          shareReplay(1)
        );
    }
    return this.context$;
  }

  /** Drop the cache so the next getContext() re-fetches after a config change. */
  reset(): void {
    this.context$ = undefined;
  }

  private buildContext(roles: any[]): ServiceHealthContext {
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

    return { grantedServiceIds, hasGlobalGrant };
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
