import { ResolveFn } from '@angular/router';
import { DfProfileService } from '../services/df-profile.service';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';

export const profileResolver: ResolveFn<UserProfile> = () => {
  const profileService = inject(DfProfileService);
  return profileService.getProfile();
};
