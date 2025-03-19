export interface ServiceType {
  name: string;
  label: string;
  description: string;
  group: string;
  class?: string;
  configSchema: Array<ConfigSchema>;
}

export interface ConfigSchema {
  name: string;
  label: string;
  type:
    | 'string'
    | 'text'
    | 'integer'
    | 'password'
    | 'boolean'
    | 'object'
    | 'array'
    | 'picklist'
    | 'multi_picklist'
    | 'file_certificate'
    | 'file_certificate_api'
    | 'verb_mask'
    | 'event_picklist';
  description?: string;
  alias: string;
  native?: any[];
  length?: number;
  precision: number;
  scale: any;
  default: any;
  required?: boolean;
  allowNull?: boolean;
  fixedLength?: boolean;
  supportsMultibyte?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate: any;
  refOnDelete: any;
  picklist: any;
  validation: any;
  dbFunction: any;
  isVirtual?: boolean;
  isAggregate?: boolean;
  object?: {
    key: LabelType;
    value: LabelType;
  };
  items: Array<ConfigSchema> | 'string';
  values?: any[];
  dbType?: string;
  autoIncrement?: boolean;
  isIndex?: boolean;
  columns?: number;
  legend?: string;
}

interface LabelType {
  label: string;
  type: string;
}

export interface Service {
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
  refresh: boolean;
}

export interface ServiceRow {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  scripting: string;
  active: boolean;
  deletable: boolean;
}

export interface LdapService {
  name: string;
  label: string;
}

export interface AuthService {
  iconClass: string;
  label: string;
  name: string;
  type: string;
  path: string;
}
