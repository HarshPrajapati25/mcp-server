import { z } from 'zod';
import { AuthContext } from '../auth/auth-context.js';

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  requiresAuth: boolean;
  downstreamServices?: string[];
  execute: (args: TInput, context?: AuthContext) => Promise<TOutput>;
}
