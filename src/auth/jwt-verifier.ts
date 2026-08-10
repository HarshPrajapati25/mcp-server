import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthContext } from './auth-context.js';

export interface DecodedJwtPayload {
  id?: string | number;
  sub?: string | number;
  user_id?: string | number;
  userId?: string | number;
  role?: string;
  roles?: string[];
  [key: string]: any;
}

export function verifyJwtToken(token: string): AuthContext {
  if (!token) {
    throw new Error('AUTHENTICATION_REQUIRED: Bearer token missing');
  }

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const secret = process.env.JWT_SECRET || 'shoppingate-default-secret-key';

  try {
    const decoded = jwt.verify(cleanToken, secret) as DecodedJwtPayload;
    const userId = decoded.id ?? decoded.sub ?? decoded.user_id ?? decoded.userId;

    if (!userId) {
      throw new Error('INVALID_TOKEN_PAYLOAD: JWT missing user identity claim');
    }

    const roles = decoded.roles || (decoded.role ? [decoded.role] : []);

    return {
      userId,
      roles,
      token: cleanToken
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('AUTHENTICATION_EXPIRED: Token has expired');
    }
    if (err.message?.startsWith('INVALID_TOKEN_PAYLOAD')) {
      throw err;
    }
    throw new Error('AUTHENTICATION_FAILED: Invalid JWT signature or malformed token');
  }
}
