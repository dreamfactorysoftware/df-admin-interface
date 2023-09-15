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
  contentType: string;
  lastModified?: string;
}

export interface FileResponse {
  path: string;
  contentType?: string;
  lastModified?: string;
  contentLength?: number;
  name: string;
  type: string;
}
