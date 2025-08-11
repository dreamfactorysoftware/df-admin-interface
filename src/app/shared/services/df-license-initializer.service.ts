import { Injectable } from '@angular/core';
import { DfLicenseCheckService } from './df-license-check.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { catchError, map, of, switchMap, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfLicenseInitializerService {
  constructor(
    private licenseCheckService: DfLicenseCheckService,
    private systemConfigDataService: DfSystemConfigDataService
  ) {}

  initializeLicenseCheck() {
    // Only perform the check once on app initialization
    return this.systemConfigDataService.environment$.pipe(
      take(1),
      switchMap(environment => {
        if (
          environment.platform?.license &&
          environment.platform?.license !== 'OPEN SOURCE' &&
          environment.platform?.licenseKey
        ) {
          // Check if we don't already have a license check result
          if (!this.licenseCheckService.currentLicenseCheck) {
            return this.licenseCheckService
              .check(environment.platform.licenseKey as string)
              .pipe(
                map(() => true),
                catchError(() => of(true)) // Continue even if check fails
              );
          }
        }
        return of(true);
      })
    );
  }
}
