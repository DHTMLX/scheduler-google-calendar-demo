import { Request } from "express";

export interface AppConfig {
  PORT: number;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  SESSION_SECRET?: string;
}

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  displayName: string;
  tokens: GoogleOAuthTokens;
}

export interface AuthenticatedRequest extends Request {
  user: { tokens: GoogleOAuthTokens };
}
