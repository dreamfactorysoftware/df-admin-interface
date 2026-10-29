import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { URLS } from '../constants/urls';
import { ServerSetting } from '../types/server-setting';
import { silent } from '../utilities/http-contexts';
import { DfSystemConfigDataService } from './df-system-config-data.service';

/**
 * system/server_setting (sys admin only). Writes are silent: the page shows
 * its own inline error and keeps the previous value.
 */
@Injectable({ providedIn: 'root' })
export class DfServerSettingsService {
  private http = inject(HttpClient);
  private systemConfig = inject(DfSystemConfigDataService);

  getAll(): Observable<ServerSetting[]> {
    return this.http
      .get<{ resource: ServerSetting[] }>(URLS.SERVER_SETTING, {
        context: silent(),
      })
      .pipe(map(body => body.resource));
  }

  update(name: string, value: string): Observable<ServerSetting> {
    return this.http
      .patch<ServerSetting>(
        `${URLS.SERVER_SETTING}/${name}`,
        { value },
        { context: silent() }
      )
      .pipe(switchMap(row => this.refreshEnvironment(row)));
  }

  reset(name: string): Observable<ServerSetting> {
    return this.http
      .delete<ServerSetting>(`${URLS.SERVER_SETTING}/${name}`, {
        context: silent(),
      })
      .pipe(switchMap(row => this.refreshEnvironment(row)));
  }

  // System Info and the overview tile read the log level from system/environment.
  private refreshEnvironment(row: ServerSetting): Observable<ServerSetting> {
    return this.systemConfig.fetchEnvironmentData().pipe(map(() => row));
  }
}
