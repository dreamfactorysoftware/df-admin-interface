export const BASE_URL = '/api/v2';

export enum URLS {
  SYSTEM = `${BASE_URL}/system`,
  ENVIRONMENT = `${BASE_URL}/system/environment`,
  USER_SESSION = `${BASE_URL}/user/session`,
  ADMIN_SESSION = `${BASE_URL}/system/admin/session`,
  USER_PASSWORD = `${BASE_URL}/user/password`,
  ADMIN_PASSWORD = `${BASE_URL}/system/admin/password`,
  REGISTER = `${BASE_URL}/user/register`,
  ADMIN_PROFILE = `${BASE_URL}/system/admin/profile`,
  USER_PROFILE = `${BASE_URL}/user/profile`,
}
