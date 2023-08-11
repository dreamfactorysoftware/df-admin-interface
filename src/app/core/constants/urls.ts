export const BASE_URL = '/api/v2';

export enum URLS {
  SYSTEM = `${BASE_URL}/system`,
  ENVIRONMENT = `${BASE_URL}/system/environment`,
  USER_SESSION = `${BASE_URL}/user/session`,
  ADMIN_SESSION = `${BASE_URL}/system/admin/session`,
  USER_PASSWORD = `${BASE_URL}/user/password`,
  ADMIN_PASSWORD = `${BASE_URL}/system/admin/password`,
  SYSTEM_SERVICE = `${BASE_URL}/system/service?include_count=true&limit=100&related=service_doc_by_service_id`,
}
