import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from './server.js';
import { config } from './config/env.js';

async function main() {
    const server = createServer();

    if (config.transportMode === 'stdio') {
        // Mode 1: Stdio Transport for Claude Desktop / CLI LLM integration
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('🚀 Shoppingate MCP Server started in STDIO mode.');
    } else {
        // Mode 2: SSE Transport & OpenAPI Server for ChatGPT / Claude.ai / AI Gateway
        const app = express();
        app.use(cors());
        app.use(express.json());

        let sseTransport: SSEServerTransport | null = null;
        const publicPath = path.resolve(process.cwd(), 'public/index.html');

        app.get('/', (_req: Request, res: Response) => {
            res.sendFile(publicPath);
        });

        app.get('/health-check', (_req: Request, res: Response) => {
            res.json({
                status: 'healthy',
                service: 'shoppingate-mcp-server',
                version: '1.0.0',
                transportMode: 'sse',
                ecomTarget: config.ecomServiceUrl,
                timestamp: new Date().toISOString(),
            });
        });

        app.get('/openapi.json', (_req: Request, res: Response) => {
            const openapiPath = path.resolve(process.cwd(), 'chatgpt_openapi.json');
            res.sendFile(openapiPath);
        });

        // ChatGPT Action route handler for MCP merchant tools
        app.post('/api/tools/:toolName', async (req: Request, res: Response) => {
            const { toolName } = req.params;
            const { ecomClient } = await import('./services/ecomClient.js');

            try {
                let result: any = null;
                switch (toolName) {
                    case 'search_products':
                    case 'customer_search_products':
                        result = await ecomClient.searchProducts(req.body);
                        break;
                    case 'get_product_details':
                        result = await ecomClient.getProductDetail(req.body.productId, req.body.lang);
                        break;
                    case 'get_similar_products':
                        result = await ecomClient.getSimilarProducts(req.body.productId, req.body.limit, req.body.lang);
                        break;
                    case 'get_recommendations':
                        result = await ecomClient.getHomeRecommendations(req.body.userId, req.body.lang);
                        break;
                    case 'track_customer_order':
                        result = await ecomClient.trackCustomerOrder(req.body.orderId);
                        break;
                    case 'update_product_stock':
                        result = await ecomClient.updateProductStock(req.body.productId, req.body.stock, req.body.inStock);
                        break;
                    case 'list_merchant_orders':
                        result = await ecomClient.listOrders(req.body);
                        break;
                    case 'get_order_details':
                        result = await ecomClient.getOrderDetail(req.body.orderId);
                        break;
                    case 'update_order_status':
                        result = await ecomClient.updateOrderStatus(req.body.orderId, req.body.status, req.body.notes);
                        break;
                    case 'list_promotions':
                        result = await ecomClient.listPromotions(req.body);
                        break;
                    case 'create_coupon':
                        result = await ecomClient.createCoupon(req.body);
                        break;
                    case 'delete_promotion_coupon':
                        result = await ecomClient.deleteCoupon(req.body.couponCodeOrId || req.body.code || req.body.id);
                        break;
                    default:
                        return res.status(404).json({ error: `Tool '${toolName}' not found` });
                }

                res.json({ success: true, data: result });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        app.get('/sse', async (req: Request, res: Response) => {
            console.log('🔌 New SSE connection established.');
            const connectionServer = createServer();
            sseTransport = new SSEServerTransport('/messages', res);
            await connectionServer.connect(sseTransport);
        });

        app.post('/messages', async (req: Request, res: Response) => {
            if (sseTransport) {
                await sseTransport.handlePostMessage(req, res);
            } else {
                res.status(400).json({ error: 'No active SSE connection found' });
            }
        });

        app.listen(config.port, () => {
            console.log(`🚀 Shoppingate MCP Server listening on http://localhost:${config.port}`);
            console.log(`   └─ OpenAPI Schema: http://localhost:${config.port}/openapi.json`);
            console.log(`   └─ SSE Endpoint: http://localhost:${config.port}/sse`);
            console.log(`   └─ Messages Endpoint: http://localhost:${config.port}/messages`);
            console.log(`   └─ Health Check: http://localhost:${config.port}/health-check`);
        });
    }
}

main().catch((error) => {
    console.error('Fatal error in MCP Server:', error);
    process.exit(1);
});
