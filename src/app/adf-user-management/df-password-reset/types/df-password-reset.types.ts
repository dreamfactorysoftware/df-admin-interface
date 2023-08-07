export interface Options {
  showTemplate: boolean;
  login: boolean;
}

export interface ResetFormData {
  email: string;
  username: string;
  code: string;
  new_password: string;
}

export interface UserParams {
  admin: string;
  code: string;
  email: string;
  username: string;
}
