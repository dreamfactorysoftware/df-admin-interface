export const BASE_URL = '/api/v2';

export enum URLS {
  GITHUB_REPO = 'https://api.github.com/repos',
  SYSTEM = `${BASE_URL}/system`,
  ENVIRONMENT = `${BASE_URL}/system/environment`,
  USER_SESSION = `${BASE_URL}/user/session`,
  ADMIN_SESSION = `${BASE_URL}/system/admin/session`,
  USER_PASSWORD = `${BASE_URL}/user/password`,
  ADMIN_PASSWORD = `${BASE_URL}/system/admin/password`,
  REGISTER = `${BASE_URL}/user/register`,
  APP = `${BASE_URL}/system/app`,
  API_DOCS = `${BASE_URL}/api_docs`,
  ADMIN_PROFILE = `${BASE_URL}/system/admin/profile`,
  USER_PROFILE = `${BASE_URL}/user/profile`,
  SYSTEM_ADMIN = `${BASE_URL}/system/admin`,
  ROLES = `${BASE_URL}/system/role`,
  LIMITS = `${BASE_URL}/system/limit`,
  LIMIT_CACHE = `${BASE_URL}/system/limit_cache`,
  SYSTEM_SERVICE = `${BASE_URL}/system/service`,
  SERVICE_TYPE = `${BASE_URL}/system/service_type`,
  SYSTEM_USER = `${BASE_URL}/system/user`,
  SERVICE_REPORT = `${BASE_URL}/system/service_report`,
  SYSTEM_CORS = `${BASE_URL}/system/cors`,
  SYSTEM_EVENT = `${BASE_URL}/system/event`,
  EVENT_SCRIPT = `${BASE_URL}/system/event_script`,
  SCRIPT_TYPE = `${BASE_URL}/system/script_type`,
  SCHEDULER = `${BASE_URL}/system/scheduler`,
  SYSTEM_CACHE = `${BASE_URL}/system/cache`,
  EMAIL_TEMPLATES = `${BASE_URL}/system/email_template`,
  LOOKUP_KEYS = `${BASE_URL}/system/lookup`,
  FILES = `${BASE_URL}/files`,
  LOGS = `${BASE_URL}/logs`,
}
