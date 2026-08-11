import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { createServer } from './server.js';
import { config } from './config/env.js';

import chatRoutes from './routes/chat.routes.js';

async function main() {
    if (process.env.TRANSPORT_MODE === 'stdio' || config.transportMode === 'stdio') {
        // Redirect console.log to console.error so stdout remains 100% clean JSON-RPC for Claude Desktop
        console.log = (...args: any[]) => console.error(...args);
    }

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
        app.use('/', chatRoutes);

        const activeTransports = new Map<string, SSEServerTransport>();
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

        // Rate Limiting Middleware (30 requests/minute per IP to prevent LLM cost explosion & DDoS)
        const apiLimiter = rateLimit({
            windowMs: 60 * 1000,
            max: 30,
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                success: false,
                error: 'Too many tool execution requests from this IP. Please try again after 1 minute.',
            },
        });

        app.use('/api/', apiLimiter);

        // ChatGPT Action route handler for MCP merchant tools
        app.post('/api/tools/:toolName', async (req: Request, res: Response) => {
            const { toolName } = req.params;
            const { ecomClient } = await import('./services/ecomClient.js');

            // Header Forwarding for Token Auth & Tenant Privacy
            ecomClient.setAuthHeader({
                authorization: req.headers.authorization as string,
                'x-user-id': req.headers['x-user-id'] as string,
            });

            // Validate Tool Authentication Requirements
            const authCheck = ecomClient.validateToolAuth(toolName, req.headers as Record<string, string>);
            if (!authCheck.authorized) {
                return res.status(401).json(authCheck.response);
            }

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
                        result = await ecomClient.trackCustomerOrder(req.body.orderId || req.body.orderIdOrUserId || req.body.userId || req.body.id);
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
                    case 'run_merchant_workflow':
                        const { agentGraph } = await import('./agent/graph.js');
                        const { HumanMessage } = await import('@langchain/core/messages');
                        const threadId = req.body.threadId || `merchant-thread-${Date.now()}`;
                        const workflowInputs: any = {
                            messages: req.body.instruction ? [new HumanMessage({ content: req.body.instruction })] : [],
                            userId: req.headers['x-user-id'] || 'merchant_42',
                            authToken: req.headers.authorization || 'Bearer merch_42_admin',
                        };
                        if (req.body.approvalStatus) workflowInputs.approvalStatus = req.body.approvalStatus;
                        const workflowState = await agentGraph.invoke(workflowInputs, { configurable: { thread_id: threadId } });
                        const lastMsgNode = workflowState.messages[workflowState.messages.length - 1];
                        result = {
                            status: workflowState.approvalRequired ? 'approval_required' : 'success',
                            thread_id: threadId,
                            intent_routed: workflowState.intent,
                            reply: typeof lastMsgNode?.content === 'string' ? lastMsgNode.content : JSON.stringify(lastMsgNode?.content),
                            order_result: workflowState.orderResult || null,
                        };
                        break;
                    case 'customer_login':
                        result = await ecomClient.customerLogin(req.body);
                        break;
                    case 'get_user_profile':
                        result = await ecomClient.getUserProfile();
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
            res.setHeader('X-Accel-Buffering', 'no');
            const connectionServer = createServer();
            const sseTransport = new SSEServerTransport('/messages', res);
            const sessionId = sseTransport.sessionId;
            activeTransports.set(sessionId, sseTransport);

            res.on('close', () => {
                console.log(`🔌 SSE connection closed (Session: ${sessionId}).`);
                activeTransports.delete(sessionId);
            });

            await connectionServer.connect(sseTransport);
        });

        const handleMessages = async (req: Request, res: Response) => {
            if (!req.headers['content-type']) {
                req.headers['content-type'] = 'application/json';
            }

            const sessionId = (req.query.sessionId || req.body?.sessionId) as string;
            let transport = activeTransports.get(sessionId);

            if (!transport && activeTransports.size === 1) {
                transport = Array.from(activeTransports.values())[0];
            }

            if (!transport) {
                return res.status(404).json({ error: 'No active SSE connection found or session expired' });
            }

            try {
                // Pass req.body as 3rd parameter because express.json() consumed the request stream
                await transport.handlePostMessage(req, res, req.body);
            } catch (err: any) {
                console.error('Error in handlePostMessage:', err.message);
                if (!res.headersSent) {
                    res.status(400).json({ error: err.message });
                }
            }
        };

        app.post('/messages', handleMessages);
        app.post('/sse', handleMessages);

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
