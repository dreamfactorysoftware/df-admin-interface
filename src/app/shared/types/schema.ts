export type DatabaseRowData = {
  id: number;
  description: string;
  label: string;
  name: string;
  type: string;
};

export type DatabaseTableRowData = {
  name: string;
  label: string;
  id: string;
};

export type TableRelatedType = {
  alias: string;
  name?: string;
  label?: string;
  description?: string;
  native?: any[];
  type: 'belongs_to' | 'has_many' | 'has_one' | 'many_many';
  field: string;
  isVirtual: boolean;
  refServiceId: number;
  refTable: string;
  refField: string;
  refOnUpdate?: any;
  refOnDelete?: any;
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
};
