import { inject } from '@angular/core';
import { DfUserDataService } from '../services/df-user-data.service';
import { map } from 'rxjs';

export const rootAdminGuard = () => {
  const userDataService = inject(DfUserDataService);
  return userDataService.userData$.pipe(map(user => user?.isRootAdmin));
};
