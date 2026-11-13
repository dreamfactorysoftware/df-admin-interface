import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  of,
  race,
  timer,
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
import { SESSION_TOKEN_HEADER } from 'src/app/shared/constants/http-headers';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { Nav } from 'src/app/shared/types/nav';
import { ROUTES } from 'src/app/shared/types/routes';
import { Environment } from 'src/app/shared/types/system';
import { silent } from 'src/app/shared/utilities/http-contexts';
import { ModelAlias } from './budgets.service';

/**
 * Whether this server can manage AI budgets and model aliases for the
 * signed-in user.
 * - checking: not known yet. Entry points stay hidden.
 * - available: the routes exist and accept this user.
 * - unsupported: the server has no budget routes. Its version lacks them, or
 *   the operator has left them off. Both answer the same 404.
 * - forbidden: the server has the API and refuses this user.
 * - unknown: the check failed for another reason (network, 5xx).
 */
export type AiBudgetsAvailability =
  | 'checking'
  | 'available'
  | 'unsupported'
  | 'forbidden'
  | 'unknown';

/**
 * The one request that answers "does this server have the feature".
 *
 * No free signal exists: df-ai registers no system resource, and the package
 * version in the environment payload reads `7.7.x-dev` on dev builds. The
 * alias list is the cheapest route of the feature (one small table, no spend
 * sums), it is registered with the budget routes behind the same access
 * check, and the AI page needs this exact payload. Point this at a dedicated
 * capability route if the server ever gets one.
 */
export const AI_BUDGETS_PROBE_URL = '/_internal/ai/aliases';

const DF_AI_PACKAGE = 'dreamfactory/df-ai';
/** How long to wait for the environment payload before probing anyway. */
const ENVIRONMENT_WAIT_MS = 4000;
/** How long the alias list from the probe may stand in for a fresh load. */
const PROBE_REUSE_MS = 60_000;

/** Maps a failed request to an availability state. */
export function availabilityFromError(err: unknown): AiBudgetsAvailability {
  const status = (err as { status?: number } | null)?.status;
  if (status === 404) {
    return 'unsupported';
  }
  if (status === 403) {
    return 'forbidden';
  }
  return 'unknown';
}

/**
 * The message in a DreamFactory error body, or null. Never the raw body: an
 * old server answers a missing route with an HTML page.
 */
export function serverMessage(err: unknown): string | null {
  const body = (err as { error?: unknown } | null)?.error;
  const message = (body as { error?: { message?: unknown } } | null)?.error
    ?.message;
  return typeof message === 'string' && message.trim() ? message : null;
}

/** Drops one route from a nav tree. Parents left without children go too. */
export function withoutNavRoute(navs: Array<Nav>, route: ROUTES): Array<Nav> {
  return navs
    .filter(nav => nav.route !== route)
    .map(nav => {
      if (!nav.subRoutes) {
        return nav;
      }
      const subRoutes = withoutNavRoute(nav.subRoutes, route);
      return { ...nav, subRoutes: subRoutes.length ? subRoutes : undefined };
    });
}

@Injectable({ providedIn: 'root' })
export class AiBudgetsAvailabilityService {
  private http = inject(HttpClient);
  private userData = inject(DfUserDataService);
  private systemConfig = inject(DfSystemConfigDataService);

  private recheck$ = new BehaviorSubject<number>(0);
  private probed: { aliases: ModelAlias[]; at: number } | null = null;

  /** What the server said when it refused this user, if it said anything. */
  forbiddenMessage: string | null = null;

  /**
   * One check per signed-in admin, shared by every consumer and replayed to
   * late subscribers. It runs again only when the user changes or when
   * recheck() is called from an explicit retry.
   */
  readonly state$: Observable<AiBudgetsAvailability> = combineLatest([
    this.userData.userData$.pipe(
      map(user => ({
        who: !user
          ? 'signed-out'
          : user.isSysAdmin
            ? `admin:${user.id}`
            : 'not-admin',
        token: user?.sessionToken,
      })),
      distinctUntilChanged((a, b) => a.who === b.who)
    ),
    this.recheck$,
  ]).pipe(
    switchMap(([{ who, token }]): Observable<AiBudgetsAvailability> => {
      this.probed = null;
      this.forbiddenMessage = null;
      if (who === 'signed-out') {
        return of('checking');
      }
      if (who === 'not-admin') {
        // The API is admin only. Do not ask.
        return of('forbidden');
      }
      return this.check(token).pipe(
        startWith<AiBudgetsAvailability>('checking')
      );
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  readonly available$: Observable<boolean> = this.state$.pipe(
    map(state => state === 'available'),
    distinctUntilChanged()
  );

  /** Explicit retry from an error state. Never call this on page load. */
  recheck(): void {
    this.recheck$.next(this.recheck$.value + 1);
  }

  /**
   * The alias list the probe returned, once, while it is fresh. The AI page
   * uses it so that opening the page costs no second request.
   */
  takeProbedAliases(): ModelAlias[] | null {
    const probed = this.probed;
    this.probed = null;
    if (!probed || Date.now() - probed.at > PROBE_REUSE_MS) {
      return null;
    }
    return probed.aliases;
  }

  /**
   * `token` goes on the request by hand. At login the user is published
   * before the session cookie is written, so the token interceptor has
   * nothing to attach yet and the server would answer 403 to a real admin.
   * DfUserDataService passes the token the same way for its role lookup.
   */
  private check(token?: string): Observable<AiBudgetsAvailability> {
    return this.environmentWhenLoaded().pipe(
      switchMap((environment): Observable<AiBudgetsAvailability> => {
        const packages = environment.platform?.packages;
        if (
          packages?.length &&
          !packages.some(pkg => pkg.name === DF_AI_PACKAGE)
        ) {
          // The server lists its packages and df-ai is not one. No request.
          return of('unsupported');
        }
        return this.http
          .get<{ resource?: ModelAlias[] }>(AI_BUDGETS_PROBE_URL, {
            context: silent(),
            headers: token ? { [SESSION_TOKEN_HEADER]: token } : {},
          })
          .pipe(
            map((response): AiBudgetsAvailability => {
              if (!Array.isArray(response?.resource)) {
                return 'unknown';
              }
              this.probed = { aliases: response.resource, at: Date.now() };
              return 'available';
            }),
            catchError(err => {
              const state = availabilityFromError(err);
              this.forbiddenMessage =
                state === 'forbidden' ? serverMessage(err) : null;
              return of(state);
            })
          );
      })
    );
  }

  /** The environment payload with its platform block, or whatever is there
   *  after a short wait, so a failed environment load cannot hang the check. */
  private environmentWhenLoaded(): Observable<Environment> {
    return race(
      this.systemConfig.environment$.pipe(
        filter(environment => !!environment.platform),
        take(1)
      ),
      timer(ENVIRONMENT_WAIT_MS).pipe(map(() => this.systemConfig.environment))
    );
  }
}
