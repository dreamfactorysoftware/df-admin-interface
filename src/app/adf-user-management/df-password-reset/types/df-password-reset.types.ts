export interface ResetFormData {
  email: string;
  username: string;
  code: string;
  newPassword: string;
}

export interface UserParams {
  admin: string;
  code: string;
  email: string;
  username: string;
}
