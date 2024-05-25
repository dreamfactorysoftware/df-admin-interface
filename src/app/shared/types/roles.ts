export interface RolePayload {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleServiceAccess[];
  lookupByRoleId: Lookup[];
}

interface RoleServiceAccess {
  id: number;
  roleId: number;
  serviceId: number;
  component: string;
  verbMask: number;
  requestorMask: number; // 1 = API, 2 = SCRIPT, 3 = API & SCRIPT
  filters: any[];
  filterOp: string;
}

interface Lookup {
  id: number;
  roleId: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
}

export interface AccessForm {
  expandField?: string;
  expandOperator?: string;
  expandValue?: string;
  service: number;
  component: number;
  access: number[];
  requester: number[];
  // filters: any[];
  advancedFilters: any[];
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

  extendField: string;
  extendOperator: number;
  extendValue: string;
}
