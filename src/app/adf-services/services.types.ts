export interface ServiceType {
  dependenciesRequired: null;
  description: string;
  group: string;
  label: string;
  name: string;
  serviceDefinitionEditable: boolean;
  singleton: boolean;
  subscriptionRequired: string;
  configSchema: any[];
}

export interface SystemServiceData {
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
  createdById: number | null;
  lastModifiedById: number | null;
  config: any;
  serviceDocByServiceId: number | null;
}
