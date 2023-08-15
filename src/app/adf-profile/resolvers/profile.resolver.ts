import { ResolveFn } from '@angular/router';
import { UserProfile } from '../../adf-user-management/types';
import { DfProfileService } from '../df-profile/df-profile.service';
import { inject } from '@angular/core';

export const profileResolver: ResolveFn<UserProfile> = () => {
  const profileService = inject(DfProfileService);
  return profileService.getProfile();
};
