export interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  body_text?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
  defaults?: any;
  created_date: string;
  last_modified_date: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

export interface EmailTemplateRow {
  id: number;
  name: string;
  description?: string;
}

export interface EmailTemplatePayload {
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
}
