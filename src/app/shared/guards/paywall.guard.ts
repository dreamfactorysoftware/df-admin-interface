import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DfPaywallService } from '../services/df-paywall.service';
import { map } from 'rxjs';

export const paywallGuard =
  (paywall?: string | Array<string>) => (route: ActivatedRoute) => {
    const paywallService = inject(DfPaywallService);
    const router = inject(Router);
    return paywallService.activatePaywall(paywall).pipe(
      map(activated => {
        if (activated) {
          return router.createUrlTree(['../'], { relativeTo: route });
        }
        return true;
      })
    );
  };
