import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from './agent-state.js';
import { ecomClient } from '../services/ecomClient.js';
import { logger } from '../middleware/logging.js';

export async function cartNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  logger('Executing cart_node', 'info');

  if (!state.authToken || !state.userId) {
    return {
      messages: [new AIMessage({ content: 'Authentication required: Please provide a valid Bearer JWT to manage your cart.' })],
      error: 'AUTHENTICATION_REQUIRED'
    };
  }

  try {
    const cartData = await ecomClient.manageCart({ action: 'view' });

    return {
      cart: cartData,
      messages: [new AIMessage({ content: `Here is your current shopping cart:\n${JSON.stringify(cartData, null, 2)}` })]
    };
  } catch (err: any) {
    return {
      messages: [new AIMessage({ content: `Failed to retrieve cart: ${err.message}` })],
      error: err.message
    };
  }
}
