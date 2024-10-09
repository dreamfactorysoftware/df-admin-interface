export interface LoginResponse {
  session_token?: string;
  sessionToken?: string;
  // Add other properties that are returned by your login API
  [key: string]: any; // This allows for additional properties
}
