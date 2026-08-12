import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
    port: number;
    transportMode: 'stdio' | 'sse';
    ecomServiceUrl: string;
    userServiceUrl: string;
    ordersServiceUrl: string;
    paymentsServiceUrl: string;
    serviceApiKey: string;
    ecomTimeoutMs: number;
    recEngineUrl: string;
    jwtSecret: string;
    llmProvider: string;
    openaiApiKey?: string;
    geminiApiKey?: string;
    geminiModel?: string;
}

export const config: AppConfig = {
    port: parseInt(process.env.PORT || '3005', 10),
    transportMode: (process.env.TRANSPORT_MODE === 'sse' ? 'sse' : 'stdio') as 'stdio' | 'sse',
    ecomServiceUrl: (process.env.ECOM_SERVICE_URL || 'https://microservices.shoppinggate.app/ecom').replace(/\/$/, ''),
    userServiceUrl: (process.env.USERS_SERVICE_URL || 'https://microservices.shoppinggate.app/users').replace(/\/$/, ''),
    ordersServiceUrl: (process.env.ORDERS_SERVICE_URL || 'https://microservices.shoppinggate.app/orders').replace(/\/$/, ''),
    paymentsServiceUrl: (process.env.PAYMENTS_SERVICE_URL || 'https://microservices.shoppinggate.app/payments').replace(/\/$/, ''),
    serviceApiKey: process.env.SERVICE_API_KEY || 'O5Xpb9Lho$NooI@7@Q>ztCpGVCQ',
    ecomTimeoutMs: parseInt(process.env.ECOM_SERVICE_TIMEOUT_MS || '8000', 10),
    recEngineUrl: (process.env.RECOMMENDATION_ENGINE_URL || 'https://microservices.shoppinggate.app/aiengine').replace(/\/$/, ''),
    jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey',
    llmProvider: process.env.LLM_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
};
