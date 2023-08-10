export interface ResetFormData {
  email: string;
  username: string;
  code: string;
  newPassword: string;
  securityQuestion?: string;
  securityAnswer?: string;
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
