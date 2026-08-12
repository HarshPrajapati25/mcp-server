import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HumanMessage } from '@langchain/core/messages';
import { ecomClient } from '../services/ecomClient.js';
import { toolRegistry } from '../registry/tool-registry.js';
import { agentGraph } from '../agent/graph.js';

export function registerMerchantTools(server: McpServer) {
    toolRegistry.registerTool({
        name: 'search_products',
        description: 'Search the Shoppingate product catalog with keywords, category filters, and price ranges.',
        schema: z.object({
            query: z.string().optional(),
            page: z.number().int().optional(),
            limit: z.number().int().optional(),
            categoryId: z.number().int().optional(),
            minPrice: z.number().optional(),
            maxPrice: z.number().optional(),
            lang: z.enum(['en', 'ar']).optional(),
        }),
        requiresAuth: false,
        execute: async (args) => ecomClient.searchProducts(args),
    });
    /**
     * Tool 1: search_products
     * Search product catalog with keyword, category, brand, and price range filters
     */
    server.tool(
        'search_products',
        'Search the Shoppingate product catalog with keywords, category filters, and price ranges.',
        {
            query: z.string().optional().describe('Keyword or title search query'),
            page: z.number().int().min(1).default(1).describe('Page number for pagination'),
            limit: z.number().int().min(1).max(50).default(10).describe('Number of items per page'),
            categoryId: z.number().int().optional().describe('Filter by category ID'),
            minPrice: z.number().min(0).optional().describe('Minimum price threshold in SAR'),
            maxPrice: z.number().min(0).optional().describe('Maximum price threshold in SAR'),
            lang: z.enum(['en', 'ar']).default('en').describe('Preferred response language (en or ar)'),
        },
        async (args) => {
            try {
                const data = await ecomClient.searchProducts(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error searching products: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 2: get_product_details
     * Fetch complete details for a product by ID
     */
    server.tool(
        'get_product_details',
        'Get full product details including images, inventory stock, brand, category, and pricing.',
        {
            productId: z.union([z.number(), z.string()]).describe('Numeric ID of the product (e.g. 1, 234538) or Product Title (e.g. "Running Sports Shoes")'),
            lang: z.enum(['en', 'ar']).default('en').describe('Language for product names and descriptions'),
        },
        async (args) => {
            try {
                const data = await ecomClient.getProductDetail(args.productId, args.lang);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error fetching product detail: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 3: update_product_stock
     * Update inventory quantity and stock status for a product
     */
    server.tool(
        'update_product_stock',
        'Update inventory stock level or availability status for a merchant product.',
        {
            productId: z.number().int().positive().describe('Numeric ID of the product'),
            stock: z.number().int().min(0).describe('New stock quantity available'),
            inStock: z.boolean().optional().describe('Explicit flag indicating if product is in stock'),
        },
        async (args) => {
            try {
                const result = await ecomClient.updateProductStock(args.productId, args.stock, args.inStock);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error updating product stock: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 4: list_merchant_orders
     * List customer orders with status or date filtering
     */
    server.tool(
        'list_merchant_orders',
        'List merchant store orders with optional status, date range, or search filtering.',
        {
            page: z.number().int().min(1).default(1).describe('Page number'),
            limit: z.number().int().min(1).max(50).default(10).describe('Number of orders per page'),
            status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional().describe('Order status filter'),
            search: z.string().optional().describe('Search query (order ID, customer name, email)'),
            fromDate: z.string().optional().describe('Filter orders starting from date (YYYY-MM-DD)'),
            toDate: z.string().optional().describe('Filter orders up to date (YYYY-MM-DD)'),
        },
        async (args) => {
            const authCheck = ecomClient.validateToolAuth('list_merchant_orders');
            if (!authCheck.authorized) {
                return { content: [{ type: 'text', text: JSON.stringify(authCheck.response, null, 2) }] };
            }
            try {
                const data = await ecomClient.listOrders(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error listing orders: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 5: get_order_details
     * Fetch complete order information including customer info and line items
     */
    server.tool(
        'get_order_details',
        'Fetch full order details including line items, prices, shipping address, and payment status.',
        {
            orderId: z.union([z.number().int().positive(), z.string()]).describe('Order ID or order number'),
        },
        async (args) => {
            try {
                const data = await ecomClient.getOrderDetail(args.orderId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error fetching order details: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 6: update_order_status
     * Update order fulfillment status
     */
    server.tool(
        'update_order_status',
        'Update order status (e.g., mark as processing, shipped, delivered, or cancelled).',
        {
            orderId: z.union([z.number().int().positive(), z.string()]).describe('Order ID'),
            status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).describe('New order status'),
            notes: z.string().optional().describe('Optional internal note or shipping tracking number'),
        },
        async (args) => {
            try {
                const result = await ecomClient.updateOrderStatus(args.orderId, args.status, args.notes);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error updating order status: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 7: list_promotions
     * List active promotional deals and store discounts
     */
    server.tool(
        'list_promotions',
        'List active promotions, deals, and discount coupons available in the store.',
        {
            page: z.number().int().min(1).default(1),
            limit: z.number().int().min(1).max(50).default(10),
        },
        async (args) => {
            try {
                const data = await ecomClient.listPromotions(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error listing promotions: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 8: create_coupon
     * Create a promotional coupon code for marketing campaigns
     */
    server.tool(
        'create_coupon',
        'Create a new promotional discount coupon code for store customers.',
        {
            code: z.string().min(3).max(30).describe('Coupon code (e.g. SUMMER20, WELCOME100)'),
            discountType: z.enum(['percentage', 'fixed']).describe('Discount type: percentage off or fixed SAR amount'),
            discountValue: z.number().positive().describe('Discount value (e.g. 15 for 15% or 50 for 50 SAR)'),
            minOrderAmount: z.number().min(0).optional().describe('Minimum required order total to use coupon'),
            maxDiscountAmount: z.number().positive().optional().describe('Maximum cap on discount amount for percentage coupons'),
            startDate: z.string().optional().describe('Coupon valid start date (YYYY-MM-DD)'),
            endDate: z.string().optional().describe('Coupon expiration date (YYYY-MM-DD)'),
            usageLimit: z.number().int().positive().optional().describe('Total usage limit count'),
        },
        async (args) => {
            try {
                const result = await ecomClient.createCoupon(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error creating coupon: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 9: delete_promotion_coupon
     * Delete or deactivate an active store offer, banner deal, or coupon code
     */
    server.tool(
        'delete_promotion_coupon',
        'Delete or deactivate an active store promotion, deal banner, or discount coupon code by ID or code.',
        {
            couponCodeOrId: z.union([z.string(), z.number()]).describe('Coupon code (e.g. SAVE20) or numeric promotion ID'),
        },
        async (args) => {
            try {
                const result = await ecomClient.deleteCoupon(args.couponCodeOrId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error deleting promotion/coupon: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 10: run_merchant_workflow
     * Execute LangGraph state machine autonomous agent workflow for merchant operations
     */
    server.tool(
        'run_merchant_workflow',
        'Execute autonomous LangGraph agent workflow engine for multi-step merchant store operations, inventory routing, and order processing.',
        {
            instruction: z.string().describe('Natural language operational instruction or task for the merchant workflow engine'),
            threadId: z.string().optional().describe('Optional persistent thread ID for stateful agent graph memory'),
            approvalStatus: z.enum(['approved', 'rejected', 'pending']).optional().describe('Approval status for human-in-the-loop checkpoint decisions'),
        },
        async (args) => {
            try {
                const threadId = args.threadId || `merchant-thread-${Date.now()}`;
                const config = { configurable: { thread_id: threadId } };
                const inputs: any = {
                    messages: [new HumanMessage({ content: args.instruction })],
                    userId: process.env.X_USER_ID || 'merchant_42',
                    authToken: process.env.AUTH_TOKEN || 'Bearer merch_42_admin',
                };
                if (args.approvalStatus) {
                    inputs.approvalStatus = args.approvalStatus;
                }

                const finalState = await agentGraph.invoke(inputs, config);
                const lastMsg = finalState.messages[finalState.messages.length - 1];
                const replyText = typeof lastMsg?.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg?.content);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: finalState.approvalRequired ? 'approval_required' : 'success',
                                thread_id: threadId,
                                intent_routed: finalState.intent,
                                reply: replyText,
                                order_result: finalState.orderResult || null,
                                state_summary: {
                                    items_count: finalState.cart?.items?.length || 0,
                                    checkout_summary: finalState.checkoutData || null
                                }
                            }, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error running LangGraph merchant workflow: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 11: merchant_login
     * Authenticate merchant user or get Merchant Portal Login URL (https://microservices.shoppinggate.app/sg-merchant/auth/login)
     */
    server.tool(
        'merchant_login',
        'PRIMARY MERCHANT LOGIN TOOL: Get official Shoppingate Merchant Portal Web Login URL (https://microservices.shoppinggate.app/sg-merchant/auth/login) or authenticate merchant account via email & password/OTP.',
        {
            email: z.string().email().optional().describe('Merchant email address'),
            password: z.string().optional().describe('Merchant password'),
            otp: z.string().optional().describe('Merchant login OTP code'),
        },
        async (args) => {
            try {
                const result = await ecomClient.loginMerchant(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error processing merchant login: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 12: create_product / add_product
     * Create and publish a new product listing to the Shoppingate store catalog
     */
    server.tool(
        'create_product',
        'PRIMARY MERCHANT TOOL: Create and publish a new product listing to the Shoppingate store catalog with name, price, stock, description, SKU, and image URL.',
        {
            name: z.string().describe('Product name / title'),
            price: z.number().positive().describe('Product price in SAR'),
            stock: z.number().int().min(0).default(10).optional().describe('Initial stock quantity'),
            description: z.string().optional().describe('Product description'),
            categoryId: z.number().int().optional().describe('Category ID'),
            brandName: z.string().optional().describe('Brand name'),
            sku: z.string().optional().describe('Merchant SKU code'),
            imageUrl: z.string().url().optional().describe('Main product image URL'),
        },
        async (args) => {
            try {
                const data = await ecomClient.createProduct({
                    name: args.name,
                    price: args.price,
                    stock: args.stock,
                    description: args.description,
                    category_id: args.categoryId,
                    brand_name: args.brandName,
                    merchant_sku: args.sku,
                    image: args.imageUrl
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error creating product: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 13: get_merchant_profile
     * Retrieve logged-in merchant account & store details (Merchant Name, Store Title, Email)
     */
    server.tool(
        'get_merchant_profile',
        'PRIMARY MERCHANT PROFILE TOOL: Get authenticated merchant account and store profile details (Store Name, Merchant Name, Email, Phone, Store ID).',
        {},
        async () => {
            try {
                const data = await ecomClient.getMerchantProfile();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error fetching merchant profile: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 14: update_product
     * Update an existing product listing (name, price, stock, description, SKU, image URL)
     */
    server.tool(
        'update_product',
        'PRIMARY MERCHANT TOOL: Update an existing product listing in the store catalog (change title, price, stock, description, category, SKU, image).',
        {
            productId: z.number().int().positive().describe('Numeric ID of the product to update'),
            name: z.string().optional().describe('New product name / title'),
            price: z.number().positive().optional().describe('New price in SAR'),
            stock: z.number().int().min(0).optional().describe('New inventory stock level'),
            description: z.string().optional().describe('New description'),
            categoryId: z.number().int().optional().describe('Category ID'),
            brandName: z.string().optional().describe('Brand name'),
            sku: z.string().optional().describe('Merchant SKU'),
            imageUrl: z.string().url().optional().describe('New image URL'),
        },
        async (args) => {
            try {
                const data = await ecomClient.updateProduct(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error updating product: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Tool 15: get_merchant_products
     * Get / list all products listed in the merchant store catalog
     */
    server.tool(
        'get_merchant_products',
        'PRIMARY MERCHANT TOOL: Fetch and list all products catalog items for the merchant store with search, category, and pagination filters.',
        {
            page: z.number().int().min(1).default(1).optional().describe('Page number'),
            limit: z.number().int().min(1).max(50).default(10).optional().describe('Items per page'),
            search: z.string().optional().describe('Search keyword, title, or SKU'),
            categoryId: z.number().int().optional().describe('Category filter ID'),
        },
        async (args) => {
            try {
                const data = await ecomClient.getMerchantProducts({
                    page: args.page,
                    limit: args.limit,
                    search: args.search,
                    categoryId: args.categoryId
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error fetching merchant products: ${error.message}` }],
                };
            }
        }
    );
}
