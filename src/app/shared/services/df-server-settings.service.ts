import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  concat,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { URLS } from '../constants/urls';
import { ServerSetting } from '../types/server-setting';
import { System } from '../types/system';
import { UserSession } from '../types/user';
import { silent } from '../utilities/http-contexts';
import { canManageServerSettings } from '../utilities/server-settings-access';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { DfUserDataService } from './df-user-data.service';

/** Name of the resource in the system resource list (GET /api/v2/system). */
export const SERVER_SETTING_RESOURCE = 'server_setting';

/** A write that reached the server, and whether the follow-up refresh did. */
export interface ServerSettingSaved {
  setting: ServerSetting;
  /** false: saved, but System Info and the overview may show the old value. */
  environmentRefreshed: boolean;
}

/**
 * system/server_setting (sys admin only). Writes are silent: the page shows
 * its own inline error and keeps the previous value.
 */
@Injectable({ providedIn: 'root' })
export class DfServerSettingsService {
  private http = inject(HttpClient);
  private systemConfig = inject(DfSystemConfigDataService);
  private userData = inject(DfUserDataService);
  private lookup?: Observable<boolean | null>;

  /**
   * Whether the signed-in user can open Server Settings on this backend. The
   * one rule behind the nav entry, the overview card and the System Info
   * link, answered once per session and shared, so all three always agree.
   * Emits false first for every session, so nothing waits on a request.
   */
  readonly canOpen$: Observable<boolean> = this.userData.userData$.pipe(
    switchMap(user =>
      concat(
        of(false),
        this.permitted(user).pipe(
          switchMap(permitted =>
            // userData$ emits before the session token reaches the cookie,
            // so the lookup carries the token of the session in hand.
            permitted ? this.supported(user?.sessionToken) : of(false)
          )
        )
      )
    ),
    distinctUntilChanged(),
    shareReplay(1)
  );

  /** Whether this backend exposes system/server_setting. Unknown counts as no. */
  supported(sessionToken?: string): Observable<boolean> {
    return this.listed(sessionToken).pipe(map(listed => listed === true));
  }

  /** The settings, or null when this backend does not have the resource. */
  load(): Observable<ServerSetting[] | null> {
    return this.listed().pipe(
      switchMap(listed =>
        listed === false
          ? of(null)
          : this.getAll().pipe(
              catchError(err =>
                err?.status === 404 ? of(null) : throwError(() => err)
              )
            )
      )
    );
  }

  getAll(): Observable<ServerSetting[]> {
    return this.http
      .get<{ resource: ServerSetting[] }>(URLS.SERVER_SETTING, {
        context: silent(),
      })
      .pipe(map(body => body.resource));
  }

  update(name: string, value: string): Observable<ServerSettingSaved> {
    return this.http
      .patch<ServerSetting>(
        `${URLS.SERVER_SETTING}/${name}`,
        { value },
        { context: silent() }
      )
      .pipe(switchMap(row => this.refreshEnvironment(row)));
  }

  reset(name: string): Observable<ServerSettingSaved> {
    return this.http
      .delete<ServerSetting>(`${URLS.SERVER_SETTING}/${name}`, {
        context: silent(),
      })
      .pipe(switchMap(row => this.refreshEnvironment(row)));
  }

  // System Info and the overview tile read the log level from
  // system/environment. The write has already succeeded here, so a failed
  // refresh (it retries once itself) must not turn into a failed save.
  private refreshEnvironment(
    row: ServerSetting
  ): Observable<ServerSettingSaved> {
    return this.systemConfig.fetchEnvironmentData().pipe(
      map(() => ({ setting: row, environmentRefreshed: true })),
      catchError(() => of({ setting: row, environmentRefreshed: false }))
    );
  }

  // Role and tabs only: the same check the route guard makes.
  private permitted(user: UserSession | null): Observable<boolean> {
    if (!user?.isSysAdmin) {
      return of(false);
    }
    return this.userData.accessibleTabs(user).pipe(
      catchError(() => of([] as Array<string>)),
      map(tabs => canManageServerSettings(user, tabs))
    );
  }

  /**
   * Is server_setting in the system resource list? null when the list could
   * not be read. Uses the list the paywall checks already cache; when nobody
   * has loaded it yet, fetches it once in the background and shares the
   * request between concurrent callers.
   */
  private listed(sessionToken?: string): Observable<boolean | null> {
    const has = (system: System) =>
      system.resource.some(r => r.name === SERVER_SETTING_RESOURCE);
    if (this.systemConfig.system.resource.length) {
      return of(has(this.systemConfig.system));
    }
    if (!this.lookup) {
      this.lookup = this.systemConfig.fetchSystemData(false, sessionToken).pipe(
        map(has),
        catchError(() => of(null)),
        finalize(() => (this.lookup = undefined)),
        shareReplay(1)
      );
    }
    return this.lookup;
  }
}
