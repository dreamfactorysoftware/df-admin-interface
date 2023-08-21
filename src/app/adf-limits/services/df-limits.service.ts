import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URLS } from 'src/app/core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

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
  roleByRoleId: number | null;
  roleId: number | null;
  serviceByServiceId: any | null; // TODO: add system service data object from services module here as a type
  serviceId: number | null;
  type: string;
  userByUserId: number | null;
  userId: number | null;
  verb: string | null;
};

type CreateLimitPayload = {
  cacheData: object;
  description: string;
  endpoint: string | null;
  is_active: boolean;
  name: string;
  period: string;
  rate: number;
  role_id: number | null;
  service_id: number | null;
  type: string;
  user_id: number | null;
};

type UpdateLimitPayload = {
  id: number;
  created_date: string;
  description: string;
  endpoint: string | null;
  is_active: boolean;
  last_modified_date: string;
  name: string;
  period: string;
  rate: number;
  role_id: number | null;
  service_id: number | null;
  type: string;
  user_id: number | null;
  verb: string;
};

export type DeleteLimitResponse = {
  id: number;
};

@Injectable()
export class DfLimitsService {
  constructor(private http: HttpClient) {}

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

    return this.http.post<LimitType>(URLS.LIMITS, data, {
      params: {
        related: relatedParams.join(','),
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

    return this.http.put<LimitType>(URLS.LIMITS, data, {
      params: {
        related: relatedParams.join(','),
      },
    });
  }

  deleteLimit(id: string): Observable<DeleteLimitResponse> {
    const url = URLS.LIMITS + `/${id}`;
    return this.http.delete<DeleteLimitResponse>(url);
  }
}
