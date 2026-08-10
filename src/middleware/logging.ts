import { Request, Response, NextFunction } from 'express';

export type LogCategory = 'info' | 'warn' | 'error' | 'tool' | 'auth' | 'http';

export function logger(message: string, category: LogCategory = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category.toUpperCase()}]`;
  
  if (category === 'error') {
    console.error(`${prefix} ${message}`);
  } else if (category === 'warn') {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function requestLoggerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  logger(`${req.method} ${req.originalUrl}`, 'http');
  next();
}
