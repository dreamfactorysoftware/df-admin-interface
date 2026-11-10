import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';

/**
 * 'paywall' when this instance has no aauth system resource (the df-aauth
 * package is not there), on any license, like Data Masking, Rate Limiting,
 * Scheduler and Reporting; otherwise 'ok'.
 */
export const aauthResolver: ResolveFn<'paywall' | 'ok'> = () =>
  inject(DfPaywallService)
    .activatePaywall('aauth')
    .pipe(map(missing => (missing ? 'paywall' : 'ok')));
