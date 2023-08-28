import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { URLS } from 'src/app/core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import {
  LimitType,
  CreateLimitPayload,
  UpdateLimitPayload,
  DeleteLimitResponse,
} from 'src/app/shared/types/limit';

@Injectable()
export class DfLimitsService {
  constructor(
    private http: HttpClient,
    private translateService: TranslateService
  ) {}

  getLimits(
    limit = 10,
    offset = 0,
    filter = ''
  ): Observable<GenericListResponse<LimitType>> {
    const relatedParams = [
      'service_by_service_id',
      'role_by_role_id',
      'user_by_user_id',
      'limit_cache_by_limit_id',
    ];

    return this.http.get<GenericListResponse<LimitType>>(URLS.LIMITS, {
      params: {
        filter,
        limit,
        offset,
        include_count: true,
        related: relatedParams.join(','),
      },
    });
  }

  getLimit(id: string): Observable<LimitType> {
    const url = URLS.LIMITS + `/${id}`;
    return this.http.get<LimitType>(url);
  }

  createLimit(data: CreateLimitPayload) {
    const relatedParams = [
      'service_by_service_id',
      'role_by_role_id',
      'user_by_user_id',
      'limit_cache_by_limit_id',
    ];

    const payload = {
      resource: [data],
    };

    return this.http.post<LimitType>(URLS.LIMITS, payload, {
      params: {
        fields: '*',
        related: relatedParams.join(','),
      },
      headers: {
        'snackbar-success': 'limits.createSuccessMessage',
        'snackbar-error': 'server',
      },
    });
  }

  updateLimit(data: UpdateLimitPayload) {
    const relatedParams = [
      'service_by_service_id',
      'role_by_role_id',
      'user_by_user_id',
      'limit_cache_by_limit_id',
    ];

    const url = `${URLS.LIMITS}/${data.id}`;

    return this.http.put<LimitType>(url, data, {
      params: {
        related: relatedParams.join(','),
      },
      headers: {
        'snackbar-success': 'limits.updateSuccessMessage',
        'snackbar-error': 'server',
      },
    });
  }

  deleteLimit(id: string): Observable<DeleteLimitResponse> {
    const url = URLS.LIMITS + `/${id}`;
    return this.http.delete<DeleteLimitResponse>(url, {
      headers: {
        'snackbar-success': 'limits.deleteSuccessMessage',
        'snackbar-error': 'server',
      },
    });
  }
}
