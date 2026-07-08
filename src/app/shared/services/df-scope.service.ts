import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  APP_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { URLS } from 'src/app/shared/constants/urls';
import { SERVICE_GROUPS } from 'src/app/shared/constants/serviceGroups';
import { ROUTES } from 'src/app/shared/types/routes';
import { silent } from 'src/app/shared/utilities/http-contexts';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { Service } from 'src/app/shared/types/service';
import { AppType } from 'src/app/shared/types/apps';

/**
 * DfScopeService — the derived-access engine.
 *
 * One fetch of the role graph (`role?related=role_service_access_by_role_id`),
 * the service catalog, and the app/key list. From those three facts it derives
 * every access view the governance surfaces render. Nothing here writes; it is
 * pure client-side derivation over the grants DreamFactory already stores. No
 * backend change, no new store.
 *
 * verbMask bits: GET=1 POST=2 PUT=4 PATCH=8 DELETE=16.
 * serviceId null (or 0) on a grant row = the "all services" wildcard.
 * component `_table/{name}/*` narrows a grant to one table (row-scoped);
 * `_table/*` or `*` or empty = the whole service (full).
 */

export const SCOPE_VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type ScopeVerb = (typeof SCOPE_VERBS)[number];

const VERB_BITS: Record<ScopeVerb, number> = {
  GET: 1,
  POST: 2,
  PUT: 4,
  PATCH: 8,
  DELETE: 16,
};

/** POST|PUT|PATCH|DELETE - any bit here means a grant can mutate data. */
const WRITE_MASK =
  VERB_BITS.POST | VERB_BITS.PUT | VERB_BITS.PATCH | VERB_BITS.DELETE;

/** api-types group route segments a service detail can live under, in the order
 * df-search resolves them. Used to deep-link an OPEN service to its Access view. */
const API_TYPE_SEGMENTS = [
  ROUTES.DATABASE,
  ROUTES.SCRIPTING,
  ROUTES.NETWORK,
  ROUTES.FILE,
  ROUTES.UTILITY,
] as const;

/** How wide a grant reaches: whole service, a narrowed slice, or nothing. */
export type CellState = 'full' | 'filtered' | 'none';

/** Where a reachable service came from: named on the role, or fanned in from
 * an all-services wildcard grant the role inherited across the estate. */
export type ScopeSource = 'explicit' | 'inherited';

interface ScopeAccessRow {
  id: number;
  roleId: number;
  serviceId: number | null;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters?: unknown[];
  filterOp?: string;
}

interface ScopeRole {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  roleServiceAccessByRoleId?: ScopeAccessRow[];
}

/** One role's row in the roles x verbs matrix for a single service. */
export interface ScopeMatrixRoleRow {
  roleId: number;
  roleName: string;
  verbs: Record<ScopeVerb, CellState>;
}

export interface ScopeMatrix {
  serviceId: number;
  roles: ScopeMatrixRoleRow[];
}

/** One resolved grant a role holds: what it can reach, how, and how it got it. */
export interface ReachEntry {
  serviceId: number | null;
  serviceName: string;
  serviceLabel: string;
  /** Raw grant component, e.g. `_table/customers/*` or `*`. */
  component: string;
  /** Humanized target, e.g. "customers" or "All tables & endpoints". */
  target: string;
  verbs: ScopeVerb[];
  scope: 'full' | 'filtered';
  /** verbMask granted anything (allow) vs an explicit zero-verb deny row. */
  allow: boolean;
  source: ScopeSource;
}

/**
 * A user service's access posture under DreamFactory's deny-by-default model,
 * derived from the ACTIVE role graph:
 *  - `locked`  no active role grants access -> unreachable by any key. NOT a
 *              risk; this is the secure default, never flagged.
 *  - `scoped`  reachable but constrained -> a named-component grant (one table)
 *              or read-only (only GET across its grants). Governed/good.
 *  - `open`    an active role grants WHOLE-SERVICE access (component *, _table/*
 *              or empty) WITH a write verb (POST/PUT/PATCH/DELETE) -> the real
 *              exposure the Home alert surfaces.
 */
export type ServicePosture = 'locked' | 'scoped' | 'open';

export interface ServiceScopePosture {
  serviceId: number;
  serviceName: string;
  serviceLabel: string;
  posture: ServicePosture;
  /** Active role names whose grants make this service `open` (the "why"). */
  openRoles: string[];
  /** Router link to the service detail Access view, or null if the group of
   * its service type could not be resolved (deep-link then falls back). */
  detailRoute: string[] | null;
}

/** Estate-wide posture rollup over every service the role graph can classify. */
export interface GovernancePosture {
  services: ServiceScopePosture[];
  lockedCount: number;
  scopedCount: number;
  openCount: number;
  /** scoped + open - services at least one active role can actually reach. */
  reachableCount: number;
}

@Injectable({ providedIn: 'root' })
export class DfScopeService {
  private roles$?: Observable<ScopeRole[]>;
  private services$?: Observable<Service[]>;
  private apps$?: Observable<AppType[]>;
  private typeGroups$?: Observable<Map<string, string>>;

  constructor(
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService,
    @Inject(APP_SERVICE_TOKEN) private appService: DfBaseCrudService,
    private http: HttpClient
  ) {}

  /** Drop every cache so the next derivation refetches (post-edit refresh). */
  refresh(): void {
    this.roles$ = undefined;
    this.services$ = undefined;
    this.apps$ = undefined;
    this.typeGroups$ = undefined;
  }

  private getRoles(): Observable<ScopeRole[]> {
    if (!this.roles$) {
      this.roles$ = this.roleService
        .getAll<GenericListResponse<ScopeRole>>({
          limit: 0,
          related: 'role_service_access_by_role_id',
          sort: 'name',
        })
        .pipe(
          map(res => res.resource ?? []),
          catchError(() => of([] as ScopeRole[])),
          shareReplay(1)
        );
    }
    return this.roles$;
  }

  private getServices(): Observable<Service[]> {
    if (!this.services$) {
      this.services$ = this.servicesService
        .getAll<GenericListResponse<Service>>({ limit: 0, sort: 'name' })
        .pipe(
          map(res => res.resource ?? []),
          catchError(() => of([] as Service[])),
          shareReplay(1)
        );
    }
    return this.services$;
  }

  private getApps(): Observable<AppType[]> {
    if (!this.apps$) {
      this.apps$ = this.appService
        .getAll<GenericListResponse<AppType>>({ limit: 0 })
        .pipe(
          map(res => res.resource ?? []),
          catchError(() => of([] as AppType[])),
          shareReplay(1)
        );
    }
    return this.apps$;
  }

  /**
   * Roles x verbs for one service. Every role appears as a row; a verb the role
   * cannot use on this service reads 'none' (muted), so the grid also proves the
   * absence of access, not only its presence.
   */
  matrixForService(serviceId: number): Observable<ScopeMatrix> {
    return this.getRoles().pipe(
      map(roles => ({
        serviceId,
        roles: roles
          .map(role => this.matrixRowForRole(role, serviceId))
          .sort((a, b) => a.roleName.localeCompare(b.roleName)),
      }))
    );
  }

  private matrixRowForRole(
    role: ScopeRole,
    serviceId: number
  ): ScopeMatrixRoleRow {
    const rows = (role.roleServiceAccessByRoleId ?? []).filter(
      r => this.isWildcardService(r.serviceId) || r.serviceId === serviceId
    );
    const verbs = {} as Record<ScopeVerb, CellState>;
    for (const verb of SCOPE_VERBS) {
      verbs[verb] = this.resolveVerbState(rows, verb);
    }
    return { roleId: role.id, roleName: role.name, verbs };
  }

  /** full beats filtered beats none across every grant row touching a verb. */
  private resolveVerbState(rows: ScopeAccessRow[], verb: ScopeVerb): CellState {
    let state: CellState = 'none';
    for (const row of rows) {
      if ((row.verbMask & VERB_BITS[verb]) !== VERB_BITS[verb]) {
        continue;
      }
      const rowScope = this.rowScope(row);
      if (rowScope === 'full') {
        return 'full';
      }
      state = 'filtered';
    }
    return state;
  }

  /**
   * Everything a role can reach, one entry per (service, component). Wildcard
   * "all services" grants fan out across the catalog as inherited entries;
   * service-named grants are explicit and win for their service.
   */
  reachForRole(roleId: number): Observable<ReachEntry[]> {
    return forkJoin({
      roles: this.getRoles(),
      services: this.getServices(),
    }).pipe(
      map(({ roles, services }) => this.buildReach(roleId, roles, services))
    );
  }

  /** Resolve a key/app to its attached role, then its reach. */
  reachForKey(keyId: number): Observable<ReachEntry[]> {
    return this.roleIdForApp(keyId).pipe(
      switchMap(roleId =>
        roleId == null ? of([] as ReachEntry[]) : this.reachForRole(roleId)
      )
    );
  }

  /** Agents attach a role through the same app record; resolve identically. */
  reachForAgent(agentId: number): Observable<ReachEntry[]> {
    return this.reachForKey(agentId);
  }

  /** The role id an app/key operates under, or null if unscoped. */
  roleIdForApp(appId: number): Observable<number | null> {
    return this.getApps().pipe(
      map(apps => apps.find(a => a.id === appId)?.roleId ?? null)
    );
  }

  private buildReach(
    roleId: number,
    roles: ScopeRole[],
    services: Service[]
  ): ReachEntry[] {
    const role = roles.find(r => r.id === roleId);
    if (!role) {
      return [];
    }
    const rows = role.roleServiceAccessByRoleId ?? [];
    const serviceById = new Map<number, Service>();
    services.forEach(s => serviceById.set(s.id, s));

    const explicit: ReachEntry[] = [];
    const explicitServiceIds = new Set<number>();
    const wildcardRows: ScopeAccessRow[] = [];

    for (const row of rows) {
      if (this.isWildcardService(row.serviceId)) {
        wildcardRows.push(row);
        continue;
      }
      const svc = serviceById.get(row.serviceId as number);
      if (!svc) {
        continue;
      }
      explicitServiceIds.add(svc.id);
      explicit.push(this.reachEntry(row, svc, 'explicit'));
    }

    const inherited: ReachEntry[] = [];
    for (const row of wildcardRows) {
      for (const svc of services) {
        if (explicitServiceIds.has(svc.id)) {
          continue;
        }
        inherited.push(this.reachEntry(row, svc, 'inherited'));
      }
    }

    return [...explicit, ...inherited].sort(
      (a, b) =>
        a.serviceName.localeCompare(b.serviceName) ||
        a.target.localeCompare(b.target)
    );
  }

  private reachEntry(
    row: ScopeAccessRow,
    service: Service,
    source: ScopeSource
  ): ReachEntry {
    const verbs = this.decodeVerbs(row.verbMask);
    return {
      serviceId: service.id,
      serviceName: service.name,
      serviceLabel: service.label || service.name,
      component: row.component || '*',
      target: this.humanizeComponent(row.component),
      verbs,
      scope: this.rowScope(row),
      allow: verbs.length > 0,
      source,
    };
  }

  /**
   * Classify every service by its deny-by-default access posture across all
   * ACTIVE roles. This is the honest governance signal: LOCKED is the secure
   * default (unreachable, never a risk), SCOPED is reachable-but-constrained,
   * and OPEN - whole-service access with a write verb - is the real exposure.
   * Rate limits are deliberately NOT a factor: they are optional in DF and say
   * nothing about who can reach what.
   */
  governancePosture(): Observable<GovernancePosture> {
    return forkJoin({
      roles: this.getRoles(),
      services: this.getServices(),
      typeGroups: this.getTypeGroups(),
    }).pipe(
      map(({ roles, services, typeGroups }) =>
        this.buildGovernance(roles, services, typeGroups)
      )
    );
  }

  private buildGovernance(
    roles: ScopeRole[],
    services: Service[],
    typeGroups: Map<string, string>
  ): GovernancePosture {
    const activeRoles = roles.filter(r => r.isActive !== false);
    const postures = services.map(svc =>
      this.postureForService(svc, activeRoles, typeGroups)
    );
    const lockedCount = postures.filter(p => p.posture === 'locked').length;
    const scopedCount = postures.filter(p => p.posture === 'scoped').length;
    const openCount = postures.filter(p => p.posture === 'open').length;
    return {
      services: postures,
      lockedCount,
      scopedCount,
      openCount,
      reachableCount: scopedCount + openCount,
    };
  }

  private postureForService(
    service: Service,
    activeRoles: ScopeRole[],
    typeGroups: Map<string, string>
  ): ServiceScopePosture {
    let reachable = false;
    const openRoles: string[] = [];

    for (const role of activeRoles) {
      let roleOpensService = false;
      let roleReaches = false;
      for (const row of role.roleServiceAccessByRoleId ?? []) {
        const targetsService =
          this.isWildcardService(row.serviceId) || row.serviceId === service.id;
        if (!targetsService || row.verbMask <= 0) {
          continue; // unrelated grant, or an explicit zero-verb deny row
        }
        roleReaches = true;
        const wholeService = this.rowScope(row) === 'full';
        const hasWrite = (row.verbMask & WRITE_MASK) !== 0;
        if (wholeService && hasWrite) {
          roleOpensService = true;
        }
      }
      if (roleReaches) {
        reachable = true;
      }
      if (roleOpensService) {
        openRoles.push(role.name);
      }
    }

    const posture: ServicePosture = !reachable
      ? 'locked'
      : openRoles.length > 0
        ? 'open'
        : 'scoped';

    return {
      serviceId: service.id,
      serviceName: service.name,
      serviceLabel: service.label || service.name,
      posture,
      openRoles,
      detailRoute: this.detailRouteForService(service, typeGroups),
    };
  }

  /** Deep-link array for a service's detail Access view, resolving its api-types
   * group segment from the service type's group. null when unresolvable. */
  private detailRouteForService(
    service: Service,
    typeGroups: Map<string, string>
  ): string[] | null {
    const group = typeGroups.get(service.type);
    if (!group) {
      return null;
    }
    const segment = API_TYPE_SEGMENTS.find(seg =>
      SERVICE_GROUPS[seg]?.includes(group)
    );
    if (!segment) {
      return null;
    }
    return [
      '/',
      ROUTES.API_CONNECTIONS,
      ROUTES.API_TYPES,
      segment,
      String(service.id),
    ];
  }

  /** service type name -> its group label (e.g. `mysql` -> `Database`), cached.
   * Silent: an unreadable endpoint yields an empty map so deep-links fall back
   * rather than breaking the posture rollup. */
  private getTypeGroups(): Observable<Map<string, string>> {
    if (!this.typeGroups$) {
      this.typeGroups$ = this.http
        .get<{
          resource?: Array<{ name: string; group: string }>;
        }>(`${URLS.SERVICE_TYPE}?fields=name,group`, { context: silent() })
        .pipe(
          map(res => {
            const m = new Map<string, string>();
            for (const t of res?.resource ?? []) {
              if (t?.name && t?.group) {
                m.set(t.name, t.group);
              }
            }
            return m;
          }),
          catchError(() => of(new Map<string, string>())),
          shareReplay(1)
        );
    }
    return this.typeGroups$;
  }

  private isWildcardService(serviceId: number | null | undefined): boolean {
    return serviceId == null || serviceId === 0;
  }

  /** A row is full only for the broad wildcards; filters or a named component
   * narrow it to a row/table slice. */
  private rowScope(row: ScopeAccessRow): 'full' | 'filtered' {
    if (row.filters && row.filters.length > 0) {
      return 'filtered';
    }
    const c = (row.component || '').trim();
    if (c === '' || c === '*' || c === '_table/*') {
      return 'full';
    }
    return 'filtered';
  }

  private decodeVerbs(mask: number): ScopeVerb[] {
    return SCOPE_VERBS.filter(v => (mask & VERB_BITS[v]) === VERB_BITS[v]);
  }

  private humanizeComponent(component: string): string {
    const c = (component || '*').trim();
    if (c === '' || c === '*') {
      return 'All tables & endpoints';
    }
    if (c === '_table/*') {
      return 'All tables';
    }
    return c.replace(/^_table\//, '').replace(/\/\*$/, '') || c;
  }
}
