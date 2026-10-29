import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DfUserDataService } from '../services/df-user-data.service';
import { catchError, filter, map, of, switchMap, take } from 'rxjs';
import { UserSession } from '../types/user';
import { ROUTES } from '../types/routes';
import { canManageServerSettings } from '../utilities/server-settings-access';

export const rootAdminGuard = () => {
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.userData$.pipe(
    filter((user): user is UserSession => user !== null),
    take(1),
    map(user => (user.isRootAdmin ? true : router.createUrlTree([ROUTES.HOME])))
  );
};

// Waits for the real session and, for a restricted admin, the real tabs (not the seeded []); refusals go Home.
export const serverSettingsGuard = () => {
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.userData$.pipe(
    filter((user): user is UserSession => user !== null),
    take(1),
    switchMap(user =>
      userDataService.accessibleTabs(user).pipe(
        catchError(() => of([] as Array<string>)),
        map(tabs =>
          canManageServerSettings(user, tabs)
            ? true
            : router.createUrlTree([ROUTES.HOME])
        )
      )
    )
  );
};
