import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ForgetPasswordRequest,
  ResetFormData,
  SecurityQuestion,
} from '../df-password-reset/types/df-password-reset.types';
import { GenericSuccessResponse } from '../../shared/types/generic-http';
import { catchError } from 'rxjs';
import { URLS } from '../../core/constants/urls';
import {
  HTTP_OPTION_LOGIN_FALSE,
  HTTP_OPTION_RESET_TRUE,
} from '../../core/constants/http-headers';

@Injectable()
export class DfPasswordResetService {
  constructor(private http: HttpClient) {}
  resetPassword(data: ResetFormData, isAdmin: boolean) {
    const url = isAdmin ? URLS.ADMIN_PASSWORD : URLS.USER_PASSWORD;
    return this.http.post<GenericSuccessResponse>(
      url,
      data,
      HTTP_OPTION_LOGIN_FALSE
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
