export interface RolePayload {
  id?: number;
  name: string;
  description: string;
  is_active: boolean;
  role_service_access_by_role_id: RoleServiceAccess[];
  lookup_by_role_id: Lookup[];
}

export interface RoleServiceAccess {
  id: number;
  role_id: number;
  service_id: number;
  component: string;
  verb_mask: number;
  requestor_mask: number; // 1 = API, 2 = SCRIPT, 3 = API & SCRIPT
  filters: any[];
  filter_op: string;
}

export interface Lookup {
  id: number;
  role_id: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
}

export interface AccessForm {
  service: number;
  component: number;
  access: number[];
  requester: number[];
  advancedFilters?: string;
  id?: number;
}

export interface ServiceResponseObj {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
  config: {
    serviceId: number;
    defaultAppId?: number;
    inviteEmailServiceId: number;
    inviteEmailTemplateId: number;
    passwordEmailServiceId: number;
    passwordEmailTemplateId: number;
  };
  serviceDocByServiceId?: number;
}

export interface RoleServiceAccessType {
  id: number;
  roleId: number;
  serviceId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters?: any[];
  filterOp: string;
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
}
