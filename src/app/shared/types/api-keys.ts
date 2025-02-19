export interface ApiKeyInfo {
  name: string;
  apiKey: string;
}

export interface ServiceApiKeys {
  serviceId: number;
  keys: ApiKeyInfo[];
}
