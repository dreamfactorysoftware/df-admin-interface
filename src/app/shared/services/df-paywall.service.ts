import { Injectable } from '@angular/core';
import { map, of, switchMap } from 'rxjs';
import { DfSystemConfigDataService } from './df-system-config-data.service';

@Injectable({
  providedIn: 'root',
})
export class DfPaywallService {
  constructor(private systemConfigDataService: DfSystemConfigDataService) {}

  activatePaywall(resource?: string | Array<string>) {
    if (resource) {
      const resources = Array.isArray(resource) ? resource : [resource];
      return this.systemConfigDataService.system$.pipe(
        switchMap(system => {
          if (system.resource.length === 0) {
            return this.systemConfigDataService.fetchSystemData();
          } else {
            return of(system);
          }
        }),
        map(
          system =>
            !system.resource.some(r => {
              return resources.includes(r.name);
            })
        )
      );
    } else {
      return of(false);
    }
  }
}
