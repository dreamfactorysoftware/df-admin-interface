export interface AppRow {
  id: number;
  name: string;
  role: string;
  apiKey: string;
  description?: string;
  active: boolean;
}

export interface RoleByRoleId {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
}

export interface AppType {
  id: number;
  name: string;
  apiKey: string;
  description: string;
  isActive: boolean;
  type: number;
  path: string | null;
  url: string | null;
  storageServiceId: number | null;
  storageContainer: string | null;
  requiresFullscreen: boolean;
  allowFullscreenToggle: boolean;
  toggleLocation: string;
  roleId: number | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  launchUrl: string;
  roleByRoleId: RoleByRoleId | null;
}

export interface NewAppType {
  name: string;
  description: string;
  type: number;
  roleId: number | null;
  isActive: boolean;
  url: string | undefined;
}
