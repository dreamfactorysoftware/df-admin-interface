import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';
import { RoleType } from './role';
import { UserProfile } from './user';

interface CacheLimitType {
  id: number;
  key: string;
  max: number;
  attempts: number;
  remaining: number;
}

export interface LimitType {
  createdDate: string;
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
  userByUserId: UserProfile | null;
  userId: number | null;
  verb: string | null;
}

export type CreateLimitPayload = {
  cacheData: object;
  description: string | null;
  endpoint: string | null;
  isActive: boolean;
  name: string;
  period: string;
  rate: string;
  roleId: number | null;
  serviceId: number | null;
  type: string;
  userId: number | null;
  verb: string | null;
};

export type UpdateLimitPayload = Omit<
  CreateLimitPayload,
  'cacheData' | 'rate'
> & {
  id: number;
  createdDate: string;
  lastModifiedDate: string;
  rate: number;
};

export type DeleteLimitResponse = {
  id: number;
};
