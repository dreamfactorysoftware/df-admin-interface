export interface ServerSetting {
  name: string;
  label: string;
  value: string;
  envValue: string;
  source: 'env' | 'override';
  allowedValues: string[];
}
