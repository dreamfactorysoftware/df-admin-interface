export type DatabaseSchemaFieldType = {
  alias: string | null;
  allowNull: boolean;
  autoIncrement: boolean;
  dbFunction: DbFunctionUseType[] | null;
  dbType: string | null;
  description: string | null;
  default: string | null;
  fixedLength: boolean;
  isAggregate: boolean;
  isForeignKey: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isVirtual: boolean;
  label: string;
  length: number | null;
  name: string;
  native: [] | null;
  picklist: string | null;
  precision: number | null;
  refField: string | null;
  refTable: string | null;
  refOnDelete: string | null;
  refOnUpdate: string | null;
  required: boolean;
  scale: number;
  supportsMultibyte: boolean;
  type: string;
  // A rules object; older UI builds saved the raw text wrapped as ["{...}"].
  validation: Record<string, unknown> | string[] | null;
  value: [];
};

type DbFunctionUseType = { use: string[]; function: string };
