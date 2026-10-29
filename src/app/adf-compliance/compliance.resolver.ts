import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';

/**
 * 'paywall' when this instance has no security_baseline system resource
 * (the df-masking package is not there), on any license, like Rate
 * Limiting, Scheduler and Reporting; otherwise 'ok'.
 */
export const complianceResolver: ResolveFn<'paywall' | 'ok'> = () =>
  inject(DfPaywallService)
    .activatePaywall('security_baseline')
    .pipe(map(missing => (missing ? 'paywall' : 'ok')));
