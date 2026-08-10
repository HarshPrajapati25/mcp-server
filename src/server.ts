import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMerchantTools } from './tools/merchantTools.js';
import { registerCustomerTools } from './tools/customerTools.js';
import { registerMerchantResources } from './resources/merchantResources.js';
import { registerMerchantPrompts } from './prompts/merchantPrompts.js';

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'Shoppingate-MCP-Server',
        version: '1.0.0',
    });

    // Register Merchant & Customer Tools, Resources, and Prompts
    registerMerchantTools(server);
    registerCustomerTools(server);
    registerMerchantResources(server);
    registerMerchantPrompts(server);

    return server;
}
