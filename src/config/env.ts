import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
    port: number;
    transportMode: 'stdio' | 'sse';
    ecomServiceUrl: string;
    serviceApiKey: string;
    ecomTimeoutMs: number;
    recEngineUrl: string;
}

export const config: AppConfig = {
    port: parseInt(process.env.PORT || '3005', 10),
    transportMode: (process.env.TRANSPORT_MODE === 'sse' ? 'sse' : 'stdio') as 'stdio' | 'sse',
    ecomServiceUrl: (process.env.ECOM_SERVICE_URL || 'https://microservices.shoppinggate.app/ecom').replace(/\/$/, ''),
    serviceApiKey: process.env.SERVICE_API_KEY || 'O5Xpb9Lho$NooI@7@Q>ztCpGVCQ',
    ecomTimeoutMs: parseInt(process.env.ECOM_SERVICE_TIMEOUT_MS || '8000', 10),
    recEngineUrl: (process.env.RECOMMENDATION_ENGINE_URL || 'https://microservices.shoppinggate.app/aiengine').replace(/\/$/, ''),
};
