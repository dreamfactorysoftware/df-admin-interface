import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/shared/constants/urls';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { SHOW_LOADING_HEADER } from 'src/app/shared/constants/http-headers';
import { UserProfile } from '../../shared/types/user';

@Injectable()
export class DfProfileService {
  constructor(
    private http: HttpClient,
    private userDataService: DfUserDataService
  ) {}

  get url() {
    return this.userDataService.userData?.isSysAdmin
      ? URLS.ADMIN_PROFILE
      : URLS.USER_PROFILE;
  }

  getProfile() {
    return this.http.get<UserProfile>(this.url, {
      headers: SHOW_LOADING_HEADER,
    });
  }

  saveProfile(profile: UserProfile) {
    return this.http.put<UserProfile>(this.url, profile, {
      headers: SHOW_LOADING_HEADER,
    });
  }
}
