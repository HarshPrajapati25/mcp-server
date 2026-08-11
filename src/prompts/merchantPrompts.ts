import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerMerchantPrompts(server: McpServer) {
    /**
     * Prompt 1: merchant_daily_briefing
     * Generate store health overview, pending orders, and inventory warnings
     */
    server.prompt(
        'merchant_daily_briefing',
        {
            storeName: z.string().optional().describe('Name of the merchant store'),
            language: z.enum(['en', 'ar']).default('en').describe('Briefing language'),
        },
        ({ storeName, language }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Provide a comprehensive daily operational briefing for merchant store "${storeName || 'Shoppingate Merchant'}".
Include:
1. Catalog inventory status (check low stock items using get_product_details).
2. Order fulfillment summary (check pending and processing orders using list_merchant_orders).
3. Active promotional campaigns (check promotions using list_promotions).
4. Recommended actionable next steps for the store manager.

Please generate the briefing in ${language === 'ar' ? 'Arabic' : 'English'}.`,
                    },
                },
            ],
        })
    );

    /**
     * Prompt 2: product_copywriter
     * Generate bilingual product titles, key features, and SEO product descriptions
     */
    server.prompt(
        'product_copywriter',
        {
            productTitle: z.string().describe('Base title or model of the product'),
            category: z.string().optional().describe('Product category'),
            targetAudience: z.string().optional().describe('Target demographic or customer profile'),
        },
        ({ productTitle, category, targetAudience }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `You are an expert e-commerce copywriter for Shoppingate.
Create high-converting, professional product copy for:
- Product Title: ${productTitle}
- Category: ${category || 'General E-commerce'}
- Target Audience: ${targetAudience || 'General Consumers in KSA / GCC'}

Please provide:
1. Optimized Product Title (English & Arabic)
2. 5 Catchy Bullet Points highlighting benefits & features (English & Arabic)
3. SEO Meta Description (under 160 characters)
4. Full Product Story / Description suitable for product detail pages (PDP).`,
                    },
                },
            ],
        })
    );

    /**
     * Prompt 3: merchant_system_instructions
     * Directives for immediate tool execution & strict auth challenge handling
     */
    server.prompt(
        'merchant_system_instructions',
        {},
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `SYSTEM INSTRUCTIONS FOR SHOPPINGATE MERCHANT ASSISTANT:

1. IMMEDIATE TOOL CALL DIRECTIVE:
   - When a user asks to view orders, check stock levels, or manage promotions, IMMEDIATELY call the corresponding tool ('list_merchant_orders', 'get_product_details', etc.).
   - Do NOT ask clarifying questions first. Always execute the tool so authentication and data retrieval are evaluated instantly.

2. AUTHENTICATION CHALLENGE DIRECTIVE:
   - If a tool returns 'auth_required: true' or a 401 response, immediately inform the user:
     "🔒 Merchant Authentication Required: You must be logged in as a store administrator. Please log in at https://microservices.shoppinggate.app/sg-merchant/auth/login"`,
                    },
                },
            ],
        })
    );
}
