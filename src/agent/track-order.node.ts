import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from './agent-state.js';
import { ecomClient } from '../services/ecomClient.js';
import { logger } from '../middleware/logging.js';

export async function trackOrderNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  logger('Executing track_order_node', 'info');

  if (!state.authToken || !state.userId) {
    return {
      messages: [new AIMessage({ content: 'Authentication required: Please provide a valid Bearer JWT to track order status.' })],
      error: 'AUTHENTICATION_REQUIRED'
    };
  }

  const lastMsg = state.messages[state.messages.length - 1];
  const text = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
  const match = text.match(/order\s*#?\s*(\d+|\w+)/i) || text.match(/(\d+)/);
  const orderId = match ? match[1] : '1';

  try {
    const tracking = await ecomClient.trackCustomerOrder(orderId);

    return {
      messages: [new AIMessage({ content: `Order Tracking Information for Order #${orderId}:\n${JSON.stringify(tracking, null, 2)}` })]
    };
  } catch (err: any) {
    return {
      messages: [new AIMessage({ content: `Failed to track order: ${err.message}` })],
      error: err.message
    };
  }
}
