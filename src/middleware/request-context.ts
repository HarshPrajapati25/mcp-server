import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../auth/jwt-verifier.js';
import { logger } from './logging.js';

export function extractAuthContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const authCtx = verifyJwtToken(authHeader);
      (req as any).authContext = authCtx;
      logger(`Authenticated user: ${authCtx.userId}`, 'auth');
    } catch (err: any) {
      logger(`Auth context extraction skipped/failed: ${err.message}`, 'warn');
    }
  }
  next();
}

export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      status: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authorization Bearer header is required'
      }
    });
  }

  try {
    const authCtx = verifyJwtToken(authHeader);
    (req as any).authContext = authCtx;
    next();
  } catch (err: any) {
    return res.status(401).json({
      status: false,
      error: {
        code: err.message?.startsWith('AUTHENTICATION') ? err.message.split(':')[0] : 'AUTHENTICATION_FAILED',
        message: err.message
      }
    });
  }
}
