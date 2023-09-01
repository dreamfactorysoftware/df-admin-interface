export const BASE_URL = '/api/v2';

export enum URLS {
  SYSTEM = `${BASE_URL}/system`,
  ENVIRONMENT = `${BASE_URL}/system/environment`,
  USER_SESSION = `${BASE_URL}/user/session`,
  ADMIN_SESSION = `${BASE_URL}/system/admin/session`,
  USER_PASSWORD = `${BASE_URL}/user/password`,
  ADMIN_PASSWORD = `${BASE_URL}/system/admin/password`,
  REGISTER = `${BASE_URL}/user/register`,
  APP = `${BASE_URL}/system/app`,
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
  SYSTEM_CACHE = `${BASE_URL}/system/cache`,
}
