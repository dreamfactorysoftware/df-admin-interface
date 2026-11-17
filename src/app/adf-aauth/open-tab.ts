import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * For a tab of the AAuth page: a function that switches to another tab
 * (?tab=, replacing the history entry, as the tab bar does). Call it in an
 * injection context (a field initializer).
 */
export function injectOpenTab(): (tab: string) => void {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  return tab => {
    router.navigate([], {
      relativeTo: route,
      queryParams: { tab: tab === 'scopes' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  };
}
