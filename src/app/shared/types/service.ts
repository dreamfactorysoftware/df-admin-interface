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
  /** Present only when the source service carries an explicit deprecated flag. */
  deprecated?: boolean;
  /** Derived client-side (no backend field); see DfServiceHealthService. */
  health?: ServiceHealth;
}

export type ServiceHealthLevel = 'success' | 'warning' | 'danger';

/**
 * One failing governance signal for a service. `id` keys the consequence copy
 * under `services.health.rules.*`; `fix` is a routerLink to the config that
 * clears it (omitted when there is no safe destination, never fabricated).
 */
export interface ServiceHealthRule {
  id: 'noAccess' | 'noRateLimit' | 'noDocs' | 'deprecated';
  level: 'warning' | 'danger';
  fix?: Array<string | number>;
}

/** Rollup of the failing rules. `rules` empty means every checked signal passed. */
export interface ServiceHealth {
  level: ServiceHealthLevel;
  rules: ServiceHealthRule[];
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
