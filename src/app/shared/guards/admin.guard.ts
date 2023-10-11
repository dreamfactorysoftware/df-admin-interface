import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DfUserDataService } from '../services/df-user-data.service';
import { map } from 'rxjs';

export const rootAdminGuard = () => {
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.userData$.pipe(map(user => user?.isRootAdmin));
};
