// TODO fix all any types
export interface TableDetailsType {
  alias?: string;
  name: string;
  label: string;
  description: string;
  native: any[];
  plural: string;
  isView: boolean;
  primaryKey: string[];
  nameField?: string;
  field: TableField[];
  related: TableRelated[];
  constraints: any;
  access: number;
}

export interface TableField {
  alias?: string;
  name: string;
  label: string;
  description?: string;
  native: any[];
  type: string;
  dbType: string;
  length?: number;
  precision?: any;
  scale?: any;
  default?: any;
  required: boolean;
  allowNull?: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  autoIncrement: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isForeignKey: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate?: any;
  refOnDelete?: any;
  picklist?: string[];
  validation?: Validation;
  dbFunction?: any;
  isVirtual: boolean;
  isAggregate: boolean;
}

interface Validation {
  notEmpty?: Email;
  picklist?: Email;
  email?: Email;
}

interface Email {
  onFail: string;
}

export interface TableRelated {
  alias?: string;
  name: string;
  label: string;
  description?: string;
  native: any[];
  type: string;
  field: string;
  isVirtual: boolean;
  refServiceID: number;
  refTable: string;
  refField: string;
  refOnUpdate: string;
  refOnDelete: string;
  junctionServiceID?: number;
  junctionTable?: any;
  junctionField?: any;
  junctionRefField?: any;
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
}

export interface FieldsRow {
  name: string;
  alias: string;
  type: string;
  isVirtual: boolean;
  isAggregate: boolean;
  required: boolean;
  constraints: string;
}

export interface RelationshipsRow {
  name: string;
  alias: string;
  type: string;
  isVirtual: boolean;
}

export interface TableRow {
  id: string;
  label: string;
  name: string;
}
