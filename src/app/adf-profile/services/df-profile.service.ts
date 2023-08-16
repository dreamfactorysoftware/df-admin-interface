import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/core/constants/urls';
import { DfUserDataService } from 'src/app/core/services/df-user-data.service';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { UserProfile } from '../types';

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
