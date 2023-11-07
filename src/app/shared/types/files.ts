export interface Files {
  services: Service[];
  serviceTypes: ServiceType[];
}

interface ServiceType {
  name: string;
  label: string;
  group: string;
  description: string;
}

export interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
}

export interface FileTableRow {
  path: string;
  name: string;
  type: EntityType;
  contentType: string;
  lastModified?: string;
}
export interface FileType {
  path: string;
  lastModified?: string;
  name: string;
  type: EntityType;
  contentType: string;
}

type EntityType = 'file' | 'folder';
