import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResetFormData } from '../df-password-reset/types/df-password-reset.types';
import { GenericSuccessResponse } from '../../shared/types/generic-http';

@Injectable({
  providedIn: 'root',
})
export class DfPasswordResetService {
  constructor(private http: HttpClient) {}

  resetPassword(data: ResetFormData, isAdmin: boolean) {
    const url = isAdmin
      ? '/api/v2/system/admin/password'
      : '/api/v2/user/password';
    return this.http.post<GenericSuccessResponse>(url, data, {
      headers: {
        'show-loading': '',
      },
      params: {
        login: false,
      },
    });
  }
}
