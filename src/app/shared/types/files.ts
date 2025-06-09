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
  config?: any;
  serviceDocByServiceId?: any;
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

export interface ApiDocJson {
  info: {
    description?: string;
    title: string;
    version?: string;
    group: string;
  };
  paths: {
    [endpoint: string]: {
      [method: string]: {
        operationId: string;
        description: string;
        summary: string;
        tags: string[];
        [key: string]: any;
      };
    };
  };
  [key: string]: any;
}
