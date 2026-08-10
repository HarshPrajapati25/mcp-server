export interface AuthContext {
  userId: string | number;
  roles?: string[];
  token: string;
}

export interface AuthenticatedRequest extends Express.Request {
  authContext?: AuthContext;
}
