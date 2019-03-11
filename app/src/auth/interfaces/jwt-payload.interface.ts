export interface JwtPayload {
  email: string;
  isAdmin: boolean;
}

export interface LoginResult {
  email: string;
  token: string;
}