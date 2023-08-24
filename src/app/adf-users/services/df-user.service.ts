import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { URLS } from 'src/app/core/constants/urls';
import { UserProfile } from 'src/app/shared/types/user';
import { DfBaseUserService } from 'src/app/shared/services/user-base.service';

@Injectable()
export class DfUserService extends DfBaseUserService<UserProfile, UserProfile> {
  url = URLS.SYSTEM_USER;
  related = 'lookup_by_user_id';
  messagePrefix = 'users';
  constructor(http: HttpClient) {
    super(http);
  }
}
