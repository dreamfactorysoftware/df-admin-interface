export interface RoleRow {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface RoleType {
  description: string;
  id: string;
  isActive: boolean;
  createdById: number;
  createdDate: string;
  lastModifiedById: number;
  lastModifiedDate: string;
  lookupByRoleId: number[];
  name: string;
}
