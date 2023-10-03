export interface LookupKeyType {
  id?: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}
