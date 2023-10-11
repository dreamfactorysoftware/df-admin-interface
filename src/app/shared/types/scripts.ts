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
  storageServiceId?: number;
  scmRepository?: string;
  scmReference?: string;
  storagePath?: string;
  config?: any;
  createdById?: number;
  createdDate?: string;
  lastModifiedById?: number;
  lastModifiedDate?: string;
}

// additonal note: this object appears in snake case
export interface GithubFileObject {
  content: string;
  download_url: string;
  encoding: string;
  git_url: string;
  html_url: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  _links: { self: string; git: string; html: string };
}

export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python',
  JAVASCRIPT = 'javascript',
}

export interface ScriptEvent {
  name: string;
  endpoints: Array<string>;
}

export interface ScriptEventResponse {
  [key: string]: {
    [key: string]: {
      type: string;
      endpoints: Array<string>;
      parameter?: { [key: string]: Array<string> };
    };
  };
}
