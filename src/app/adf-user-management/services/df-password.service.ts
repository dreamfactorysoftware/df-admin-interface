import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  ForgetPasswordRequest,
  ResetFormData,
  SecurityQuestion,
} from '../../shared/types/user-management';
import { GenericSuccessResponse } from '../../shared/types/generic-http';
import { catchError, tap } from 'rxjs';
import { URLS } from '../../shared/constants/urls';
import {
  HTTP_OPTION_LOGIN_FALSE,
  HTTP_OPTION_RESET_TRUE,
  SHOW_LOADING_HEADER,
} from '../../shared/constants/http-headers';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { faL } from '@fortawesome/free-solid-svg-icons';

@Injectable({
  providedIn: 'root',
})
export class DfPasswordService {
  constructor(
    private http: HttpClient,
    private userDataService: DfUserDataService
  ) {}
  resetPassword(data: ResetFormData, isAdmin = false) {
    const url = isAdmin ? URLS.ADMIN_PASSWORD : URLS.USER_PASSWORD;
    return this.http.post<GenericSuccessResponse>(
      url,
      data,
      HTTP_OPTION_LOGIN_FALSE
    );
  }

  updatePassword(data: UpdatePasswordRequest) {
    let isSysAdmin = false;
    // const url = this.userDataService.userData?.isSysAdmin
    //   ? URLS.ADMIN_PASSWORD
    //   : URLS.USER_PASSWORD;
    this.userDataService.userData$.subscribe(userData => {
      isSysAdmin = !!userData?.isSysAdmin;
    });
    const url = isSysAdmin ? URLS.ADMIN_PASSWORD : URLS.USER_PASSWORD;
    return this.http
      .post<UpdatePasswordResponse>(url, data, {
        headers: SHOW_LOADING_HEADER,
        params: {
          login: true,
          reset: false,
        },
      })
      .pipe(
        tap({
          next: data => {
            this.userDataService.token = data.sessionToken;
          },
        })
      );
  }

  requestPasswordReset(
    data: ForgetPasswordRequest | ResetFormData,
    hasSecurityQuestion = false
  ) {
    return this.http
      .post<SecurityQuestion | GenericSuccessResponse>(
        URLS.USER_PASSWORD,
        data,
        hasSecurityQuestion ? HTTP_OPTION_LOGIN_FALSE : HTTP_OPTION_RESET_TRUE
      )
      .pipe(
        catchError(() => {
          return this.http.post<SecurityQuestion | GenericSuccessResponse>(
            URLS.ADMIN_PASSWORD,
            data,
            hasSecurityQuestion
              ? HTTP_OPTION_LOGIN_FALSE
              : HTTP_OPTION_RESET_TRUE
          );
        })
      );
  }
}
