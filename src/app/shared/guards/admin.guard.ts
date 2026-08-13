import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DfUserDataService } from '../services/df-user-data.service';
import { filter, map, take } from 'rxjs';
import { UserSession } from '../types/user';
import { ROUTES } from '../types/routes';

// Root-admin gate for the Admin Settings > Admins subtree. userData$ is a
// BehaviorSubject seeded with null; on a hard navigation (e.g. the acceptance
// sweep deep-linking straight to the route) the guard used to read that initial
// null, evaluate `undefined`, and return a bare falsy value. Angular then
// cancels the navigation with no redirect, leaving a dead-blank main panel
// (no breadcrumb, title, or table) in every theme. Fix: wait for the session to
// actually resolve before deciding, and redirect a genuine non-root admin to
// Home instead of stranding them on a blank screen.
export const rootAdminGuard = () => {
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.userData$.pipe(
    filter((user): user is UserSession => user !== null),
    take(1),
    map(user => (user.isRootAdmin ? true : router.createUrlTree([ROUTES.HOME])))
  );
};
