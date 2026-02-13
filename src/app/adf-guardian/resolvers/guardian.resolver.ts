import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import {
  GUARDIAN_DASHBOARD_SERVICE_TOKEN,
  GUARDIAN_LOG_SERVICE_TOKEN,
  GUARDIAN_ALERT_SERVICE_TOKEN,
  GUARDIAN_APPROVAL_SERVICE_TOKEN,
  GUARDIAN_CONFIG_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import {
  GuardianDashboardData,
  GuardianLogEntry,
  GuardianAlertEntry,
  GuardianApprovalEntry,
  GuardianConfig,
} from '../types';

interface GenericListResponse<T> {
  resource: T[];
  meta: { count: number };
}

export const guardianDashboardResolver: ResolveFn<GuardianDashboardData> =
  () => {
    const service = inject(GUARDIAN_DASHBOARD_SERVICE_TOKEN);
    return service.getAll<GuardianDashboardData>({});
  };

export const guardianLogsResolver =
  (limit?: number): ResolveFn<GenericListResponse<GuardianLogEntry>> =>
  () => {
    const service = inject(GUARDIAN_LOG_SERVICE_TOKEN);
    return service.getAll<GenericListResponse<GuardianLogEntry>>({
      limit: limit ?? 50,
    });
  };

export const guardianAlertsResolver =
  (limit?: number): ResolveFn<GenericListResponse<GuardianAlertEntry>> =>
  () => {
    const service = inject(GUARDIAN_ALERT_SERVICE_TOKEN);
    return service.getAll<GenericListResponse<GuardianAlertEntry>>({
      limit: limit ?? 50,
    });
  };

export const guardianApprovalsResolver =
  (limit?: number): ResolveFn<GenericListResponse<GuardianApprovalEntry>> =>
  () => {
    const service = inject(GUARDIAN_APPROVAL_SERVICE_TOKEN);
    return service.getAll<GenericListResponse<GuardianApprovalEntry>>({
      limit: limit ?? 50,
    });
  };

export const guardianConfigResolver: ResolveFn<GuardianConfig> = () => {
  const service = inject(GUARDIAN_CONFIG_SERVICE_TOKEN);
  return service.getAll<GuardianConfig>({});
};
