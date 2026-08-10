import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolDefinition } from './tool-types.js';
import { AuthContext } from '../auth/auth-context.js';
import { logger } from '../middleware/logging.js';

export type ToolChangeListener = () => void;

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  private changeListeners: ToolChangeListener[] = [];

  /** Subscribe to tool list changes (used by MCP server to call sendToolListChanged) */
  onToolsChanged(listener: ToolChangeListener): void {
    this.changeListeners.push(listener);
  }

  /** Notify all listeners that the tool list has changed */
  private notifyChange(): void {
    logger(`Tool list changed — notifying ${this.changeListeners.length} listener(s)`, 'tool');
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (err: any) {
        logger(`Error in tool change listener: ${err.message}`, 'error');
      }
    }
  }

  registerTool(tool: ToolDefinition, notify = false): void {
    this.tools.set(tool.name, tool);
    logger(`Registered tool in ToolRegistry: ${tool.name}`, 'tool');
    if (notify) {
      this.notifyChange();
    }
  }

  /** Remove a tool by name and notify Claude to refresh */
  removeTool(name: string): boolean {
    const existed = this.tools.delete(name);
    if (existed) {
      logger(`Removed tool: ${name}`, 'tool');
      this.notifyChange();
    }
    return existed;
  }

  /** Update an existing tool definition and notify Claude to refresh */
  updateTool(tool: ToolDefinition): void {
    const existed = this.tools.has(tool.name);
    this.tools.set(tool.name, tool);
    logger(`${existed ? 'Updated' : 'Added'} tool: ${tool.name}`, 'tool');
    this.notifyChange();
  }

  /** Add a new tool at runtime and notify Claude to refresh */
  addToolLive(tool: ToolDefinition): void {
    this.registerTool(tool, true);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolCount(): number {
    return this.tools.size;
  }

  async executeTool(name: string, rawArgs: any, context?: AuthContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`NOT_FOUND: Tool "${name}" is not registered in MCP Tool Registry`);
    }

    if (tool.requiresAuth) {
      if (!context || !context.userId) {
        throw new Error(`AUTHENTICATION_REQUIRED: Tool "${name}" requires an authenticated user JWT`);
      }
    }

    // Validate inputs via Zod schema
    const parseResult = tool.schema.safeParse(rawArgs);
    if (!parseResult.success) {
      logger(`Validation failed for tool ${name}: ${JSON.stringify(parseResult.error.format())}`, 'error');
      throw new Error(`INVALID_TOOL_ARGUMENTS: ${parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    // SECURITY: Filter out any attempts by the LLM to pass user_id/userId override
    const validatedArgs = { ...parseResult.data };
    delete (validatedArgs as any).user_id;
    delete (validatedArgs as any).userId;
    delete (validatedArgs as any).customer_id;
    delete (validatedArgs as any).customerId;

    logger(`Executing tool "${name}" with validated args ${JSON.stringify(validatedArgs)}`, 'tool');
    return tool.execute(validatedArgs, context);
  }

  toLangChainTools(context?: AuthContext): DynamicStructuredTool[] {
    return this.getAllTools().map((tool) => {
      return new DynamicStructuredTool({
        name: tool.name,
        description: tool.description,
        schema: tool.schema as any,
        func: async (args: any) => {
          try {
            const result = await this.executeTool(tool.name, args, context);
            return typeof result === 'string' ? result : JSON.stringify(result);
          } catch (err: any) {
            return JSON.stringify({ error: err.message });
          }
        }
      });
    });
  }
}

export const toolRegistry = new ToolRegistry();
