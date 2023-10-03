export interface AppRow {
  id: number;
  name: string;
  role: string;
  apiKey: string;
  description?: string;
  active: boolean;
  launchUrl: string;
}

export interface RoleByRoleId {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById?: number;
}

export interface AppType {
  id: number;
  name: string;
  apiKey: string;
  description: string;
  isActive: boolean;
  type: number;
  path?: string;
  url?: string;
  storageServiceId?: number;
  storageContainer?: string;
  requiresFullscreen: boolean;
  allowFullscreenToggle: boolean;
  toggleLocation: string;
  roleId?: number;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById?: number;
  launchUrl: string;
  roleByRoleId?: RoleByRoleId;
}

export interface AppPayload {
  name: string;
  description?: string;
  type: number; // app location (0,1,2,3)
  role_id?: number;
  is_active: boolean;
  url?: string;
  storage_service_id?: number;
  storage_container?: string;
  path?: string;
}

export interface EditAppPayload extends AppPayload {
  id: number;
}
