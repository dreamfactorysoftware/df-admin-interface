export interface ScriptDetailsType {
  [serviceName: string]: any;
}

export interface ScriptType {
  name: string;
  label: string;
  description: string;
  sandboxed: boolean;
  supportsInlineExecution: boolean;
}

export interface ScriptObject {
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  allowEventModification: boolean;
  storageServiceId: number | null;
  scmRepository: any | null; // TODO: update these any types to an appropriate type
  scmReference: any | null;
  storagePath: any | null;
}
