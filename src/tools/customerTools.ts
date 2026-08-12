import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ecomClient } from '../services/ecomClient.js';
import { toolRegistry } from '../registry/tool-registry.js';

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
     * Track delivery status, shipment updates, or look up orders by Customer User ID or Order ID.
     */
    server.tool(
        'track_customer_order',
        'Track delivery status, shipment updates, or look up customer orders by Customer User ID (e.g. 8362, 8543) or Order ID (e.g. ORD-2026-102, 102).',
        {
            orderId: z.union([z.number(), z.string()]).describe('Customer Order ID (e.g. ORD-2026-102, 102) OR Customer User ID (e.g. 8362, 8543)'),
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

    /**
     * Customer Tool 7: check_shipping_eta
     * Check delivery timeline, carrier ETA, and shipping cost for any product
     */
    server.tool(
        'check_shipping_eta',
        'Check estimated delivery timeline, express shipping availability, and delivery cost to any Saudi city for a product.',
        {
            productIdOrName: z.union([z.number(), z.string()]).describe('Product ID or product title name (e.g. 1 or "Running Sports Shoes")'),
            destinationCity: z.string().default('Riyadh').describe('Destination city in KSA (e.g. Riyadh, Jeddah, Dammam)'),
        },
        async (args) => {
            try {
                const data = await ecomClient.checkShippingEta(args);
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
                    content: [{ type: 'text', text: `Error checking shipping ETA: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 8: get_product_reviews
     * Retrieve customer star ratings, reviews, and feedback for a product
     */
    server.tool(
        'get_product_reviews',
        'Get customer star ratings (1-5), user reviews, and feedback comments for a product by ID or name.',
        {
            productIdOrName: z.union([z.number(), z.string()]).describe('Product ID or product title name (e.g. 1, 7, or "Magnetic Leather Wallet iPhone Cover")'),
            page: z.number().int().min(1).default(1).optional(),
            limit: z.number().int().min(1).max(50).default(10).optional(),
        },
        async (args) => {
            try {
                const data = await ecomClient.getProductReviews(args);
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
                    content: [{ type: 'text', text: `Error fetching product reviews: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 9: list_product_categories
     */
    server.tool(
        'list_product_categories',
        'List store product categories, subcategories, and icons.',
        { lang: z.enum(['en', 'ar']).default('en').optional() },
        async (args) => {
            const data = await ecomClient.listCategories(args.lang);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 10: list_brand_storefronts
     */
    server.tool(
        'list_brand_storefronts',
        'List store brands and official brand storefronts.',
        { lang: z.enum(['en', 'ar']).default('en').optional() },
        async (args) => {
            const data = await ecomClient.listBrands(args.lang);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 11: get_return_policy_and_reasons
     */
    server.tool(
        'get_return_policy_and_reasons',
        'Get store return window rules, refund policies, and valid return reason options.',
        {},
        async () => {
            const data = await ecomClient.getReturnPolicy();
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 12: submit_return_request
     */
    server.tool(
        'submit_return_request',
        'Submit a return/refund request for an order item.',
        {
            orderId: z.union([z.number(), z.string()]).describe('Order ID or Order Number'),
            productId: z.union([z.number(), z.string()]).describe('Product ID or Product Name'),
            reasonId: z.number().int().default(1).describe('Return reason ID'),
            comments: z.string().optional().describe('Customer notes or defect details'),
        },
        async (args) => {
            const authCheck = ecomClient.validateToolAuth('submit_return_request');
            if (!authCheck.authorized) {
                return { content: [{ type: 'text', text: JSON.stringify(authCheck.response, null, 2) }] };
            }
            const data = await ecomClient.submitReturnRequest(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 13: manage_cart
     */
    server.tool(
        'manage_cart',
        'PRIMARY CART TOOL: View shopping cart contents, add items, update quantities, remove specific items, or clear cart.',
        {
            action: z.enum(['view', 'add', 'update', 'remove', 'clear']).default('view').describe('Cart action: view, add item, update quantity, remove specific item, or clear entire cart'),
            productId: z.union([z.number(), z.string()]).optional().describe('Product ID or product title to add/update/remove'),
            cartId: z.number().int().optional().describe('Cart item ID to remove or update'),
            quantity: z.number().int().min(0).default(1).optional().describe('Item quantity'),
        },
        async (args) => {
            const authCheck = ecomClient.validateToolAuth('manage_cart');
            if (!authCheck.authorized) {
                return { content: [{ type: 'text', text: JSON.stringify(authCheck.response, null, 2) }] };
            }
            const data = await ecomClient.manageCart(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 14: manage_wishlist
     */
    server.tool(
        'manage_wishlist',
        'Save products to customer wishlist, view saved wishlist, or remove items.',
        {
            action: z.enum(['view', 'add', 'remove']).default('view'),
            productId: z.union([z.number(), z.string()]).optional(),
        },
        async (args) => {
            const authCheck = ecomClient.validateToolAuth('manage_wishlist');
            if (!authCheck.authorized) {
                return { content: [{ type: 'text', text: JSON.stringify(authCheck.response, null, 2) }] };
            }
            const data = await ecomClient.manageWishlist(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 15: search_flights
     */
    server.tool(
        'search_flights',
        'Search flight tickets (origin city/IATA, destination city/IATA, departure date, passenger count).',
        {
            origin: z.string().describe('Origin city or IATA code (e.g. RUH, Riyadh)'),
            destination: z.string().describe('Destination city or IATA code (e.g. JED, Jeddah, DXB)'),
            departureDate: z.string().optional().describe('Departure date YYYY-MM-DD'),
            passengers: z.number().int().positive().default(1).optional(),
        },
        async (args) => {
            const data = await ecomClient.searchFlights(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 16: search_airports
     */
    server.tool(
        'search_airports',
        'Look up airport names, city locations, and IATA codes (e.g. RUH, JED, DXB).',
        { query: z.string().describe('City name or IATA airport code') },
        async (args) => {
            const data = await ecomClient.searchAirports(args.query);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 17: search_hotels
     */
    server.tool(
        'search_hotels',
        'Search hotel stays by city, check-in date, check-out date, and guest count.',
        {
            city: z.string().describe('City location for hotel stay (e.g. Riyadh, Dubai)'),
            checkIn: z.string().optional().describe('Check-in date YYYY-MM-DD'),
            checkOut: z.string().optional().describe('Check-out date YYYY-MM-DD'),
            guests: z.number().int().positive().default(2).optional(),
        },
        async (args) => {
            const data = await ecomClient.searchHotels(args);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 18: get_hotel_details
     */
    server.tool(
        'get_hotel_details',
        'Get room types, night rates, amenities, and cancellation policies for a hotel.',
        { hotelIdOrName: z.union([z.number(), z.string()]).describe('Hotel ID or hotel name') },
        async (args) => {
            const data = await ecomClient.getHotelDetail(args.hotelIdOrName);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
    );

    /**
     * Customer Tool 19: customer_login
     * Authenticate customer account using phone number or email and OTP/password.
     */
    server.tool(
        'customer_login',
        'PRIMARY LOGIN TOOL: Log in customer using phone number or email and OTP/password to access profile, name, email, and cart.',
        {
            phone: z.string().optional().describe('Customer phone number (e.g. 512345670, +966512345670)'),
            email: z.string().optional().describe('Customer email address'),
            otp: z.string().optional().describe('One-time passcode (OTP) (e.g. 123456)'),
            password: z.string().optional().describe('Customer password'),
            name: z.string().optional().describe('Customer full name'),
            lang: z.enum(['en', 'ar']).default('en').optional().describe('Response language'),
        },
        async (args) => {
            try {
                const data = await ecomClient.customerLogin(args);
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
                    content: [{ type: 'text', text: `Error logging in customer: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 20: get_user_profile
     * Fetch current customer user profile (Name, Email, Phone, Membership Tier, Wallet Balance).
     */
    server.tool(
        'get_user_profile',
        'Get authenticated customer profile details including real name, email, phone, membership tier, and wallet balance.',
        {},
        async () => {
            try {
                const data = await ecomClient.getUserProfile();
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
                    content: [{ type: 'text', text: `Error fetching user profile: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 21: place_order_and_checkout
     * Place order from customer cart and process payment (Credit Card, Tamara, Apple Pay, Wallet)
     */
    server.tool(
        'place_order_and_checkout',
        'PRIMARY CHECKOUT & PAYMENT TOOL: Place order from customer cart and execute payment using Card, Tamara BNPL, Apple Pay, or Wallet balance.',
        {
            paymentType: z.number().int().min(1).max(4).default(1).optional().describe('Payment type: 1=>Card/Credit, 2=>Tamara BNPL, 3=>Apple Pay, 4=>Wallet Balance'),
            paymentCardId: z.string().optional().describe('Card ID if paying by card'),
            transactionId: z.string().optional().describe('Transaction ID if paying via Tamara/Apple Pay'),
            isWalletIncluded: z.boolean().default(false).optional().describe('Include wallet balance in payment'),
            deliveryAddressId: z.number().int().default(74).optional().describe('Delivery address ID'),
            deliveryInstruction: z.string().optional().describe('Special delivery instructions'),
            promocodeId: z.number().int().optional().describe('Promo coupon code ID'),
        },
        async (args) => {
            const authCheck = ecomClient.validateToolAuth('place_order_and_checkout');
            if (!authCheck.authorized) {
                return { content: [{ type: 'text', text: JSON.stringify(authCheck.response, null, 2) }] };
            }
            try {
                const data = await ecomClient.placeOrder(args);
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
                    content: [{ type: 'text', text: `Error placing order: ${error.message}` }],
                };
            }
        }
    );

    /**
     * Customer Tool 22: cancel_customer_order
     * Cancel an order and initiate automatic payment refund
     */
    server.tool(
        'cancel_customer_order',
        'Cancel a customer order and initiate automatic refund to wallet or payment card.',
        {
            orderId: z.union([z.number(), z.string()]).describe('Order ID or Order Number to cancel'),
            reason: z.string().optional().describe('Reason for cancellation'),
        },
        async (args) => {
            const authCheck = ecomClient.validateToolAuth('cancel_customer_order');
            if (!authCheck.authorized) {
                return { content: [{ type: 'text', text: JSON.stringify(authCheck.response, null, 2) }] };
            }
            try {
                const data = await ecomClient.cancelCustomerOrder(args.orderId, args.reason);
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
                    content: [{ type: 'text', text: `Error cancelling order: ${error.message}` }],
                };
            }
        }
    );
}
