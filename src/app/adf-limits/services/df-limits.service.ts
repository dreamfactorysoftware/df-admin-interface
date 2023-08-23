import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';
import { URLS } from 'src/app/core/constants/urls';
import { SystemUserType } from 'src/app/core/services/df-user-data.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { RoleType } from 'src/app/shared/types/role';

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
  ): Observable<GenericListResponse<Array<LimitType>>> {
    const relatedParams = [
      'service_by_service_id',
      'role_by_role_id',
      'user_by_user_id',
      'limit_cache_by_limit_id',
    ];

    return this.http.get<GenericListResponse<Array<LimitType>>>(URLS.LIMITS, {
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

    const successMsg = this.translateService.instant(
      'limits.createSuccessMessage'
    );

    return this.http.post<LimitType>(URLS.LIMITS, payload, {
      params: {
        fields: '*',
        related: relatedParams.join(','),
      },
      headers: {
        'snackbar-success': successMsg,
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

    const successMsg = this.translateService.instant(
      'limits.updateSuccessMessage'
    );

    return this.http.put<LimitType>(url, data, {
      params: {
        related: relatedParams.join(','),
      },
      headers: {
        'snackbar-success': successMsg,
      },
    });
  }

  deleteLimit(id: string): Observable<DeleteLimitResponse> {
    const url = URLS.LIMITS + `/${id}`;
    return this.http.delete<DeleteLimitResponse>(url);
  }
}

type CacheLimitType = {
  id: number;
  key: string;
  max: number;
  attempts: number;
  remaining: number;
};

export type LimitType = {
  created_date: string;
  description: string;
  endpoint: string | null;
  id: number;
  isActive: boolean;
  keyText: string;
  lastModifiedDate: string;
  limitCacheByLimitId: CacheLimitType[];
  name: string;
  period: string;
  rate: number;
  roleByRoleId: RoleType | null;
  roleId: number | null;
  serviceByServiceId: SystemServiceData | null;
  serviceId: number | null;
  type: string;
  userByUserId: SystemUserType | null;
  userId: number | null;
  verb: string | null;
};

export type CreateLimitPayload = {
  cacheData: object;
  description: string | null;
  endpoint: string | null;
  is_active: boolean;
  name: string;
  period: string;
  rate: string;
  role_id: number | null;
  service_id: number | null;
  type: string;
  user_id: number | null;
  verb: string | null;
};

export type UpdateLimitPayload = Omit<
  CreateLimitPayload,
  'cacheData' | 'rate'
> & {
  id: number;
  created_date: string;
  last_modified_date: string;
  rate: number;
};

export type DeleteLimitResponse = {
  id: number;
};
