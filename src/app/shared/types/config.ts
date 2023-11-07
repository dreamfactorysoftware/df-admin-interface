export interface CorsConfigData {
  createdById: number | null;
  createdDate: string | null;
  description: string;
  enabled: boolean;
  exposedHeader: string | null;
  header: string;
  id: number;
  lastModifiedById: number | null;
  lastModifiedDate: string | null;
  maxAge: number;
  method: string[];
  origin: string;
  path: string;
  supportsCredentials: boolean;
}
