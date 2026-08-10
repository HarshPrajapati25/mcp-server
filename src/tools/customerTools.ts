import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ecomClient } from '../services/ecomClient.js';

export function registerCustomerTools(server: McpServer) {
    /**
     * Customer Tool 1: customer_search_products
     * Search product catalog for end-customers
     */
    server.tool(
        'customer_search_products',
        'PRIMARY PRODUCT SEARCH TOOL: Use this tool to search and find any products, items, iPhone cases, electronics, shoes, apparel, and deals for Shoppingate store customers by budget or name.',
        {
            query: z.string().describe('Customer search term or product name (e.g. black Nike shoes, iPhone 15 case)'),
            limit: z.number().int().min(1).max(20).default(10).describe('Number of recommendations to return'),
            minPrice: z.number().min(0).optional().describe('Minimum budget in SAR'),
            maxPrice: z.number().min(0).optional().describe('Maximum budget in SAR'),
            lang: z.enum(['en', 'ar']).default('en').describe('Customer language choice (en or ar)'),
        },
        async (args) => {
            try {
                const data = await ecomClient.searchProducts({
                    query: args.query,
                    limit: args.limit,
                    minPrice: args.minPrice,
                    maxPrice: args.maxPrice,
                    lang: args.lang,
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
                    content: [{ type: 'text', text: `Error searching products for customer: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 2: get_recommendations
     * Get personalized recommendation rails ("For You", "Trending", "Because You Viewed")
     */
    server.tool(
        'get_recommendations',
        'Get personalized product recommendations for a customer (Recommended for You, Trending, New Arrivals).',
        {
            userId: z.string().optional().describe('Customer user ID or guest session token'),
            lang: z.enum(['en', 'ar']).default('en').describe('Preferred response language'),
        },
        async (args) => {
            try {
                const data = await ecomClient.getHomeRecommendations(args.userId, args.lang);
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
                    content: [{ type: 'text', text: `Error fetching recommendations: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 3: get_similar_products
     * Find similar products for Product Detail Pages (PDP)
     */
    server.tool(
        'get_similar_products',
        'Find products similar to a given product ID for PDP recommendations.',
        {
            productId: z.number().int().positive().describe('Anchor product ID'),
            limit: z.number().int().min(1).max(10).default(6).describe('Number of similar items'),
            lang: z.enum(['en', 'ar']).default('en').describe('Language choice'),
        },
        async (args) => {
            try {
                const data = await ecomClient.getSimilarProducts(args.productId, args.limit, args.lang);
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
                    content: [{ type: 'text', text: `Error finding similar products: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 4: track_customer_order
     * Track delivery status of a customer order
     */
    server.tool(
        'track_customer_order',
        'Track the delivery status and shipping updates for a customer order.',
        {
            orderId: z.union([z.number().int().positive(), z.string()]).describe('Customer order ID'),
        },
        async (args) => {
            try {
                const data = await ecomClient.trackCustomerOrder(args.orderId);
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
                    content: [{ type: 'text', text: `Error tracking order: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 5: check_visa_guidance (Super-app capability)
     */
    server.tool(
        'check_visa_guidance',
        'Check visa requirements and package guidance for travel destinations in Shoppingate.',
        {
            destinationCountry: z.string().describe('Destination country (e.g. Turkey, UAE, UK, Schengen)'),
            nationality: z.string().optional().default('Saudi Arabia').describe('Customer nationality'),
        },
        async (args) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            service: 'visa',
                            destination: args.destinationCountry,
                            nationality: args.nationality,
                            visa_required: true,
                            options: [
                                { type: 'e-Visa', processing_time: '24-48 hours', fee_sar: 180 },
                                { type: 'Express Tourist Visa', processing_time: '12 hours', fee_sar: 320 },
                            ],
                            requirements: ['Passport valid for 6 months', 'Recent photo', 'Return flight confirmation'],
                        }, null, 2),
                    },
                ],
            };
        }
    );

    /**
     * Customer Tool 6: search_travel_insurance (Super-app capability)
     */
    server.tool(
        'search_travel_insurance',
        'Search travel insurance coverage plans for upcoming trips.',
        {
            destination: z.string().describe('Trip destination or region'),
            tripDurationDays: z.number().int().positive().default(7).describe('Duration of travel in days'),
        },
        async (args) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            service: 'insurance',
                            destination: args.destination,
                            duration_days: args.tripDurationDays,
                            plans: [
                                { name: 'Standard Travel Protect', coverage_usd: 50000, price_sar: 65 },
                                { name: 'Comprehensive Worldwide Protect', coverage_usd: 100000, price_sar: 110 },
                            ],
                        }, null, 2),
                    },
                ],
            };
        }
    );
}
