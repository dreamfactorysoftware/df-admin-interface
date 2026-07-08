import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs';
import { BASE_URL } from '../constants/urls';
import { ROUTES } from '../types/routes';

/**
 * The command palette (Cmd/Ctrl-K) and the sidebar should never drift, so
 * every reachable target - real objects AND verbs - is registered here once.
 * The palette fuzzy-indexes this registry; the same verb list can later back
 * the "+ new" affordances so nav and palette stay in lockstep (spec move 5).
 */

export type PaletteKind =
  | 'action'
  | 'service'
  | 'role'
  | 'key'
  | 'mcp'
  | 'doc';

export interface PaletteItem {
  /** Stable id for trackBy + recents dedupe. */
  id: string;
  kind: PaletteKind;
  /** Primary line (object name or verb). Already human, not a key. */
  label: string;
  /** Muted second line: service type, description, or the target route. */
  sublabel?: string;
  /** Router path the item navigates to on Enter. */
  path: string;
  /** Extra tokens folded into the fuzzy match (type, synonyms). */
  keywords?: string;
  /** Satisfies CDK ListKeyManagerOption; never set (no item is disabled). */
  disabled?: boolean;
}

export interface PaletteGroup {
  /** i18n key for the group micro-header. */
  labelKey: string;
  kind: PaletteKind;
  items: PaletteItem[];
}

interface ServiceRow {
  id: number;
  name: string;
  label?: string;
  type: string;
}
interface RoleRow {
  id: number;
  name: string;
  description?: string;
}
interface AppRow {
  id: number;
  name: string;
  description?: string;
}

const RECENTS_KEY = 'df.commandPalette.recents';
const RECENTS_MAX = 6;

// Group render + fuzzy tie-break order. Actions first (a verb the operator
// typed is almost always the intent), then objects, then plain nav jumps.
const GROUP_ORDER: PaletteKind[] = [
  'action',
  'service',
  'role',
  'key',
  'mcp',
  'doc',
];

const GROUP_LABEL: Record<PaletteKind, string> = {
  action: 'commandPalette.groups.actions',
  service: 'commandPalette.groups.services',
  role: 'commandPalette.groups.roles',
  key: 'commandPalette.groups.keys',
  mcp: 'commandPalette.groups.mcp',
  doc: 'commandPalette.groups.docs',
};

@Injectable({ providedIn: 'root' })
export class ActionRegistryService {
  private http = inject(HttpClient);

  // Objects are cached after the first load so reopening the palette is
  // instant; refresh() re-pulls when the overlay opens to catch new objects.
  private objects$ = new BehaviorSubject<PaletteItem[]>([]);
  private loaded = false;

  /**
   * Static verbs + route jumps. Paths reuse the exact ROUTES combinations the
   * existing search service and nav already navigate, so no link can dangle.
   * `keywords` carries synonyms an operator might type instead of the label.
   */
  private readonly verbs: PaletteItem[] = [
    {
      id: 'verb.new-service',
      kind: 'action',
      label: 'New service',
      sublabel: 'Connect a datasource',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.DATABASE}/${ROUTES.CREATE}`,
      keywords: 'create add api database connection datasource generate',
    },
    {
      id: 'verb.new-role',
      kind: 'action',
      label: 'New role',
      sublabel: 'Scope access for a caller',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}/${ROUTES.CREATE}`,
      keywords: 'create add rbac permission scope access',
    },
    {
      id: 'verb.new-key',
      kind: 'action',
      label: 'New API key',
      sublabel: 'Mint a caller credential',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}/${ROUTES.CREATE}`,
      keywords: 'create add app token credential apikey',
    },
    {
      id: 'verb.expose-mcp',
      kind: 'action',
      label: 'Expose as MCP',
      sublabel: 'Serve a service to agents',
      path: `/${ROUTES.AI}/${ROUTES.AI_MCP}`,
      keywords: 'mcp tool agent model context protocol ai',
    },
    {
      id: 'verb.view-logs',
      kind: 'action',
      label: 'View logs',
      sublabel: 'System log stream',
      path: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.LOGS}`,
      keywords: 'log debug trace error output',
    },
    {
      id: 'verb.new-limit',
      kind: 'action',
      label: 'New rate limit',
      sublabel: 'Cap requests on a path',
      path: `/${ROUTES.API_SECURITY}/${ROUTES.RATE_LIMITING}/${ROUTES.CREATE}`,
      keywords: 'create add throttle 429 limit quota',
    },
    {
      id: 'verb.new-script',
      kind: 'action',
      label: 'New event script',
      sublabel: 'Hook a request lifecycle event',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.EVENT_SCRIPTS}/${ROUTES.CREATE}`,
      keywords: 'create add hook lifecycle php python nodejs',
    },
  ];

  /**
   * Route jumps ("go to area"). Home deletes its nav-mirror cards precisely
   * because this belongs in Cmd-K (spec 3.1).
   */
  private readonly jumps: PaletteItem[] = [
    {
      id: 'jump.home',
      kind: 'doc',
      label: 'Home',
      path: `/${ROUTES.HOME}`,
      keywords: 'dashboard start overview',
    },
    {
      id: 'jump.api-connections',
      kind: 'doc',
      label: 'API Connections',
      path: `/${ROUTES.API_CONNECTIONS}`,
      keywords: 'services build database',
    },
    {
      id: 'jump.api-docs',
      kind: 'doc',
      label: 'API Docs',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
      keywords: 'swagger openapi try reference',
    },
    {
      id: 'jump.roles',
      kind: 'doc',
      label: 'Roles',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
      keywords: 'rbac access permission scope',
    },
    {
      id: 'jump.keys',
      kind: 'doc',
      label: 'API Keys',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
      keywords: 'apps tokens credentials',
    },
    {
      id: 'jump.rate-limiting',
      kind: 'doc',
      label: 'Rate Limiting',
      path: `/${ROUTES.API_SECURITY}/${ROUTES.RATE_LIMITING}`,
      keywords: 'throttle quota 429 security',
    },
    {
      id: 'jump.ai',
      kind: 'doc',
      label: 'AI Gateway',
      path: `/${ROUTES.AI}`,
      keywords: 'llm model agent chat',
    },
    {
      id: 'jump.ai-usage',
      kind: 'doc',
      label: 'AI Usage',
      path: `/${ROUTES.AI}/${ROUTES.AI_USAGE}`,
      keywords: 'cost spend tokens metering',
    },
    {
      id: 'jump.event-scripts',
      kind: 'doc',
      label: 'Event Scripts',
      path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.EVENT_SCRIPTS}`,
      keywords: 'hooks lifecycle scripting',
    },
    {
      id: 'jump.scheduler',
      kind: 'doc',
      label: 'Scheduler',
      path: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.SCHEDULER}`,
      keywords: 'cron task job schedule',
    },
    {
      id: 'jump.logs',
      kind: 'doc',
      label: 'Logs',
      path: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.LOGS}`,
      keywords: 'debug trace output',
    },
    {
      id: 'jump.admins',
      kind: 'doc',
      label: 'Admins',
      path: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.ADMINS}`,
      keywords: 'administrators team users',
    },
    {
      id: 'jump.users',
      kind: 'doc',
      label: 'Users',
      path: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.USERS}`,
      keywords: 'accounts people',
    },
  ];

  /** Pull objects from the real endpoints. Silent on failure - a partial
   *  index still beats blocking the palette on one dead call. */
  refresh(): Observable<PaletteItem[]> {
    return forkJoin({
      services: this.http
        .get<{ resource: ServiceRow[] }>(`${BASE_URL}/system/service`, {
          params: { fields: 'id,name,label,type', sort: 'name', limit: '500' },
        })
        .pipe(catchError(() => of({ resource: [] as ServiceRow[] }))),
      roles: this.http
        .get<{ resource: RoleRow[] }>(`${BASE_URL}/system/role`, {
          params: { fields: 'id,name,description', sort: 'name', limit: '500' },
        })
        .pipe(catchError(() => of({ resource: [] as RoleRow[] }))),
      apps: this.http
        .get<{ resource: AppRow[] }>(`${BASE_URL}/system/app`, {
          params: { fields: 'id,name,description', sort: 'name', limit: '500' },
        })
        .pipe(catchError(() => of({ resource: [] as AppRow[] }))),
    }).pipe(
      map(({ services, roles, apps }) => {
        const items: PaletteItem[] = [];
        for (const s of services.resource ?? []) {
          // MCP services split into their own group; everything else is a
          // plain service. One /system/service pull feeds both.
          const isMcp = s.type === 'mcp';
          items.push({
            id: `service.${s.id}`,
            kind: isMcp ? 'mcp' : 'service',
            label: s.label || s.name,
            sublabel: s.type,
            path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}/${s.name}`,
            keywords: `${s.name} ${s.type}`,
          });
        }
        for (const r of roles.resource ?? []) {
          items.push({
            id: `role.${r.id}`,
            kind: 'role',
            label: r.name,
            sublabel: r.description || undefined,
            path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}/${r.id}`,
            keywords: 'role rbac access',
          });
        }
        for (const a of apps.resource ?? []) {
          items.push({
            id: `key.${a.id}`,
            kind: 'key',
            label: a.name,
            sublabel: a.description || undefined,
            path: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}/${a.id}`,
            keywords: 'api key app token credential',
          });
        }
        return items;
      }),
      tap(items => {
        this.objects$.next(items);
        this.loaded = true;
      })
    );
  }

  /** Full static + dynamic index. */
  private all(): PaletteItem[] {
    return [...this.verbs, ...this.objects$.value, ...this.jumps];
  }

  /**
   * Grouped fuzzy results for a query. Empty query returns nothing - the
   * component renders the context-aware empty state instead.
   */
  query(term: string): PaletteGroup[] {
    const q = term.trim().toLowerCase();
    if (!q) {
      return [];
    }
    const scored = this.all()
      .map(item => ({ item, score: this.score(q, item) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const byKind = new Map<PaletteKind, PaletteItem[]>();
    for (const { item } of scored) {
      const bucket = byKind.get(item.kind) ?? [];
      // Cap each group so one huge object type cannot bury the others.
      if (bucket.length < 8) {
        bucket.push(item);
        byKind.set(item.kind, bucket);
      }
    }
    return GROUP_ORDER.filter(kind => byKind.has(kind)).map(kind => ({
      kind,
      labelKey: GROUP_LABEL[kind],
      items: byKind.get(kind)!,
    }));
  }

  /**
   * Context-aware empty state: recent picks first, then the actions most
   * likely next for the current route. Falls back to core verbs everywhere.
   */
  emptyState(currentUrl: string): PaletteGroup[] {
    const groups: PaletteGroup[] = [];
    const recents = this.getRecents();
    if (recents.length) {
      groups.push({
        kind: 'doc',
        labelKey: 'commandPalette.groups.recent',
        items: recents,
      });
    }
    const suggested = this.suggestFor(currentUrl);
    if (suggested.length) {
      groups.push({
        kind: 'action',
        labelKey: 'commandPalette.groups.suggested',
        items: suggested,
      });
    }
    return groups;
  }

  /** Route-aware "likely next action" heuristic over the static verb list. */
  private suggestFor(url: string): PaletteItem[] {
    const verb = (id: string) => this.verbs.find(v => v.id === id);
    const jump = (id: string) => this.jumps.find(j => j.id === id);
    let ids: Array<PaletteItem | undefined>;
    if (url.includes(ROUTES.API_KEYS)) {
      ids = [verb('verb.new-key'), jump('jump.roles'), verb('verb.new-role')];
    } else if (url.includes(ROUTES.ROLE_BASED_ACCESS)) {
      ids = [verb('verb.new-role'), verb('verb.new-key'), jump('jump.ai')];
    } else if (url.includes(ROUTES.AI)) {
      ids = [verb('verb.expose-mcp'), jump('jump.ai-usage'), jump('jump.roles')];
    } else if (url.includes(ROUTES.RATE_LIMITING)) {
      ids = [verb('verb.new-limit'), jump('jump.roles'), verb('verb.view-logs')];
    } else if (url.includes(ROUTES.API_DOCS)) {
      ids = [verb('verb.new-key'), verb('verb.new-role'), jump('jump.ai')];
    } else {
      ids = [verb('verb.new-service'), verb('verb.new-key'), jump('jump.ai')];
    }
    return ids.filter((i): i is PaletteItem => !!i);
  }

  /**
   * Fuzzy subsequence score. Rewards a prefix hit, contiguous runs, and
   * word-boundary starts; a plain substring in keywords still scores. Returns
   * 0 when the query is not a subsequence of label+keywords.
   */
  private score(q: string, item: PaletteItem): number {
    const label = item.label.toLowerCase();
    const hay = `${label} ${item.keywords ?? ''}`.toLowerCase();

    // Strong, cheap signals first.
    if (label.startsWith(q)) {
      return 1000 - label.length;
    }
    if (label.includes(q)) {
      return 700 - label.indexOf(q);
    }

    // Subsequence walk over the full haystack.
    let hi = 0;
    let score = 0;
    let streak = 0;
    let matched = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const ch = q[qi];
      let found = -1;
      for (let k = hi; k < hay.length; k++) {
        if (hay[k] === ch) {
          found = k;
          break;
        }
      }
      if (found === -1) {
        return 0;
      }
      matched++;
      const boundary = found === 0 || hay[found - 1] === ' ';
      if (found === hi && qi > 0) {
        streak++;
        score += 8 + streak * 2;
      } else {
        streak = 0;
        score += boundary ? 6 : 2;
      }
      hi = found + 1;
    }
    return matched === q.length ? Math.max(1, score) : 0;
  }

  // --- Recents (localStorage; survives reloads, per-browser) ----------------

  getRecents(): PaletteItem[] {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PaletteItem[]) : [];
    } catch {
      return [];
    }
  }

  pushRecent(item: PaletteItem): void {
    try {
      const next = [
        item,
        ...this.getRecents().filter(r => r.id !== item.id),
      ].slice(0, RECENTS_MAX);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // Storage disabled/full - recents are a nicety, never fatal.
    }
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}
