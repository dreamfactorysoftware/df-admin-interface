export interface Files {
  services: Service[];
  serviceTypes: ServiceType[];
}

export interface ServiceType {
  name: string;
  label: string;
  group: Group;
  description: string;
}

export enum Group {
  File = 'File',
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
  type: 'folder' | 'file';
}

export interface FileResponse {
  path: string;
  content_type?: string;
  last_modified?: string;
  content_length?: number;
  name: string;
  type: string;
}
