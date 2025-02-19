import { Injectable } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { DfErrorService } from './df-error.service';

@Injectable({
  providedIn: 'root',
})
export class DfPaywallService {
  private openSourceLockedFeatures = [
    'event-scripts',
    'rate-limiting',
    'scheduler',
    'reporting',
  ];

  private silverLockedFeatures = ['rate-limiting', 'scheduler', 'reporting'];

  isFeatureLocked(route: string, licenseType: string): boolean {
    if (licenseType == 'GOLD') return false;
    if (licenseType == 'SILVER')
      return this.silverLockedFeatures.some(feature => route.includes(feature));
    return this.openSourceLockedFeatures.some(feature =>
      route.includes(feature)
    );
  }

  constructor(
    private systemConfigDataService: DfSystemConfigDataService,
    private errorService: DfErrorService
  ) {}

  activatePaywall(resource?: string | Array<string>) {
    if (resource) {
      const resources = Array.isArray(resource) ? resource : [resource];
      return this.systemConfigDataService.system$.pipe(
        switchMap(system => {
          if (system.resource.length === 0) {
            return this.systemConfigDataService.fetchSystemData().pipe(
              catchError(e => {
                this.errorService.error = e.error.message;
                return of(null);
              })
            );
          } else {
            return of(system);
          }
        }),
        map(system => {
          if (system) {
            return !system.resource.some(r => {
              return resources.includes(r.name);
            });
          } else {
            return false;
          }
        })
      );
    } else {
      return of(false);
    }
  }
}
