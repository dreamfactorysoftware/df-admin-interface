import { GenericSuccessResponse } from '../shared/types/generic-http.type';

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  service?: string;
}

export interface RegisterDetails {
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
}

export interface ResetFormData {
  email: string;
  username: string;
  code: string;
  newPassword: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse extends GenericSuccessResponse {
  sessionToken: string;
}

export interface UserParams {
  admin: string;
  code: string;
  email: string;
  username: string;
}

export interface ForgetPasswordRequest {
  username?: string;
  email?: string;
}

export interface SecurityQuestion {
  securityQuestion: string;
}
